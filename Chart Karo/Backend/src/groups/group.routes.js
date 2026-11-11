const express = require("express");
const groupController = require("./group.controller");
const { authMiddleware } = require("../middleware/auth.middleware");

const router = express.Router();

router.use(authMiddleware);

router.post("/", groupController.createGroup);
router.get("/", groupController.getMyGroups);
router.get("/:groupId", groupController.getGroupById);
router.post("/:groupId/members", groupController.addMembers);
router.delete("/:groupId/members", groupController.removeMember);
router.post("/:groupId/admins", groupController.makeAdmin);
router.delete("/:groupId/admins", groupController.removeAdmin);
router.patch("/:groupId", groupController.updateGroup);
router.delete("/:groupId", groupController.deleteGroup);

module.exports = router;
