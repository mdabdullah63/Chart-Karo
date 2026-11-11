const Group = require("../models/group.model");

function createGroup(data) {
  return Group.create(data);
}

function getGroupById(groupId) {
  return Group.findById(groupId);
}

function getMyGroups(userId) {
  return Group.find({ members: userId });
}

function addMembers(groupId, memberIds) {
  return Group.findByIdAndUpdate(
    groupId,
    { $addToSet: { members: { $each: memberIds } } },
    { new: true }
  );
}

function removeMember(groupId, memberId) {
  return Group.findByIdAndUpdate(
    groupId,
    { $pull: { members: memberId, admins: memberId } },
    { new: true }
  );
}

function makeAdmin(groupId, memberId) {
  return Group.findByIdAndUpdate(
    groupId,
    { $addToSet: { admins: memberId } },
    { new: true }
  );
}

function removeAdmin(groupId, memberId) {
  return Group.findByIdAndUpdate(
    groupId,
    { $pull: { admins: memberId } },
    { new: true }
  );
}

function updateGroup(groupId, data) {
  return Group.findByIdAndUpdate(groupId, data, { new: true, runValidators: true });
}

function deleteGroup(groupId) {
  return Group.findByIdAndDelete(groupId);
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
