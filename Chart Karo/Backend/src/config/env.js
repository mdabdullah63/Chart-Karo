// Central place for URL / origin configuration.

function parseList(value) {
  return String(value || "")
    .split(",")
    .map((item) => item.trim().replace(/\/$/, ""))
    .filter(Boolean);
}

const clientOrigins = parseList(
  process.env.CLIENT_URL || process.env.RENDER_EXTERNAL_URL || "http://localhost:5173"
);
const primaryClientUrl = clientOrigins[0];

const serverUrl = (
  process.env.SERVER_URL ||
  process.env.RENDER_EXTERNAL_URL ||
  `http://localhost:${process.env.PORT || 3000}`
).replace(/\/$/, "");

function callbackUrl(provider) {
  return (
    process.env[`${provider.toUpperCase()}_CALLBACK_URL`] ||
    `${serverUrl}/auth/${provider}/callback`
  );
}

/**
 * An origin is allowed when it is in CLIENT_URL, or when it is the very same
 * host that is serving the request (single-domain deployment).
 */
function isAllowedOrigin(origin, host) {
  if (!origin) return true; // same-origin navigation, curl, server-to-server
  const clean = origin.replace(/\/$/, "");
  if (clientOrigins.includes(clean)) return true;
  try {
    return host ? new URL(clean).host === host : false;
  } catch {
    return false;
  }
}

module.exports = { clientOrigins, primaryClientUrl, serverUrl, callbackUrl, isAllowedOrigin };
