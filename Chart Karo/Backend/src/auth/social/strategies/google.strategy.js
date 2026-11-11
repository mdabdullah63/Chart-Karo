const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const socialService = require("../social.service");
const { callbackUrl } = require("../../../config/env");

// Only registered when credentials exist, otherwise the strategy constructor throws at boot.
if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  passport.use(
    new GoogleStrategy(
      {
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: callbackUrl("google"),
      },
      async (accessToken, refreshToken, profile, done) => {
        try {
          const email = profile.emails?.[0]?.value;
          const avatar = profile.photos?.[0]?.value;

          const user = await socialService.resolveOAuthUser(
            "google",
            profile.id,
            profile.displayName,
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
