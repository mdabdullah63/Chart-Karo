import React, { createContext, useCallback, useContext, useEffect, useState } from "react";
import { io } from "socket.io-client";
import { useDispatch } from "react-redux";
import { API_URL } from "../config/env";
import { chatApi } from "../redux/api/chatApi";

const SocketContext = createContext(null);

function getConversationId(message) {
  return message.conversation?._id || message.conversation;
}

export function SocketProvider({ userId, children }) {
  const dispatch = useDispatch();
  const [socket, setSocket] = useState(null);
  const [connected, setConnected] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState(new Set());
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    if (!userId) {
      setSocket(null);
      setConnected(false);
      setNotifications([]);
      return undefined;
    }

    // "" -> same origin (production). Otherwise the API url (local dev / split deploy).
    const socketInstance = io(API_URL || undefined, { withCredentials: true });
    setSocket(socketInstance);

    let refreshing = false;
    let refreshAttempts = 0;

    const patchMessage = (conversationId, messageId, changes) => {
      dispatch(
        chatApi.util.updateQueryData("getMessages", conversationId, (draft) => {
          const target = draft.find((msg) => msg._id === messageId);
          if (target) Object.assign(target, changes);
        })
      );
    };

    const refreshConversations = () => dispatch(chatApi.util.invalidateTags(["Conversations"]));

    const handleNewMessage = (message) => {
      const conversationId = getConversationId(message);

      dispatch(
        chatApi.util.updateQueryData("getMessages", conversationId, (draft) => {
          if (!draft.some((msg) => msg._id === message._id)) draft.push(message);
        })
      );

      refreshConversations();
    };

    const handleMessageStatus = ({ messageId, conversationId, deliveredTo, seenBy }) => {
      patchMessage(conversationId, messageId, { deliveredTo, seenBy });
    };

    const handleNewNotification = (notification) => {
      setNotifications((prev) =>
        prev.some((n) => n.messageId === notification.messageId) ? prev : [...prev, notification]
      );
      refreshConversations();
    };

    const handleOnlineUsers = ({ userIds }) => setOnlineUsers(new Set(userIds));

    const handleUserOnline = ({ userId: id }) =>
      setOnlineUsers((prev) => new Set(prev).add(id));

    const handleUserOffline = ({ userId: id }) =>
      setOnlineUsers((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });

    // The access token lives 15 minutes. If a reconnect is rejected because it
    // expired, refresh the session once and try again.
    const handleConnectError = async () => {
      if (refreshing || refreshAttempts >= 3) return;
      refreshing = true;
      refreshAttempts += 1;
      try {
        const res = await fetch(`${API_URL}/auth/refresh`, {
          method: "POST",
          credentials: "include",
        });
        if (res.ok) socketInstance.connect();
      } catch {
        /* offline - socket.io keeps retrying on its own */
      } finally {
        refreshing = false;
      }
    };

    socketInstance.on("connect", () => {
      refreshAttempts = 0;
      setConnected(true);
    });
    socketInstance.on("disconnect", () => setConnected(false));
    socketInstance.on("connect_error", handleConnectError);
    socketInstance.on("online_users", handleOnlineUsers);
    socketInstance.on("user_online", handleUserOnline);
    socketInstance.on("user_offline", handleUserOffline);
    socketInstance.on("new_message", handleNewMessage);
    socketInstance.on("message_status", handleMessageStatus);
    socketInstance.on("new_notification", handleNewNotification);
    socketInstance.on("conversations_changed", refreshConversations);

    return () => {
      socketInstance.removeAllListeners();
      socketInstance.disconnect();
      setSocket(null);
      setConnected(false);
    };
  }, [userId, dispatch]);

  const clearNotification = useCallback(
    (messageId) => setNotifications((prev) => prev.filter((n) => n.messageId !== messageId)),
    []
  );

  const clearConversationNotifications = useCallback(
    (conversationId) =>
      setNotifications((prev) => prev.filter((n) => n.conversationId !== conversationId)),
    []
  );

  const clearNotifications = useCallback(() => setNotifications([]), []);

  const value = {
    socket,
    connected,
    onlineUsers,
    notifications,
    clearNotification,
    clearConversationNotifications,
    clearNotifications,
  };

  return <SocketContext.Provider value={value}>{children}</SocketContext.Provider>;
}

export function useSocket() {
  const ctx = useContext(SocketContext);
  if (!ctx) throw new Error("useSocket must be used inside a SocketProvider");
  return ctx;
}
