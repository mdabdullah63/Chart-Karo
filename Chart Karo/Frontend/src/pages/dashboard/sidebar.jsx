import React from "react";
import { NavLink } from "react-router-dom";
import {
  MdLogout,
  MdChat,
  MdPeople,
  MdNotifications,
  MdSettings,
  MdClose,
  MdLocationOn,
} from "react-icons/md";

import { useSocket } from "../../context/SocketContext";
export default function Sidebar({ sidebarOpen, setSidebarOpen, handleLogout }) {
  const { notifications } = useSocket();

  return (
    <>
      {sidebarOpen && <div className="sidebar-overlay" onClick={() => setSidebarOpen(false)} />}

      <aside className={`dashboard-sidebar ${sidebarOpen ? "sidebar-open" : ""}`}>
        <div className="sidebar-header">
          <div className="sidebar-logo">CK</div>

          <div className="sidebar-brand">
            <h2>Chat Karo</h2>
            <span>Messaging App</span>
          </div>

          <button
            className="sidebar-close-btn"
            onClick={() => setSidebarOpen(false)}
            aria-label="Close menu"
          >
            <MdClose />
          </button>
        </div>

        <nav className="sidebar-navigation">
          <NavLink to="/dashboard/chats" className="sidebar-item" onClick={() => setSidebarOpen(false)}>
            <MdChat />
            <span>Chats</span>
          </NavLink>

          <NavLink to="/dashboard/contacts" className="sidebar-item" onClick={() => setSidebarOpen(false)}>
            <MdPeople />
            <span>Contacts</span>
          </NavLink>

          <NavLink
            to="/dashboard/notifications"
            className="sidebar-item"
            onClick={() => setSidebarOpen(false)}
          >
            <MdNotifications />
            <span>Notifications</span>
            {notifications.length > 0 && (
              <span className="sidebar-badge">{notifications.length}</span>
            )}
          </NavLink>

          <NavLink
            to="/dashboard/location"
            className="sidebar-item"
            onClick={() => setSidebarOpen(false)}
          >
            <MdLocationOn />
            <span>Location</span>
          </NavLink>
          <NavLink
            to="/dashboard/settings"
            className="sidebar-item"
            onClick={() => setSidebarOpen(false)}
          >
            <MdSettings />
            <span>Settings</span>
          </NavLink>
        </nav>

        <div className="sidebar-footer">
          <button className="sidebar-logout" onClick={handleLogout}>
            <MdLogout />
            <span>Logout</span>
          </button>
        </div>
      </aside>
    </>
  );
}
