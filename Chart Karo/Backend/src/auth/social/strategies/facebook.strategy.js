const passport = require("passport");
const FacebookStrategy = require("passport-facebook").Strategy;
const socialService = require("../social.service");
const { callbackUrl } = require("../../../config/env");

if (process.env.FACEBOOK_APP_ID && process.env.FACEBOOK_APP_SECRET) {
  passport.use(
    new FacebookStrategy(
      {
        clientID: process.env.FACEBOOK_APP_ID,
        clientSecret: process.env.FACEBOOK_APP_SECRET,
        callbackURL: callbackUrl("facebook"),
        profileFields: ["id", "displayName", "photos", "email"],
      },
      async (accessToken, refreshToken, profile, done) => {
        try {
          const email = profile.emails?.[0]?.value;
          const avatar = profile.photos?.[0]?.value;

          const user = await socialService.resolveOAuthUser(
            "facebook",
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
