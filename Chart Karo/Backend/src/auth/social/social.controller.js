const localService = require("../local/local.service");
const { setAuthCookies } = require("../../utils/cookies");
const { primaryClientUrl } = require("../../config/env");

const CLIENT_URL = primaryClientUrl;

async function handleOAuthCallback(req, res) {
  try {
    const { accessToken, refreshToken } = await localService.issueSession(req.user);
    setAuthCookies(res, accessToken, refreshToken);
    res.redirect(`${CLIENT_URL}/dashboard`);
  } catch (error) {
    console.error("OAuth callback error:", error.message);
    res.redirect(`${CLIENT_URL}/?error=oauth_failed`);
  }
}

module.exports = { handleOAuthCallback, CLIENT_URL };
