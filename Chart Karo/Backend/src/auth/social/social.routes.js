const express = require("express");
const passport = require("./passport");
const { handleOAuthCallback, CLIENT_URL } = require("./social.controller");

const router = express.Router();

const PROVIDERS = {
  google: { scope: ["profile", "email"], extra: { prompt: "select_account" } },
  github: { scope: ["user:email"], extra: {} },
  facebook: { scope: ["email"], extra: {} },
};

const isEnabled = (provider) => Boolean(passport._strategy(provider));

// Lets the frontend hide buttons for providers that are not configured.
router.get("/providers", (req, res) => {
  res.json({
    success: true,
    providers: Object.fromEntries(Object.keys(PROVIDERS).map((p) => [p, isEnabled(p)])),
  });
});

Object.entries(PROVIDERS).forEach(([provider, { scope, extra }]) => {
  router.get(`/${provider}`, (req, res, next) => {
    if (!isEnabled(provider)) {
      return res.redirect(`${CLIENT_URL}/?error=provider_unavailable`);
    }
    passport.authenticate(provider, { scope, session: false, ...extra })(req, res, next);
  });

  router.get(`/${provider}/callback`, (req, res, next) => {
    if (!isEnabled(provider)) {
      return res.redirect(`${CLIENT_URL}/?error=provider_unavailable`);
    }
    passport.authenticate(provider, { session: false }, (error, user) => {
      if (error || !user) {
        console.error(`${provider} login failed:`, error?.message || "no user");
        return res.redirect(`${CLIENT_URL}/?error=oauth_failed`);
      }
      req.user = user;
      handleOAuthCallback(req, res);
    })(req, res, next);
  });
});

module.exports = router;
