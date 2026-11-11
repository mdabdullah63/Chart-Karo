import React from "react";

export default function SocialButton({ provider, label, icon: Icon, onClick }) {
  return (
    <button
      type="button"
      className={`social-btn ${provider}`}
      onClick={onClick}
      aria-label={label ? `Continue with ${label}` : undefined}
      title={label ? `Continue with ${label}` : undefined}
    >
      <Icon />
    </button>
  );
}
