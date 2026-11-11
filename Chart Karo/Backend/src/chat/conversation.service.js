const mongoose = require("mongoose");
const conversationRepository = require("./conversation.repository");
const userRepository = require("../users/user.repository");
const { httpError } = require("../utils/httpError");

async function createDirectConversation(userId, otherUserId) {
  if (!mongoose.isValidObjectId(otherUserId)) {
    throw httpError(400, "Invalid user");
  }
  if (otherUserId.toString() === userId.toString()) {
    throw httpError(400, "You cannot chat with yourself");
  }

  const otherUser = await userRepository.findById(otherUserId);
  if (!otherUser) {
    throw httpError(404, "User not found");
  }

  let conversation = await conversationRepository.findDirectConversation(userId, otherUserId);

  if (!conversation) {
    conversation = await conversationRepository.createConversation({
      type: "direct",
      participants: [userId, otherUserId],
    });
  }

  return conversationRepository.findById(conversation._id);
}

function getConversations(userId) {
  return conversationRepository.getUserConversations(userId);
}

async function getConversationById(conversationId, userId) {
  if (!mongoose.isValidObjectId(conversationId)) {
    throw httpError(400, "Invalid conversation id");
  }

  const conversation = await conversationRepository.findById(conversationId);

  if (!conversation) {
    throw httpError(404, "Conversation not found");
  }

  const isParticipant = conversation.participants.some(
    (user) => user._id.toString() === userId.toString()
  );

  if (!isParticipant) {
    throw httpError(403, "You are not a participant in this conversation");
  }

  return conversation;
}

module.exports = {
  createDirectConversation,
  getConversations,
  getConversationById,
};
