import React, { useState } from "react";
import { MdPeople, MdPersonAdd, MdChat, MdDelete, MdClose, MdWarning } from "react-icons/md";
import { useNavigate } from "react-router-dom";

import {
  useGetContactsQuery,
  useAddContactMutation,
  useRemoveContactMutation,
  useCreateConversationMutation,
} from "../../../redux/api/chatApi";
import { useSocket } from "../../../context/SocketContext";
export default function Contacts() {
  const navigate = useNavigate();
  const { onlineUsers } = useSocket();

  const { data: contacts = [], isLoading } = useGetContactsQuery();
  const [addContact, { isLoading: adding }] = useAddContactMutation();
  const [removeContact, { isLoading: removing }] = useRemoveContactMutation();
  const [createConversation] = useCreateConversationMutation();

  const [showModal, setShowModal] = useState(false);
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [startingChatWith, setStartingChatWith] = useState(null);
  const [deleteContactId, setDeleteContactId] = useState(null);
  const [chatError, setChatError] = useState("");

  const handleAddContact = async (e) => {
    e.preventDefault();
    setError("");

    if (!email.trim()) {
      setError("Please enter an email address");
      return;
    }

    try {
      await addContact(email.trim()).unwrap();
      setEmail("");
      setShowModal(false);
    } catch (err) {
      setError(err?.data?.message || "Could not add contact");
    }
  };

  const confirmRemove = async () => {
    if (!deleteContactId) return;

    try {
      await removeContact(deleteContactId).unwrap();
      setDeleteContactId(null);
    } catch (err) {
      setError(err?.data?.message || "Could not remove contact");
      setDeleteContactId(null);
    }
  };

  const handleStartChat = async (contactUserId) => {
    try {
      setStartingChatWith(contactUserId);
      const conversation = await createConversation(contactUserId).unwrap();
      navigate("/dashboard/chats", { state: { conversationId: conversation._id } });
    } catch (err) {
      setChatError(err?.data?.message || "Could not start chat");
    } finally {
      setStartingChatWith(null);
    }
  };

  if (isLoading) {
    return (
      <div className="content-card">
        <p>Loading contacts...</p>
      </div>
    );
  }

  return (
    <div className="contacts-page">
      <div className="contacts-header">
        <h2>Your Contacts</h2>
        <button className="add-contact-btn" onClick={() => setShowModal(true)}>
          <MdPersonAdd />
          Add Contact
        </button>
      </div>

      {contacts.length === 0 ? (
        <div className="content-card">
          <MdPeople />
          <h2>No contacts yet</h2>
          <p>Add a contact using their email to start chatting.</p>
        </div>
      ) : (
        <div className="contacts-list">
          {contacts.map((c) => (
            <div className="contact-row" key={c._id}>
              <div className="contact-avatar">
                {c.avatar ? (
                  <img src={c.avatar} alt={c.name} />
                ) : (
                  <span>{c.name?.charAt(0)?.toUpperCase() || "?"}</span>
                )}
                {onlineUsers.has(c._id) && <span className="online-dot" />}
              </div>

              <div className="contact-info">
                <h4>{c.name}</h4>
                <p>{c.email}</p>
              </div>

              <div className="contact-actions">
                <button
                  className="chat-icon-btn"
                  title="Chat"
                  onClick={() => handleStartChat(c._id)}
                  disabled={startingChatWith === c._id}
                >
                  <MdChat />
                </button>

                <button
                  className="remove-icon-btn"
                  title="Remove"
                  onClick={() => setDeleteContactId(c._id)}
                >
                  <MdDelete />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div className="contact-modal-overlay" onClick={() => setShowModal(false)}>
          <div className="contact-modal" onClick={(e) => e.stopPropagation()}>
            <div className="contact-modal-header">
              <h3>Add Contact</h3>
              <button onClick={() => setShowModal(false)}>
                <MdClose />
              </button>
            </div>

            <form onSubmit={handleAddContact}>
              <p className="contact-modal-hint">
                Enter the email of a registered user to add them to your contacts.
              </p>

              <input
                type="email"
                placeholder="user@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoFocus
              />

              {error && <p className="contact-modal-error">{error}</p>}

              <button type="submit" className="add-contact-submit" disabled={adding}>
                {adding ? "Adding..." : "Add Contact"}
              </button>
            </form>
          </div>
        </div>
      )}

      {deleteContactId && (
        <div className="delete-modal-overlay" onClick={() => setDeleteContactId(null)}>
          <div className="delete-modal" onClick={(e) => e.stopPropagation()}>
            <div className="delete-modal-icon">
              <MdWarning />
            </div>
            <h3>Remove Contact?</h3>
            <p>Are you sure you want to remove this contact? You can add them again later.</p>

            <div className="delete-modal-actions">
              <button
                className="delete-cancel-btn"
                onClick={() => setDeleteContactId(null)}
                disabled={removing}
              >
                Cancel
              </button>
              <button className="delete-confirm-btn" onClick={confirmRemove} disabled={removing}>
                {removing ? "Removing..." : "Remove"}
              </button>
            </div>
          </div>
        </div>
      )}

      {chatError && (
        <div className="chat-error-overlay">
          <div className="chat-error-modal">
            <button className="chat-error-close" onClick={() => setChatError("")}>
              <MdClose />
            </button>
            <div className="chat-error-icon">
              <MdWarning />
            </div>
            <h3>Unable to Start Chat</h3>
            <p>{chatError}</p>
            <button className="chat-error-btn" onClick={() => setChatError("")}>
              Okay
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
