const passport = require("passport");
const GitHubStrategy = require("passport-github2").Strategy;
const socialService = require("../social.service");
const { callbackUrl } = require("../../../config/env");

if (process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET) {
  passport.use(
    new GitHubStrategy(
      {
        clientID: process.env.GITHUB_CLIENT_ID,
        clientSecret: process.env.GITHUB_CLIENT_SECRET,
        callbackURL: callbackUrl("github"),
      },
      async (accessToken, refreshToken, profile, done) => {
        try {
          const email =
            profile.emails?.find((e) => e.primary)?.value || profile.emails?.[0]?.value;
          const avatar = profile.photos?.[0]?.value;
          const name = profile.displayName || profile.username;

          const user = await socialService.resolveOAuthUser(
            "github",
            profile.id,
            name,
            email,
            avatar
          );

          done(null, user);
        } catch (error) {
          done(error, null);
        }
      }
    )
  );
}
