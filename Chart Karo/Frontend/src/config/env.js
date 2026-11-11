// In production the frontend is served by the same server as the API, so the
// default is "" (same origin). For local dev the API runs on port 3000.
// Set VITE_API_URL only when the API lives on a different domain.
const configured = import.meta.env.VITE_API_URL;

export const API_URL = (
  configured !== undefined && configured !== ""
    ? configured
    : import.meta.env.PROD
    ? ""
    : "http://localhost:3000"
).replace(/\/$/, "");

// Resolve avatar paths that may be absolute URLs or server-relative paths.
export function resolveAssetUrl(value) {
  if (!value || typeof value !== "string") return null;
  if (/^(https?:|data:|blob:)/.test(value)) return value;
  return `${API_URL}/${value.replace(/^\//, "")}`;
}
