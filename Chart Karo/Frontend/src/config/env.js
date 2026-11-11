const configured = import.meta.env.VITE_API_URL;

export const API_URL = (
  configured !== undefined && configured !== ""
    ? configured
    : import.meta.env.PROD
      ? "https://chart-karo-6iz6.onrender.com"
      : "http://localhost:3000"
).replace(/\/$/, "");

// Resolve avatar paths that may be absolute URLs or server-relative paths.
export function resolveAssetUrl(value) {
  if (!value || typeof value !== "string") return null;

  if (/^(https?:|data:|blob:)/.test(value)) return value;

  return `${API_URL}/${value.replace(/^\//, "")}`;
}
