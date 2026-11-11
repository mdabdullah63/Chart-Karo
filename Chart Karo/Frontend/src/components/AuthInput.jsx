import React, { useState } from "react";
import { MdVisibility, MdVisibilityOff } from "react-icons/md";

export default function AuthInput({ field, form, label, type = "text", ...props }) {
  const [showPassword, setShowPassword] = useState(false);
  const isPassword = type === "password";
  const hasError = form.touched[field.name] && form.errors[field.name];

  return (
    <div className="input-group">
      <label htmlFor={field.name}>{label}</label>
      <div className={isPassword ? "password-box" : "input-box"}>
        <input
          {...field}
          {...props}
          id={field.name}
          type={isPassword ? (showPassword ? "text" : "password") : type}
          className={`input-field ${hasError ? "input-error" : ""}`}
        />
        {isPassword && (
          <button
            type="button"
            className="eye-btn"
            onClick={() => setShowPassword((p) => !p)}
            tabIndex={-1}
          >
            {showPassword ? <MdVisibilityOff /> : <MdVisibility />}
          </button>
        )}
      </div>
      {hasError && <span className="error-text">{form.errors[field.name]}</span>}
    </div>
  );
}
