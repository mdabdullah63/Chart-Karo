const isProd = process.env.NODE_ENV === "production";

// "lax" works when the frontend is served from the same domain as the API.
// Use COOKIE_SAMESITE=none only for split deployments (requires HTTPS).
const sameSite = (process.env.COOKIE_SAMESITE || "lax").toLowerCase();

const cookieOptions = {
  httpOnly: true,
  secure: isProd || sameSite === "none",
  sameSite,
  path: "/",
};

if (process.env.COOKIE_DOMAIN) {
  cookieOptions.domain = process.env.COOKIE_DOMAIN;
}

function setAuthCookies(res, accessToken, refreshToken) {
  res.cookie("accessToken", accessToken, {
    ...cookieOptions,
    maxAge: 15 * 60 * 1000,
  });
  res.cookie("refreshToken", refreshToken, {
    ...cookieOptions,
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });
}

function clearAuthCookies(res) {
  res.clearCookie("accessToken", cookieOptions);
  res.clearCookie("refreshToken", cookieOptions);
}

module.exports = { setAuthCookies, clearAuthCookies };
