import React from "react";
import { MdNotifications, MdMenu } from "react-icons/md";
import { useLocation, useNavigate } from "react-router-dom";

import ThemeToggle from "../../components/ThemeToggle";
import { useSocket } from "../../context/SocketContext";
import { resolveAssetUrl } from "../../config/env";
const PAGE_INFO = {
  chats: {
    title: "Messages",
    subtitle: "Manage your active conversations",
  },
  contacts: {
    title: "Contacts",
    subtitle: "Manage your contacts",
  },
  notifications: {
    title: "Notifications",
    subtitle: "Catch up on what you missed",
  },
  group: {
    title: "New group",
    subtitle: "Create a group chat",
  },
  location: {
    title: "Location",
    subtitle: "Share and view live locations",
  },
  settings: {
    title: "Settings",
    subtitle: "Manage your account settings",
  },
};

export default function Topbar({
  setSidebarOpen,
  userName,
  userEmail,
  userAvatar,
}) {
  const location = useLocation();
  const navigate = useNavigate();
  const { notifications = [] } = useSocket();

  const currentPath = location.pathname;

  const activePage =
    Object.keys(PAGE_INFO).find((page) =>
      currentPath.toLowerCase().includes(`/dashboard/${page}`)
    ) || "chats";

  const { title, subtitle } = PAGE_INFO[activePage];

  const userInitial =
    userName?.trim()?.charAt(0)?.toUpperCase() || "U";

  const avatarUrl = resolveAssetUrl(userAvatar);

  const handleAvatarError = (e) => {
    e.currentTarget.style.display = "none";

    const fallback = e.currentTarget.nextElementSibling;

    if (fallback) {
      fallback.style.display = "flex";
    }
  };

  return (
    <header className="dashboard-topbar">
      <div className="topbar-left">
        <button
          type="button"
          className="mobile-menu-btn"
          onClick={() => setSidebarOpen(true)}
          aria-label="Open Menu"
        >
          <MdMenu />
        </button>

        <div>
          <h1>{title}</h1>
          <span>{subtitle}</span>
        </div>
      </div>

      <div className="topbar-actions">
        <ThemeToggle className="topbar-icon" />

        <button
          type="button"
          className="topbar-icon notification-button"
          aria-label="Notifications"
          onClick={() => navigate("/dashboard/notifications")}
        >
          <MdNotifications />

          {notifications.length > 0 && (
            <span className="notification-badge">
              {notifications.length > 99 ? "99+" : notifications.length}
            </span>
          )}
        </button>

        <div className="topbar-profile">
          {avatarUrl ? (
            <img
              src={avatarUrl}
              alt={userName || "User"}
              onError={handleAvatarError}
            />
          ) : null}

          <span
            className="topbar-user-initial"
            style={{
              display: avatarUrl ? "none" : "flex",
            }}
          >
            {userInitial}
          </span>

          <div className="topbar-user-info">
            <strong>{userName || "User"}</strong>
            <span>{userEmail || ""}</span>
          </div>
        </div>
      </div>
    </header>
  );
}
