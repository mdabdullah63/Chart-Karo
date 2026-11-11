const express = require("express");
const conversationController = require("./conversation.controller");
const { authMiddleware } = require("../middleware/auth.middleware");

const router = express.Router();

router.use(authMiddleware);

router.get("/", conversationController.getConversations);
router.get("/:conversationId", conversationController.getConversationById);
router.post("/", conversationController.createConversation);

module.exports = router;
