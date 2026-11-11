const Message = require("../models/message.model");

function createMessage(data) {
  return Message.create(data);
}

function findById(messageId) {
  return Message.findById(messageId).populate("sender", "name email avatar");
}

function getMessagesByConversation(conversationId) {
  return Message.find({ conversation: conversationId })
    .populate("sender", "name email avatar")
    .sort({ createdAt: 1 });
}

function markMessageAsDelivered(messageId, userId) {
  return Message.findByIdAndUpdate(
    messageId,
    { $addToSet: { deliveredTo: userId } },
    { new: true }
  );
}

function markMessageAsSeen(messageId, userId) {
  return Message.findByIdAndUpdate(
    messageId,
    { $addToSet: { deliveredTo: userId, seenBy: userId } },
    { new: true }
  );
}

function deleteByConversation(conversationId) {
  return Message.deleteMany({ conversation: conversationId });
}

// Marks every message the user has not seen yet as delivered + seen. Returns the changed messages.
async function markConversationSeen(conversationId, userId) {
  const unseen = await Message.find({
    conversation: conversationId,
    sender: { $ne: userId },
    seenBy: { $ne: userId },
  }).select("_id");

  if (!unseen.length) return [];

  const ids = unseen.map((m) => m._id);
  await Message.updateMany(
    { _id: { $in: ids } },
    { $addToSet: { deliveredTo: userId, seenBy: userId } }
  );

  return Message.find({ _id: { $in: ids } }).select("conversation deliveredTo seenBy");
}

module.exports = {
  deleteByConversation,
  markConversationSeen,
  createMessage,
  findById,
  getMessagesByConversation,
  markMessageAsDelivered,
  markMessageAsSeen,
};
