const Contact = require("../models/contact.model");

function createContact(data) {
  return Contact.create(data);
}

function findContact(ownerId, contactId) {
  return Contact.findOne({ owner: ownerId, contact: contactId });
}

function getContacts(ownerId) {
  return Contact.find({ owner: ownerId }).populate(
    "contact",
    "name email avatar lastSeen"
  );
}

function deleteContact(ownerId, contactId) {
  return Contact.findOneAndDelete({ owner: ownerId, contact: contactId });
}

module.exports = {
  createContact,
  findContact,
  getContacts,
  deleteContact,
};
