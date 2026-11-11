import React, { useMemo, useState } from "react";

import {
  MdArrowBack,
  MdGroup,
  MdClose,
  MdPhotoCamera,
  MdPeople,
  MdSearch,
  MdCheck,
  MdGroupAdd,
} from "react-icons/md";

import { useNavigate } from "react-router-dom";

import { useGetContactsQuery, useCreateGroupMutation } from "../../../redux/api/chatApi";
export default function CreateGroup() {
  const navigate = useNavigate();

  const { data: contacts = [], isLoading } =
    useGetContactsQuery();

  const [createGroup, { isLoading: isCreating }] = useCreateGroupMutation();

  const [groupName, setGroupName] = useState("");
  const [search, setSearch] = useState("");
  const [selectedIds, setSelectedIds] = useState([]);
  const [createError, setCreateError] = useState("");

  // Search ke according contacts filter
  const filteredContacts = useMemo(() => {
    const value = search.trim().toLowerCase();

    if (!value) {
      return contacts;
    }

    return contacts.filter((contact) =>
      `${contact.name || ""} ${contact.email || ""}`
        .toLowerCase()
        .includes(value)
    );
  }, [contacts, search]);

  // Contact select / deselect
  const handleSelectMember = (contactId) => {
    setSelectedIds((prev) =>
      prev.includes(contactId)
        ? prev.filter((id) => id !== contactId)
        : [...prev, contactId]
    );
  };

  // Visible contacts ko select/deselect all
  const handleSelectAll = () => {
    const visibleIds = filteredContacts.map(
      (contact) => contact._id
    );

    const allSelected =
      visibleIds.length > 0 &&
      visibleIds.every((id) =>
        selectedIds.includes(id)
      );

    if (allSelected) {
      setSelectedIds((prev) =>
        prev.filter(
          (id) => !visibleIds.includes(id)
        )
      );
    } else {
      setSelectedIds((prev) => [
        ...new Set([...prev, ...visibleIds]),
      ]);
    }
  };

  // Selected members
  const selectedContacts = contacts.filter((contact) =>
    selectedIds.includes(contact._id)
  );

  const allVisibleSelected =
    filteredContacts.length > 0 &&
    filteredContacts.every((contact) =>
      selectedIds.includes(contact._id)
    );

  // Member remove
  const handleRemoveMember = (contactId) => {
    setSelectedIds((prev) =>
      prev.filter((id) => id !== contactId)
    );
  };

  // Group create
  const handleCreateGroup = async () => {
    if (
      !groupName.trim() ||
      selectedIds.length === 0
    ) {
      return;
    }

    setCreateError("");

    try {
      await createGroup({
        name: groupName.trim(),
        members: selectedIds,
      }).unwrap();

      navigate("/dashboard/chats");
    } catch (err) {
      setCreateError(
        err?.data?.message || "Failed to create group. Please try again."
      );
    }
  };

  if (isLoading) {
    return (
      <div className="create-group-page">
        <div className="create-group-loading">
          <div className="create-group-spinner"></div>
          <p>Loading contacts...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="create-group-page">

      {/* ================= HEADER ================= */}

      <div className="create-group-header">

        <button
          type="button"
          className="group-back-btn"
          onClick={() => navigate(-1)}
          title="Back"
        >
          <MdArrowBack />
        </button>

        <div className="create-group-title">
          <h2>Create Group</h2>
          <p>Create a new group conversation</p>
        </div>

      </div>

      {/* ================= GROUP INFO ================= */}

      <div className="group-info-card">

        {/* Group Avatar */}

        <div className="group-avatar-section">

          <div className="group-avatar-wrapper">

            <div className="group-avatar">
              <MdGroup />
            </div>

            <button
              type="button"
              className="group-avatar-camera"
              title="Add group photo"
            >
              <MdPhotoCamera />
            </button>

          </div>

        </div>

        {/* Group Name */}

        <div className="group-form">

          <label htmlFor="groupName">
            Group name
          </label>

          <div className="group-input-wrapper">

            <input
              id="groupName"
              type="text"
              placeholder="Enter group name"
              value={groupName}
              onChange={(e) =>
                setGroupName(e.target.value)
              }
              maxLength={50}
            />

            <span>
              {groupName.length}/50
            </span>

          </div>

        </div>

      </div>

      {/* ================= MEMBERS ================= */}

      <div className="group-members-section">

        {/* Members Header */}

        <div className="group-members-header">

          <div className="members-heading">

            <div className="members-heading-icon">
              <MdPeople />
            </div>

            <div>
              <h3>Members</h3>

              <p>
                {selectedIds.length === 0
                  ? "Select people to add to the group"
                  : `${selectedIds.length} ${selectedIds.length === 1
                    ? "member"
                    : "members"
                  } selected`}
              </p>
            </div>

          </div>

          <span className="members-count">
            {selectedIds.length}
          </span>

        </div>

        {/* Search + Select All */}

        <div className="members-toolbar">

          <div className="members-search">

            <MdSearch />

            <input
              type="text"
              placeholder="Search contacts..."
              value={search}
              onChange={(e) =>
                setSearch(e.target.value)
              }
            />

          </div>

          {filteredContacts.length > 0 && (
            <button
              type="button"
              className={`select-all-members ${allVisibleSelected
                  ? "selected"
                  : ""
                }`}
              onClick={handleSelectAll}
            >
              <span className="select-all-icon">
                {allVisibleSelected && <MdCheck />}
              </span>

              {allVisibleSelected
                ? "Deselect All"
                : "Select All"}
            </button>
          )}

        </div>

        {/* Contacts */}

        {filteredContacts.length === 0 ? (

          <div className="no-members">

            <div className="no-members-icon">
              <MdPeople />
            </div>

            <p>
              {search
                ? "No contacts found"
                : "No contacts available"}
            </p>

            <small>
              {search
                ? "Try another name or email"
                : "Add contacts first"}
            </small>

          </div>

        ) : (

          <div className="available-members-list">

            {filteredContacts.map((contact) => {

              const isSelected =
                selectedIds.includes(
                  contact._id
                );

              return (
                <button
                  type="button"
                  key={contact._id}
                  className={`available-member ${isSelected
                      ? "selected"
                      : ""
                    }`}
                  onClick={() =>
                    handleSelectMember(
                      contact._id
                    )
                  }
                >

                  {/* Avatar */}

                  <div className="group-member-avatar">

                    {contact.avatar ? (
                      <img
                        src={contact.avatar}
                        alt={contact.name}
                      />
                    ) : (
                      <span>
                        {contact.name
                          ?.charAt(0)
                          ?.toUpperCase() ||
                          "?"}
                      </span>
                    )}

                  </div>

                  {/* User Info */}

                  <div className="group-member-info">

                    <h4>
                      {contact.name ||
                        "Unknown User"}
                    </h4>

                    <p>
                      {contact.email ||
                        "No email"}
                    </p>

                  </div>

                  {/* Checkbox */}

                  <span
                    className={`member-checkbox ${isSelected
                        ? "checked"
                        : ""
                      }`}
                  >
                    {isSelected && <MdCheck />}
                  </span>

                </button>
              );
            })}

          </div>
        )}

      </div>

      {/* ================= SELECTED MEMBERS ================= */}

      {selectedContacts.length > 0 && (
        <div className="selected-members-section">

          <div className="selected-members-header">

            <div>
              <h3>Selected members</h3>

              <p>
                People who will be added to this group
              </p>
            </div>

            <span>
              {selectedContacts.length}
            </span>

          </div>

          <div className="selected-members-list">

            {selectedContacts.map((contact) => (
              <div
                className="selected-member"
                key={contact._id}
              >

                <div className="selected-member-avatar">

                  {contact.avatar ? (
                    <img
                      src={contact.avatar}
                      alt={contact.name}
                    />
                  ) : (
                    <span>
                      {contact.name
                        ?.charAt(0)
                        ?.toUpperCase() ||
                        "?"}
                    </span>
                  )}

                </div>

                <div className="selected-member-info">

                  <strong>
                    {contact.name ||
                      "Unknown User"}
                  </strong>

                  <span>
                    {contact.email}
                  </span>

                </div>

                <button
                  type="button"
                  className="remove-member-btn"
                  onClick={() =>
                    handleRemoveMember(
                      contact._id
                    )
                  }
                  title="Remove member"
                >
                  <MdClose />
                </button>

              </div>
            ))}

          </div>

        </div>
      )}

      {/* ================= FOOTER ================= */}

      <div className="create-group-footer">

        <div className="create-footer-info">

          <div className="footer-group-icon">
            <MdGroup />
          </div>

          <div>

            <strong>
              {groupName.trim() ||
                "New group"}
            </strong>

            <span>
              {selectedContacts.length}{" "}
              {selectedContacts.length === 1
                ? "member"
                : "members"}
            </span>

          </div>

        </div>

        <div className="create-footer-actions">

          <button
            type="button"
            className="cancel-group-btn"
            onClick={() => navigate(-1)}
          >
            Cancel
          </button>

          <button
            type="button"
            className="create-group-btn"
            disabled={
              !groupName.trim() ||
              selectedContacts.length === 0 ||
              isCreating
            }
            onClick={handleCreateGroup}
          >
            <MdGroupAdd />
            {isCreating ? "Creating..." : "Create Group"}
          </button>

        </div>

        {createError && (
          <p className="create-group-error">{createError}</p>
        )}

      </div>

    </div>
  );
}
