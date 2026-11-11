const mongoose = require("mongoose");
const messageRepository = require("./message.repository");
const conversationRepository = require("./conversation.repository");
const { httpError } = require("../utils/httpError");

const MAX_MESSAGE_LENGTH = 4000;

async function assertParticipant(conversationId, userId) {
  if (!mongoose.isValidObjectId(conversationId)) {
    throw httpError(400, "Invalid conversation id");
  }
  const allowed = await conversationRepository.isParticipant(conversationId, userId);
  if (!allowed) {
    throw httpError(403, "You are not a participant in this conversation");
  }
}

async function sendMessage(conversationId, senderId, text) {
  if (!text || !String(text).trim()) {
    throw httpError(400, "Message text is required");
  }
  if (String(text).length > MAX_MESSAGE_LENGTH) {
    throw httpError(400, `Message is too long (max ${MAX_MESSAGE_LENGTH} characters)`);
  }

  await assertParticipant(conversationId, senderId);

  const message = await messageRepository.createMessage({
    conversation: conversationId,
    sender: senderId,
    text: String(text).trim(),
  });

  await conversationRepository.updateLastMessage(conversationId, message._id);

  return messageRepository.findById(message._id);
}

async function getMessages(conversationId, userId) {
  await assertParticipant(conversationId, userId);
  return messageRepository.getMessagesByConversation(conversationId);
}

async function markMessageAsDelivered(messageId, userId) {
  return messageRepository.markMessageAsDelivered(messageId, userId);
}

async function markMessageAsSeen(messageId, userId) {
  return messageRepository.markMessageAsSeen(messageId, userId);
}

async function markConversationSeen(conversationId, userId) {
  await assertParticipant(conversationId, userId);
  return messageRepository.markConversationSeen(conversationId, userId);
}

module.exports = {
  sendMessage,
  getMessages,
  markMessageAsDelivered,
  markMessageAsSeen,
  markConversationSeen,
};
