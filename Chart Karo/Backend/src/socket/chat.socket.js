const mongoose = require("mongoose");
const messageService = require("../chat/message.service");
const conversationRepository = require("../chat/conversation.repository");
const { userRoom, isOnline, getActiveConversation } = require("./presence.socket");

const idOf = (value) => (value?._id || value).toString();
const roomOf = (conversationId) => `conversation:${conversationId}`;

function emitToUsers(io, userIds, event, payload) {
  userIds.forEach((id) => io.to(userRoom(id)).emit(event, payload));
}

// Compact delivery/seen info the client uses to draw the ticks.
function statusPayload(message) {
  return {
    messageId: message._id.toString(),
    conversationId: idOf(message.conversation),
    deliveredTo: (message.deliveredTo || []).map(idOf),
    seenBy: (message.seenBy || []).map(idOf),
  };
}

async function loadConversationFor(conversationId, userId) {
  if (!mongoose.isValidObjectId(conversationId)) return null;
  const conversation = await conversationRepository.findById(conversationId);
  if (!conversation) return null;

  const participantIds = conversation.participants.map(idOf);
  if (!participantIds.includes(userId)) return null;

  return { conversation, participantIds };
}

function initializeChatSocket(io, socket) {
  const userId = socket.user.id.toString();
  const userName = socket.profile?.name || "Someone";

  socket.on("join_conversation", async (conversationId) => {
    try {
      const loaded = await loadConversationFor(conversationId, userId);
      if (!loaded) return;

      socket.join(roomOf(conversationId));

      const changed = await messageService.markConversationSeen(conversationId, userId);
      changed.forEach((message) => {
        emitToUsers(io, loaded.participantIds, "message_status", statusPayload(message));
      });
    } catch (error) {
      console.error("join_conversation error:", error.message);
    }
  });

  socket.on("leave_conversation", (conversationId) => {
    socket.leave(roomOf(conversationId));
  });

  socket.on("send_message", async ({ conversationId, text } = {}) => {
    try {
      if (typeof text !== "string" || !text.trim()) return;

      const loaded = await loadConversationFor(conversationId, userId);
      if (!loaded) {
        throw new Error("You are not a participant in this conversation");
      }

      const { conversation, participantIds } = loaded;
      const message = await messageService.sendMessage(conversationId, userId, text);

      emitToUsers(io, participantIds, "new_message", message);

      const isGroup = conversation.type === "group";
      const groupName = isGroup ? conversation.group?.name || "Group" : null;
      let latest = null;

      for (const receiverId of participantIds.filter((id) => id !== userId)) {
        if (!isOnline(receiverId)) continue;

        latest = await messageService.markMessageAsDelivered(message._id, receiverId);

        const viewingThisChat = getActiveConversation(receiverId) === conversationId.toString();

        if (viewingThisChat) {
          latest = await messageService.markMessageAsSeen(message._id, receiverId);
        } else {
          io.to(userRoom(receiverId)).emit("new_notification", {
            type: "message",
            conversationId: conversationId.toString(),
            senderId: userId,
            messageId: message._id.toString(),
            text: message.text,
            userName: message.sender?.name || userName,
            userEmail: message.sender?.email || "",
            userAvatar: message.sender?.avatar || null,
            isGroup,
            groupName,
          });
        }
      }

      if (latest) {
        emitToUsers(io, participantIds, "message_status", statusPayload(latest));
      }
    } catch (error) {
      console.error("send_message error:", error.message);
      socket.emit("chat_error", { message: error.message });
    }
  });

  socket.on("typing", (conversationId) => {
    const room = roomOf(conversationId);
    if (!socket.rooms.has(room)) return;
    socket.to(room).emit("user_typing", { userId, userName, conversationId });
  });

  socket.on("stop_typing", (conversationId) => {
    const room = roomOf(conversationId);
    if (!socket.rooms.has(room)) return;
    socket.to(room).emit("user_stop_typing", { userId, conversationId });
  });
}

module.exports = { initializeChatSocket };
