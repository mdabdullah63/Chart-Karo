const express = require("express");
const messageController = require("./message.controller");
const { authMiddleware } = require("../middleware/auth.middleware");

const router = express.Router();

router.use(authMiddleware);

router.get("/:conversationId", messageController.getMessages);
router.post("/:conversationId", messageController.sendMessage);

module.exports = router;
