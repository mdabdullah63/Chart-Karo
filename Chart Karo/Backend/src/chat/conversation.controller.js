const conversationService = require("./conversation.service");

async function createConversation(req, res, next) {
  try {
    const { otherUserId } = req.body;

    if (!otherUserId) {
      return res.status(400).json({ success: false, message: "otherUserId is required" });
    }

    const conversation = await conversationService.createDirectConversation(
      req.user.id,
      otherUserId
    );

    res.status(201).json({ success: true, conversation });
  } catch (error) {
    next(error);
  }
}

async function getConversations(req, res, next) {
  try {
    const conversations = await conversationService.getConversations(req.user.id);
    res.status(200).json({ success: true, conversations });
  } catch (error) {
    next(error);
  }
}

async function getConversationById(req, res, next) {
  try {
    const conversation = await conversationService.getConversationById(
      req.params.conversationId,
      req.user.id
    );

    res.status(200).json({ success: true, conversation });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  createConversation,
  getConversations,
  getConversationById,
};
