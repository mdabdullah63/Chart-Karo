import React, { useState } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";

import { useGetCurrentUserQuery, useLogoutUserMutation, authApi } from "../../redux/api/authApi";
import Sidebar from "./sidebar";
import Topbar from "./topbar";
import { clearSession } from "../../utils/clearSession";
import { chatApi } from "../../redux/api/chatApi";
import { SocketProvider } from "../../context/SocketContext";
export default function Dashboard() {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const [sidebarOpen, setSidebarOpen] = useState(false);

  const { data, isLoading } = useGetCurrentUserQuery();
  const [logoutUser] = useLogoutUserMutation();

  const user = data?.user || data;

  const userName = user?.name || "User";
  const userEmail = user?.email || "No Email";
  const userAvatar =
    typeof user?.avatar === "string" && user.avatar.trim() ? user.avatar : null;

  const handleLogout = async () => {
    try {
      await logoutUser().unwrap();
    } catch (err) {
      console.error("Logout failed:", err);
    } finally {
      // Wipe cached data so the next person to log in on this browser never sees it.
      dispatch(authApi.util.resetApiState());
      dispatch(chatApi.util.resetApiState());
      clearSession();
      navigate("/");
    }
  };

  if (isLoading) {
    return (
      <div className="dashboard-loading">
        <div className="loading-spinner"></div>
        <p>Loading app...</p>
      </div>
    );
  }

  return (
    <SocketProvider userId={user?._id}>
      <div className="dashboard-layout">
        <Sidebar
          sidebarOpen={sidebarOpen}
          setSidebarOpen={setSidebarOpen}
          handleLogout={handleLogout}
        />

        <main className="dashboard-main">
          <Topbar
            setSidebarOpen={setSidebarOpen}
            userName={userName}
            userEmail={userEmail}
            userAvatar={userAvatar}
          />

          <section className="dashboard-content">
            <Outlet context={{ user }} />
          </section>
        </main>
      </div>
    </SocketProvider>
  );
}
