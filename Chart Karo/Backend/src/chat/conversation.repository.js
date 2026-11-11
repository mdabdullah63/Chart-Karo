const Conversation = require("../models/conversation.model");

function createConversation(data) {
  return Conversation.create(data);
}

function findById(conversationId) {
  return Conversation.findById(conversationId)
    .populate("participants", "name email avatar")
    .populate("group")
    .populate("lastMessage");
}

function findDirectConversation(userId, otherUserId) {
  return Conversation.findOne({
    type: "direct",
    participants: { $all: [userId, otherUserId], $size: 2 },
  });
}

function getUserConversations(userId) {
  return Conversation.find({ participants: userId })
    .populate("participants", "name email avatar")
    .populate("group")
    .populate("lastMessage")
    .sort({ updatedAt: -1 });
}

function updateLastMessage(conversationId, messageId) {
  return Conversation.findByIdAndUpdate(
    conversationId,
    { lastMessage: messageId },
    { new: true }
  );
}

function isParticipant(conversationId, userId) {
  return Conversation.exists({ _id: conversationId, participants: userId });
}

function findByGroup(groupId) {
  return Conversation.findOne({ group: groupId });
}

function addParticipantsByGroup(groupId, userIds) {
  return Conversation.findOneAndUpdate(
    { group: groupId },
    { $addToSet: { participants: { $each: userIds } } },
    { new: true }
  );
}

function removeParticipantByGroup(groupId, userId) {
  return Conversation.findOneAndUpdate(
    { group: groupId },
    { $pull: { participants: userId } },
    { new: true }
  );
}

function deleteByGroup(groupId) {
  return Conversation.findOneAndDelete({ group: groupId });
}

module.exports = {
  isParticipant,
  findByGroup,
  addParticipantsByGroup,
  removeParticipantByGroup,
  deleteByGroup,
  createConversation,
  findById,
  findDirectConversation,
  getUserConversations,
  updateLastMessage,
};
