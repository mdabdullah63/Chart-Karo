import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  MdChat,
  MdSend,
  MdGroup,
  MdAddComment,
  MdArrowBack,
  MdSearch,
  MdClose,
} from "react-icons/md";
import { useOutletContext, useLocation, useNavigate } from "react-router-dom";

import {
  useGetConversationsQuery,
  useGetMessagesQuery,
  useGetContactsQuery,
  useCreateConversationMutation,
} from "../../../redux/api/chatApi";
import { useSocket } from "../../../context/SocketContext";
import { resolveAssetUrl } from "../../../config/env";

const idOf = (value) => (value?._id || value)?.toString();

function getOtherParticipant(conversation, currentUserId) {
  if (!conversation?.participants) return null;
  return (
    conversation.participants.find((p) => idOf(p) !== currentUserId) ||
    conversation.participants[0]
  );
}

function getConversationDisplay(conversation, currentUserId) {
  if (!conversation) return { name: "Unknown", avatar: null, isGroup: false, other: null };

  if (conversation.type === "group") {
    return {
      name: conversation.group?.name || "Group",
      avatar: resolveAssetUrl(conversation.group?.avatar),
      isGroup: true,
      other: null,
    };
  }

  const other = getOtherParticipant(conversation, currentUserId);
  return {
    name: other?.name || "Unknown",
    avatar: resolveAssetUrl(other?.avatar),
    isGroup: false,
    other,
  };
}

function formatTime(date) {
  return new Date(date).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function isSameDay(a, b) {
  return new Date(a).toDateString() === new Date(b).toDateString();
}

function formatDay(date) {
  const d = new Date(date);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);

  if (isSameDay(d, today)) return "Today";
  if (isSameDay(d, yesterday)) return "Yesterday";
  return d.toLocaleDateString([], { day: "numeric", month: "short", year: "numeric" });
}

function formatListTime(date) {
  if (!date) return "";
  return isSameDay(date, new Date())
    ? formatTime(date)
    : new Date(date).toLocaleDateString([], { day: "numeric", month: "short" });
}

// sent -> delivered -> seen, computed from who the server says got/saw it.
function getMessageStatus(msg, conversation, currentUserId) {
  const others = (conversation?.participants || [])
    .map(idOf)
    .filter((id) => id !== currentUserId);

  const delivered = new Set((msg.deliveredTo || []).map(idOf));
  const seen = new Set((msg.seenBy || []).map(idOf));

  if (others.length > 0 && others.every((id) => seen.has(id))) return "seen";
  if (others.some((id) => delivered.has(id))) return "delivered";
  return "sent";
}

const STATUS_SYMBOL = { sent: "✓", delivered: "✓✓", seen: "●" };

function Avatar({ src, name, isGroup, online }) {
  return (
    <div className="chat-list-avatar">
      {src ? (
        <img src={src} alt={name} />
      ) : isGroup ? (
        <span>
          <MdGroup />
        </span>
      ) : (
        <span>{name?.charAt(0)?.toUpperCase() || "?"}</span>
      )}
      {online && <span className="online-dot" />}
    </div>
  );
}

export default function Chats() {
  const navigate = useNavigate();
  const { user } = useOutletContext();
  const location = useLocation();
  const { socket, connected, onlineUsers, clearConversationNotifications } = useSocket();
  const currentUserId = idOf(user);

  const {
    data: conversations = [],
    isLoading: conversationsLoading,
    isFetching: conversationsFetching,
  } = useGetConversationsQuery();
  const { data: contacts = [] } = useGetContactsQuery();
  const [createConversation, { isLoading: startingChat }] = useCreateConversationMutation();

  const [selectedId, setSelectedId] = useState(location.state?.conversationId || null);
  const [draft, setDraft] = useState("");
  const [typingUsers, setTypingUsers] = useState({});
  const [showContactPicker, setShowContactPicker] = useState(false);
  const [lastSeenUsers, setLastSeenUsers] = useState({});
  const [search, setSearch] = useState("");
  const [sendError, setSendError] = useState("");

  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const typingExpiryRef = useRef({});

  const {
    data: messages = [],
    isLoading: messagesLoading,
    isError: messagesError,
  } = useGetMessagesQuery(selectedId, { skip: !selectedId });

  const selectedConversation = useMemo(
    () => conversations.find((c) => c._id === selectedId) || null,
    [conversations, selectedId]
  );

  const {
    name: headerName,
    avatar: headerAvatar,
    isGroup: selectedIsGroup,
    other: otherUser,
  } = getConversationDisplay(selectedConversation, currentUserId);

  const selectConversation = (id) => {
    setSelectedId(id);
    if (id) clearConversationNotifications(id);
  };

  // Opened from Contacts / Notifications
  useEffect(() => {
    const id = location.state?.conversationId;
    if (id) {
      setSelectedId(id);
      clearConversationNotifications(id);
    }
  }, [location.state, clearConversationNotifications]);

  // A conversation can disappear (group deleted / you were removed).
  useEffect(() => {
    if (selectedId && !conversationsLoading && !conversationsFetching && !selectedConversation) {
      setSelectedId(null);
    }
  }, [selectedId, selectedConversation, conversationsLoading, conversationsFetching]);

  // Join the socket room (re-join automatically after a reconnect).
  useEffect(() => {
    if (!socket || !connected || !selectedId) return undefined;

    socket.emit("join_conversation", selectedId);
    socket.emit("chat:open", { conversationId: selectedId });

    return () => {
      socket.emit("leave_conversation", selectedId);
      socket.emit("chat:close");
    };
  }, [socket, connected, selectedId]);

  // Typing indicators / last seen / send errors
  useEffect(() => {
    setTypingUsers({});
  }, [selectedId]);

  useEffect(() => {
    if (!socket) return undefined;

    const expiry = typingExpiryRef.current;

    const removeTyping = (userId) =>
      setTypingUsers((prev) => {
        if (!(userId in prev)) return prev;
        const next = { ...prev };
        delete next[userId];
        return next;
      });

    const handleTyping = ({ userId, userName, conversationId }) => {
      if (conversationId !== selectedId || userId === currentUserId) return;
      setTypingUsers((prev) => ({ ...prev, [userId]: userName || "Someone" }));
      clearTimeout(expiry[userId]);
      expiry[userId] = setTimeout(() => removeTyping(userId), 4000);
    };

    const handleStopTyping = ({ userId }) => {
      clearTimeout(expiry[userId]);
      removeTyping(userId);
    };

    const handleUserOffline = ({ userId, lastSeen }) => {
      setLastSeenUsers((prev) => ({ ...prev, [userId]: lastSeen }));
    };

    const handleChatError = ({ message }) => setSendError(message || "Message could not be sent");

    socket.on("user_typing", handleTyping);
    socket.on("user_stop_typing", handleStopTyping);
    socket.on("user_offline", handleUserOffline);
    socket.on("chat_error", handleChatError);

    return () => {
      socket.off("user_typing", handleTyping);
      socket.off("user_stop_typing", handleStopTyping);
      socket.off("user_offline", handleUserOffline);
      socket.off("chat_error", handleChatError);
      Object.values(expiry).forEach(clearTimeout);
    };
  }, [socket, selectedId, currentUserId]);

  useEffect(() => {
    if (!sendError) return undefined;
    const timer = setTimeout(() => setSendError(""), 4000);
    return () => clearTimeout(timer);
  }, [sendError]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, selectedId]);

  useEffect(() => () => clearTimeout(typingTimeoutRef.current), []);

  const handleSend = (e) => {
    e.preventDefault();
    const text = draft.trim();
    if (!text || !socket || !connected || !selectedId) return;

    socket.emit("send_message", { conversationId: selectedId, text });
    socket.emit("stop_typing", selectedId);
    clearTimeout(typingTimeoutRef.current);
    setDraft("");
  };

  const handleTypingInput = (value) => {
    setDraft(value);
    if (!socket || !selectedId) return;

    socket.emit("typing", selectedId);
    clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => socket.emit("stop_typing", selectedId), 1200);
  };

  const handleStartChat = async (contactUserId) => {
    try {
      const conversation = await createConversation(contactUserId).unwrap();
      selectConversation(conversation._id);
      setShowContactPicker(false);
    } catch (error) {
      setSendError(error?.data?.message || "Could not start the conversation");
      setShowContactPicker(false);
    }
  };

  const filteredConversations = useMemo(() => {
    const value = search.trim().toLowerCase();
    if (!value) return conversations;

    return conversations.filter((conv) => {
      const { name } = getConversationDisplay(conv, currentUserId);
      return (
        name.toLowerCase().includes(value) ||
        (conv.lastMessage?.text || "").toLowerCase().includes(value)
      );
    });
  }, [conversations, search, currentUserId]);

  const otherIsOnline = Boolean(otherUser && onlineUsers.has(idOf(otherUser)));
  const lastSeen = lastSeenUsers[idOf(otherUser)] || otherUser?.lastSeen;
  const typingNames = Object.values(typingUsers);

  let statusText;
  if (typingNames.length > 0) {
    statusText = selectedIsGroup
      ? `${typingNames.slice(0, 2).join(", ")} typing...`
      : "typing...";
  } else if (selectedIsGroup) {
    statusText = `Group · ${selectedConversation?.participants?.length || 0} members`;
  } else if (otherIsOnline) {
    statusText = "Online";
  } else if (lastSeen) {
    statusText = `Last seen ${formatTime(lastSeen)}`;
  } else {
    statusText = "Offline";
  }

  return (
    <div className="chat-workspace-grid">
      <aside className={`chat-list-panel ${selectedId ? "hide-on-mobile" : ""}`}>
        <div className="chat-list-header">
          <h3>Chats</h3>

          <div className="chat-list-header-actions">
            <button
              type="button"
              className="new-chat-icon-btn"
              onClick={() => setShowContactPicker(true)}
              title="New chat"
              aria-label="New chat"
            >
              <MdAddComment />
            </button>
            <button
              type="button"
              className="new-chat-icon-btn"
              onClick={() => navigate("/dashboard/group")}
              title="New group"
              aria-label="New group"
            >
              <MdGroup />
            </button>
          </div>
        </div>

        <div className="chat-search">
          <MdSearch aria-hidden="true" />
          <input
            type="text"
            placeholder="Search chats"
            aria-label="Search chats"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {search && (
            <button type="button" aria-label="Clear search" onClick={() => setSearch("")}>
              <MdClose />
            </button>
          )}
        </div>

        {conversationsLoading ? (
          <p className="chat-list-empty">Loading...</p>
        ) : conversations.length === 0 ? (
          <p className="chat-list-empty">No conversations yet. Tap + to start one.</p>
        ) : filteredConversations.length === 0 ? (
          <p className="chat-list-empty">No chats match “{search}”.</p>
        ) : (
          <div className="chat-list">
            {filteredConversations.map((conv) => {
              const display = getConversationDisplay(conv, currentUserId);
              const isOnline = !display.isGroup && display.other && onlineUsers.has(idOf(display.other));

              return (
                <button
                  key={conv._id}
                  type="button"
                  className={`chat-list-item ${selectedId === conv._id ? "active" : ""}`}
                  onClick={() => selectConversation(conv._id)}
                >
                  <Avatar
                    src={display.avatar}
                    name={display.name}
                    isGroup={display.isGroup}
                    online={isOnline}
                  />

                  <div className="chat-list-text">
                    <div className="chat-list-row">
                      <h4>{display.name}</h4>
                      {conv.lastMessage?.createdAt && (
                        <time>{formatListTime(conv.lastMessage.createdAt)}</time>
                      )}
                    </div>
                    <p>{conv.lastMessage?.text || "Say hello 👋"}</p>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </aside>

      <section className={`chat-window-panel ${!selectedId ? "hide-on-mobile" : ""}`}>
        {!selectedId ? (
          <div className="chat-empty-state">
            <div className="chat-empty-icon">
              <MdChat />
            </div>
            <h2>Welcome back, {user?.name || "User"}!</h2>
            <p>Pick a conversation from the list or start a new one.</p>
            <button type="button" className="start-chat-btn" onClick={() => setShowContactPicker(true)}>
              <MdAddComment />
              New Chat
            </button>
          </div>
        ) : (
          <>
            <div className="chat-window-header">
              <button
                type="button"
                className="back-btn"
                onClick={() => setSelectedId(null)}
                aria-label="Back to chats"
              >
                <MdArrowBack />
              </button>

              <Avatar
                src={headerAvatar}
                name={headerName}
                isGroup={selectedIsGroup}
                online={!selectedIsGroup && otherIsOnline}
              />

              <div className="chat-window-title">
                <h4>{headerName}</h4>
                <span className={`chat-status ${typingNames.length ? "typing" : ""}`}>
                  {statusText}
                </span>
              </div>
            </div>

            <div className="chat-messages">
              {messagesLoading ? (
                <p className="chat-list-empty">Loading messages...</p>
              ) : messagesError ? (
                <p className="chat-list-empty">Could not load this conversation.</p>
              ) : messages.length === 0 ? (
                <p className="chat-list-empty">No messages yet. Say hi!</p>
              ) : (
                messages.map((msg, index) => {
                  const senderId = idOf(msg.sender);
                  const isMine = senderId === currentUserId;
                  const prev = messages[index - 1];
                  const newDay = !prev || !isSameDay(prev.createdAt, msg.createdAt);
                  const showSender =
                    selectedIsGroup && !isMine && (newDay || idOf(prev.sender) !== senderId);
                  const status = isMine
                    ? getMessageStatus(msg, selectedConversation, currentUserId)
                    : null;

                  return (
                    <React.Fragment key={msg._id}>
                      {newDay && (
                        <div className="chat-day-divider">
                          <span>{formatDay(msg.createdAt)}</span>
                        </div>
                      )}

                      <div className={`chat-bubble-row ${isMine ? "mine" : "theirs"}`}>
                        <div className="chat-bubble">
                          {showSender && (
                            <strong className="chat-bubble-sender">
                              {msg.sender?.name || "Member"}
                            </strong>
                          )}
                          <p>{msg.text}</p>
                          <span className="chat-bubble-time">
                            {formatTime(msg.createdAt)}
                            {status && (
                              <span
                                className={`message-status ${status}`}
                                title={status}
                                aria-label={status}
                              >
                                {STATUS_SYMBOL[status]}
                              </span>
                            )}
                          </span>
                        </div>
                      </div>
                    </React.Fragment>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {sendError && (
              <div className="chat-send-error" role="alert">
                {sendError}
              </div>
            )}

            <form className="chat-input-bar" onSubmit={handleSend}>
              <input
                type="text"
                placeholder={connected ? "Type a message..." : "Reconnecting..."}
                aria-label="Message"
                value={draft}
                maxLength={4000}
                autoComplete="off"
                onChange={(e) => handleTypingInput(e.target.value)}
              />

              <button type="submit" disabled={!draft.trim() || !connected} aria-label="Send message">
                <MdSend />
              </button>
            </form>
          </>
        )}
      </section>

      {showContactPicker && (
        <div className="contact-modal-overlay" onClick={() => setShowContactPicker(false)}>
          <div className="contact-modal" onClick={(e) => e.stopPropagation()}>
            <div className="contact-modal-header">
              <h3>Start a chat</h3>
              <button type="button" aria-label="Close" onClick={() => setShowContactPicker(false)}>
                <MdClose />
              </button>
            </div>

            {contacts.length === 0 ? (
              <p className="contact-modal-hint">
                You have no contacts yet. Add someone by email from the Contacts page first.
              </p>
            ) : (
              <div className="picker-contact-list">
                {contacts.map((c) => (
                  <button
                    type="button"
                    key={c._id}
                    className="picker-contact-row"
                    disabled={startingChat}
                    onClick={() => handleStartChat(c._id)}
                  >
                    {c.name} <span>({c.email})</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
