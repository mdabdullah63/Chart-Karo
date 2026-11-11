import React from "react";
import { MdNotifications } from "react-icons/md";
import { useNavigate } from "react-router-dom";
import { useSocket } from "../../../context/SocketContext";
import { resolveAssetUrl } from "../../../config/env";
export default function Notifications() {
  const navigate = useNavigate();
  const { notifications = [], clearNotification, clearNotifications } = useSocket();

  const handleNotificationClick = (notification) => {
    if (notification.type !== "message") return;

    clearNotification(notification.messageId);
    navigate("/dashboard/chats", { state: { conversationId: notification.conversationId } });
  };

  return (
    <main className="notifications-container">
      <header className="notifications-topbar">
        <div className="notifications-title">
          <h1>Notifications</h1>
          <p>
            {notifications.length} unread notification{notifications.length !== 1 ? "s" : ""}
          </p>
        </div>

        {notifications.length > 0 && (
          <button type="button" className="notifications-clear-btn" onClick={clearNotifications}>
            Clear all
          </button>
        )}
      </header>

      <section className="notifications-wrapper">
        {notifications.length === 0 ? (
          <div className="notifications-empty">
            <div className="notifications-empty-icon">
              <MdNotifications />
            </div>
            <h2>No new notifications</h2>
            <p>You're all caught up. New messages will appear here.</p>
          </div>
        ) : (
          <div className="notifications-items">
            {notifications.map((notification) => {
              const senderName = notification.userName || "Someone";
              const senderInitial = senderName.trim().charAt(0).toUpperCase();

              return (
                <button
                  type="button"
                  key={notification.messageId}
                  className="notifications-card"
                  onClick={() => handleNotificationClick(notification)}
                >
                  <div className="notifications-card-avatar">
                    {notification.userAvatar ? (
                      <img
                        src={resolveAssetUrl(notification.userAvatar)}
                        alt={senderName}
                        onError={(e) => {
                          e.currentTarget.style.display = "none";
                          e.currentTarget.nextElementSibling.style.display = "flex";
                        }}
                      />
                    ) : null}

                    <span
                      className="notifications-avatar-initial"
                      style={{ display: notification.userAvatar ? "none" : "flex" }}
                    >
                      {senderInitial}
                    </span>
                  </div>

                  <div className="notifications-card-body">
                    <div className="notifications-card-title">
                      <strong>{senderName}</strong>
                      <span>
                        {notification.isGroup
                          ? `sent a message in ${notification.groupName || "a group"}`
                          : "sent you a message"}
                      </span>
                    </div>
                    <p>{notification.text || "New message"}</p>
                  </div>

                  <span className="notifications-unread-dot" />
                </button>
              );
            })}
          </div>
        )}
      </section>
    </main>
  );
}
