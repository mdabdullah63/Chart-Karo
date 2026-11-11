const messageService = require("./message.service");

async function getMessages(req, res, next) {
  try {
    const messages = await messageService.getMessages(req.params.conversationId, req.user.id);
    res.status(200).json({ success: true, messages });
  } catch (error) {
    next(error);
  }
}

async function sendMessage(req, res, next) {
  try {
    const { text } = req.body;

    const message = await messageService.sendMessage(
      req.params.conversationId,
      req.user.id,
      text
    );

    res.status(201).json({ success: true, message });
  } catch (error) {
    next(error);
  }
}

async function markDelivered(req, res, next) {
  try {
    const message = await messageService.markMessageAsDelivered(
      req.params.messageId,
      req.user.id
    );

    res.status(200).json({ success: true, message });
  } catch (error) {
    next(error);
  }
}

async function markSeen(req, res, next) {
  try {
    const message = await messageService.markMessageAsSeen(
      req.params.messageId,
      req.user.id
    );

    res.status(200).json({ success: true, message });
  } catch (error) {
    next(error);
  }
}

module.exports = { getMessages, sendMessage, markDelivered, markSeen };
