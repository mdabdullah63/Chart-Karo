const express = require("express");
const contactController = require("./contact.controller");
const { authMiddleware } = require("../middleware/auth.middleware");

const router = express.Router();

router.use(authMiddleware);

router.get("/", contactController.getContacts);
router.post("/", contactController.addContact);
router.delete("/:contactUserId", contactController.removeContact);

module.exports = router;
