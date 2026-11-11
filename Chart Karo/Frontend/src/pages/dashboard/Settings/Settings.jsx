import React from "react";
import { useOutletContext } from "react-router-dom";
import { MdDarkMode, MdLightMode, MdPerson } from "react-icons/md";
import { useTheme } from "../../../context/ThemeContext";
import { resolveAssetUrl } from "../../../config/env";

export default function Settings() {
  const { theme, toggleTheme } = useTheme();
  const { user } = useOutletContext();

  const avatar = resolveAssetUrl(user?.avatar);
  const initial = user?.name?.trim()?.charAt(0)?.toUpperCase() || "U";

  return (
    <div className="settings-page">
      <section className="settings-card">
        <h2>Profile</h2>

        <div className="settings-profile">
          <div className="settings-avatar">
            {avatar ? <img src={avatar} alt={user?.name || "You"} /> : <span>{initial}</span>}
          </div>

          <div className="settings-profile-info">
            <strong>{user?.name || "User"}</strong>
            <span>{user?.email}</span>
          </div>

          <MdPerson className="settings-profile-icon" aria-hidden="true" />
        </div>
      </section>

      <section className="settings-card">
        <h2>Appearance</h2>

        <div className="settings-row">
          <div>
            <strong>{theme === "light" ? "Light mode" : "Dark mode"}</strong>
            <p>Switch the look of the whole app.</p>
          </div>

          <button type="button" className="settings-theme-btn" onClick={toggleTheme}>
            {theme === "light" ? <MdDarkMode /> : <MdLightMode />}
            {theme === "light" ? "Use dark" : "Use light"}
          </button>
        </div>
      </section>
    </div>
  );
}
