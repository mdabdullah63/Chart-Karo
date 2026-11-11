const groupService = require("./group.service");
const { userRoom } = require("../socket/presence.socket");

// Tell affected users (live) to refresh their conversation list.
function notifyConversationsChanged(req, userIds = []) {
  const io = req.app.get("io");
  if (!io) return;
  userIds.forEach((id) => io.to(userRoom(id)).emit("conversations_changed"));
}

async function createGroup(req, res, next) {
  try {
    const { group, conversation, affectedUserIds } = await groupService.createGroup(
      req.user.id,
      req.body
    );
    notifyConversationsChanged(req, affectedUserIds);
    res.status(201).json({ success: true, group, conversation });
  } catch (error) {
    next(error);
  }
}

async function getGroupById(req, res, next) {
  try {
    const group = await groupService.getGroupById(req.params.groupId, req.user.id);
    res.status(200).json({ success: true, group });
  } catch (error) {
    next(error);
  }
}

async function getMyGroups(req, res, next) {
  try {
    const groups = await groupService.getMyGroups(req.user.id);
    res.status(200).json({ success: true, groups });
  } catch (error) {
    next(error);
  }
}

async function addMembers(req, res, next) {
  try {
    const { group, affectedUserIds } = await groupService.addMembers(
      req.params.groupId,
      req.user.id,
      req.body.memberIds
    );
    notifyConversationsChanged(req, [...group.members.map(String), ...affectedUserIds]);
    res.status(200).json({ success: true, group });
  } catch (error) {
    next(error);
  }
}

async function removeMember(req, res, next) {
  try {
    const { group, affectedUserIds } = await groupService.removeMember(
      req.params.groupId,
      req.user.id,
      req.body.memberId
    );
    notifyConversationsChanged(req, [...group.members.map(String), ...affectedUserIds]);
    res.status(200).json({ success: true, group });
  } catch (error) {
    next(error);
  }
}

async function makeAdmin(req, res, next) {
  try {
    const group = await groupService.makeAdmin(req.params.groupId, req.user.id, req.body.memberId);
    res.status(200).json({ success: true, group });
  } catch (error) {
    next(error);
  }
}

async function removeAdmin(req, res, next) {
  try {
    const group = await groupService.removeAdmin(req.params.groupId, req.user.id, req.body.memberId);
    res.status(200).json({ success: true, group });
  } catch (error) {
    next(error);
  }
}

async function updateGroup(req, res, next) {
  try {
    const group = await groupService.updateGroup(req.params.groupId, req.user.id, req.body);
    notifyConversationsChanged(req, group.members.map(String));
    res.status(200).json({ success: true, group });
  } catch (error) {
    next(error);
  }
}

async function deleteGroup(req, res, next) {
  try {
    const { affectedUserIds } = await groupService.deleteGroup(req.params.groupId, req.user.id);
    notifyConversationsChanged(req, affectedUserIds);
    res.status(200).json({ success: true, message: "Group deleted successfully" });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  createGroup,
  getGroupById,
  getMyGroups,
  addMembers,
  removeMember,
  makeAdmin,
  removeAdmin,
  updateGroup,
  deleteGroup,
};
