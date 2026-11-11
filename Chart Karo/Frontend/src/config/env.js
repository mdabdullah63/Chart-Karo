// const configured = import.meta.env.VITE_API_URL;

// export const API_URL = (
//   configured !== undefined && configured !== ""
//     ? configured
//     : import.meta.env.PROD
//       ? "https://chart-karo-6iz6.onrender.com"
//       : "http://localhost:3000"
// ).replace(/\/$/, "");

// // Resolve avatar paths that may be absolute URLs or server-relative paths.
// export function resolveAssetUrl(value) {
//   if (!value || typeof value !== "string") return null;

//   if (/^(https?:|data:|blob:)/.test(value)) return value;

//   return `${API_URL}/${value.replace(/^\//, "")}`;
// }


// Frontend (Vercel) and backend (Render) are on different domains,
// so the backend URL must be known at build time.
//
// Priority:
// 1. VITE_API_URL (set in the Vercel dashboard)
// 2. Production fallback -> your Render backend URL
// 3. Local development   -> http://localhost:3000

const RENDER_BACKEND_URL = "https://chart-karo-6iz6.onrender.com"; // apna asli Render URL yahan rakho

const configured = import.meta.env.VITE_API_URL;

export const API_URL = (
  configured !== undefined && configured !== ""
    ? configured
    : import.meta.env.PROD
      ? RENDER_BACKEND_URL
      : "http://localhost:3000"
).replace(/\/$/, "");

// Resolve avatar paths that may be absolute URLs or server-relative paths.
export function resolveAssetUrl(value) {
  if (!value || typeof value !== "string") return null;

  if (/^(https?:|data:|blob:)/.test(value)) return value;

  return `${API_URL}/${value.replace(/^\//, "")}`;
}
