const userRepository = require("../../users/user.repository");
const localService = require("../local/local.service");

async function resolveOAuthUser(
  provider,
  providerId,
  name,
  email,
  avatar
) {
  let user = await userRepository.findByOAuthId(
    provider,
    providerId
  );

  if (!user && !email) {
    throw new Error(
      `Your ${provider} account has no public email address. Please use another sign-in method.`
    );
  }

  if (!user && email) {
    user = await userRepository.findByEmail(email);
  }

  if (!user) {
    user = await userRepository.create({
      name,
      email,
      password: null,
      avatar,
      oauth: {
        [provider]: {
          id: providerId,
        },
      },
    });
  } else {
    user = await userRepository.connectOAuth(
      user._id,
      provider,
      providerId,
      avatar
    );
  }

  return user;
}

async function issueSessionForOAuthUser(
  provider,
  providerId,
  name,
  email,
  avatar
) {
  const user = await resolveOAuthUser(
    provider,
    providerId,
    name,
    email,
    avatar
  );

  return localService.issueSession(user);
}

module.exports = {
  resolveOAuthUser,
  issueSessionForOAuthUser,
};
