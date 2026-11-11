const contactService = require("./contact.service");

async function addContact(req, res, next) {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ success: false, message: "Email is required" });
    }

    const contact = await contactService.addContact(req.user.id, email);
    res.status(201).json({ success: true, message: "Contact added successfully", contact });
  } catch (error) {
    next(error);
  }
}

async function getContacts(req, res, next) {
  try {
    const contacts = await contactService.getContacts(req.user.id);
    res.status(200).json({ success: true, contacts });
  } catch (error) {
    next(error);
  }
}

async function removeContact(req, res, next) {
  try {
    await contactService.removeContact(req.user.id, req.params.contactUserId);
    res.status(200).json({ success: true, message: "Contact removed successfully" });
  } catch (error) {
    next(error);
  }
}

module.exports = { addContact, getContacts, removeContact };
