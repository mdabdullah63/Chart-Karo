const mongoose = require("mongoose");
const groupRepository = require("./group.repository");
const conversationRepository = require("../chat/conversation.repository");
const messageRepository = require("../chat/message.repository");
const { httpError } = require("../utils/httpError");

const MAX_GROUP_MEMBERS = 256;

const sameId = (a, b) => a.toString() === b.toString();

function isOwnerOrAdmin(group, userId) {
  return sameId(group.owner, userId) || group.admins.some((adminId) => sameId(adminId, userId));
}

function cleanIds(ids) {
  if (!Array.isArray(ids)) return [];
  return [...new Set(ids.map(String).filter((id) => mongoose.isValidObjectId(id)))];
}

async function loadGroup(groupId) {
  if (!mongoose.isValidObjectId(groupId)) {
    throw httpError(400, "Invalid group id");
  }
  const group = await groupRepository.getGroupById(groupId);
  if (!group) {
    throw httpError(404, "Group not found");
  }
  return group;
}

async function createGroup(userId, data = {}) {
  const { name, avatar, description } = data;

  if (!name || !String(name).trim()) {
    throw httpError(400, "Group name is required");
  }

  const members = cleanIds(data.members);
  const uniqueMembers = [...new Set([userId.toString(), ...members])];

  if (uniqueMembers.length < 2) {
    throw httpError(400, "Add at least one member to the group");
  }
  if (uniqueMembers.length > MAX_GROUP_MEMBERS) {
    throw httpError(400, `A group can have at most ${MAX_GROUP_MEMBERS} members`);
  }

  const group = await groupRepository.createGroup({
    name: String(name).trim().slice(0, 80),
    avatar: avatar || null,
    description: description ? String(description).trim().slice(0, 300) : "",
    owner: userId,
    members: uniqueMembers,
    admins: [userId],
  });

  const conversation = await conversationRepository.createConversation({
    type: "group",
    participants: uniqueMembers,
    group: group._id,
  });

  return { group, conversation, affectedUserIds: uniqueMembers };
}

async function getGroupById(groupId, userId) {
  const group = await loadGroup(groupId);

  if (!group.members.some((memberId) => sameId(memberId, userId))) {
    throw httpError(403, "You are not a member of this group");
  }

  return group;
}

function getMyGroups(userId) {
  return groupRepository.getMyGroups(userId);
}

async function addMembers(groupId, userId, memberIds) {
  const group = await loadGroup(groupId);

  if (!isOwnerOrAdmin(group, userId)) {
    throw httpError(403, "Only admin can add members");
  }

  const ids = cleanIds(memberIds);
  if (!ids.length) {
    throw httpError(400, "No valid members provided");
  }
  if (group.members.length + ids.length > MAX_GROUP_MEMBERS) {
    throw httpError(400, `A group can have at most ${MAX_GROUP_MEMBERS} members`);
  }

  const updated = await groupRepository.addMembers(groupId, ids);
  await conversationRepository.addParticipantsByGroup(groupId, ids);

  return { group: updated, affectedUserIds: ids };
}

async function removeMember(groupId, userId, memberId) {
  const group = await loadGroup(groupId);

  if (!mongoose.isValidObjectId(memberId)) {
    throw httpError(400, "Invalid member id");
  }

  const isSelfLeave = sameId(memberId, userId);

  if (!isSelfLeave && !isOwnerOrAdmin(group, userId)) {
    throw httpError(403, "Only admin can remove members");
  }

  if (sameId(group.owner, memberId)) {
    throw httpError(400, "Owner cannot be removed");
  }

  const updated = await groupRepository.removeMember(groupId, memberId);
  await conversationRepository.removeParticipantByGroup(groupId, memberId);

  return { group: updated, affectedUserIds: [memberId.toString()] };
}

async function makeAdmin(groupId, userId, memberId) {
  const group = await loadGroup(groupId);

  if (!sameId(group.owner, userId)) {
    throw httpError(403, "Only owner can make admin");
  }

  if (!group.members.some((id) => sameId(id, memberId))) {
    throw httpError(400, "User is not a group member");
  }

  return groupRepository.makeAdmin(groupId, memberId);
}

async function removeAdmin(groupId, userId, memberId) {
  const group = await loadGroup(groupId);

  if (!sameId(group.owner, userId)) {
    throw httpError(403, "Only owner can remove admin");
  }

  if (sameId(group.owner, memberId)) {
    throw httpError(400, "Owner cannot be demoted");
  }

  return groupRepository.removeAdmin(groupId, memberId);
}

async function updateGroup(groupId, userId, data = {}) {
  const group = await loadGroup(groupId);

  if (!isOwnerOrAdmin(group, userId)) {
    throw httpError(403, "Only admin can update group");
  }

  // Whitelist: never let the client overwrite owner / members / admins.
  const changes = {};
  if (typeof data.name === "string" && data.name.trim()) changes.name = data.name.trim().slice(0, 80);
  if (typeof data.description === "string") changes.description = data.description.trim().slice(0, 300);
  if (typeof data.avatar === "string" || data.avatar === null) changes.avatar = data.avatar;

  if (!Object.keys(changes).length) {
    throw httpError(400, "Nothing to update");
  }

  return groupRepository.updateGroup(groupId, changes);
}

async function deleteGroup(groupId, userId) {
  const group = await loadGroup(groupId);

  if (!sameId(group.owner, userId)) {
    throw httpError(403, "Only owner can delete group");
  }

  const conversation = await conversationRepository.deleteByGroup(groupId);
  if (conversation) {
    await messageRepository.deleteByConversation(conversation._id);
  }
  await groupRepository.deleteGroup(groupId);

  return { affectedUserIds: group.members.map(String) };
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
