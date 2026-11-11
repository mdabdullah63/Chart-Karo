const userRepository = require("../users/user.repository");
const socketsByUser = new Map();
const activeConversationByUser = new Map();
function userRoom(userId) {
  return `user:${userId}`;
}
function getSocketIds(userId) {
  return socketsByUser.get(userId) || new Set();
}
function isOnline(userId) {
  return getSocketIds(userId).size > 0;
}
function setActiveConversation(userId, conversationId) {
  if (conversationId) {
    activeConversationByUser.set(userId, conversationId.toString());
  }
}
function clearActiveConversation(userId) {
  activeConversationByUser.delete(userId);
}
function getActiveConversation(userId) {
  return activeConversationByUser.get(userId);
}
function initializePresenceSocket(io, socket) {
  const userId = socket.user.id.toString();
  socket.join(userRoom(userId));
  const wasOffline = !isOnline(userId);
  if (!socketsByUser.has(userId)) {
    socketsByUser.set(userId, new Set());
  }
  socketsByUser.get(userId).add(socket.id);
  socket.emit("online_users", { userIds: Array.from(socketsByUser.keys()) });
  if (wasOffline) {
    io.emit("user_online", { userId });
  }

  socket.on("chat:open", ({ conversationId }) => {
    setActiveConversation(userId, conversationId);
  });

  socket.on("chat:close", () => {
    clearActiveConversation(userId);
  });

  socket.on("disconnect", async () => {
    const sockets = getSocketIds(userId);
    sockets.delete(socket.id);

    if (sockets.size > 0) return;

    socketsByUser.delete(userId);
    clearActiveConversation(userId);

    try {
      const lastSeen = new Date();
      await userRepository.updateById(userId, { lastSeen });
      io.emit("user_offline", { userId, lastSeen });
    } catch (error) {
      console.error("Failed to update lastSeen:", error.message);
    }
  });
}
module.exports = {
  initializePresenceSocket,
  userRoom,
  isOnline,
  setActiveConversation,
  clearActiveConversation,
  getActiveConversation,
};
