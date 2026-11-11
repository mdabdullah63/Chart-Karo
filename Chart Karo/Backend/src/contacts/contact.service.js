const mongoose = require("mongoose");
const contactRepository = require("./contact.repository");
const userRepository = require("../users/user.repository");
const { httpError } = require("../utils/httpError");

async function addContact(ownerId, email) {
  const user = await userRepository.findByEmail(String(email).trim());

  if (!user) {
    throw httpError(404, "User not found");
  }

  if (user._id.toString() === ownerId.toString()) {
    throw httpError(400, "You cannot add yourself");
  }

  const existingContact = await contactRepository.findContact(ownerId, user._id);
  if (existingContact) {
    throw httpError(409, "Contact already exists");
  }

  return contactRepository.createContact({ owner: ownerId, contact: user._id });
}

function getContacts(ownerId) {
  return contactRepository.getContacts(ownerId);
}

async function removeContact(ownerId, contactId) {
  if (!mongoose.isValidObjectId(contactId)) {
    throw httpError(400, "Invalid contact id");
  }

  const contact = await contactRepository.deleteContact(ownerId, contactId);

  if (!contact) {
    throw httpError(404, "Contact not found");
  }

  return contact;
}

module.exports = { addContact, getContacts, removeContact };
