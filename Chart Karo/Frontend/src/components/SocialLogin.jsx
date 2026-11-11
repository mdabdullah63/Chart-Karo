import React from "react";
import { FcGoogle } from "react-icons/fc";
import { FaFacebookF, FaGithub } from "react-icons/fa";
import SocialButton from "./SocialButton";
import { useGetAuthProvidersQuery } from "../redux/api/authApi";
import { API_URL } from "../config/env";

const PROVIDERS = [
  { key: "google", icon: FcGoogle, label: "Google" },
  { key: "facebook", icon: FaFacebookF, label: "Facebook" },
  { key: "github", icon: FaGithub, label: "GitHub" },
];

// Only shows providers the server actually has keys for.
export default function SocialLogin() {
  const { data: enabled = {} } = useGetAuthProvidersQuery();
  const available = PROVIDERS.filter((p) => enabled[p.key]);

  if (available.length === 0) return null;

  return (
    <>
      <div className="divider">
        <span>OR</span>
      </div>
      <p className="social-title">Continue with your social account</p>

      <div className="social-row">
        {available.map(({ key, icon, label }) => (
          <SocialButton
            key={key}
            provider={key}
            label={label}
            icon={icon}
            onClick={() => {
              window.location.href = `${API_URL}/auth/${key}`;
            }}
          />
        ))}
      </div>
    </>
  );
}
