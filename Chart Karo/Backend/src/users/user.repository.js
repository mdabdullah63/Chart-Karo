const User = require("../models/user.model");
function create(data) {
  return User.create(data);
}
function findByEmail(email) {
  return User.findOne({ email: email.toLowerCase() });
}
function findById(id) {
  return User.findById(id);
}
function findByOAuthId(provider, providerId) {
  return User.findOne({ [`oauth.${provider}.id`]: providerId });
}
function updateById(id, data) {
  return User.findByIdAndUpdate(id, data, { new: true });
}
function connectOAuth(id, provider, providerId, avatar) {
  const updateData = { [`oauth.${provider}.id`]: providerId };
  if (avatar) updateData.avatar = avatar;
  return User.findByIdAndUpdate(id, updateData, { new: true });
}
function saveOTP(id, otpHash, otpExpires) {
  return User.findByIdAndUpdate(
    id,
    {
      passwordResetOtp: otpHash,
      passwordResetOtpExpires: otpExpires,
      passwordResetAttempts: 0,
    },
    { new: true }
  );
}
function findWithValidOTP(id) {
  return User.findOne({
    _id: id,
    passwordResetOtp: { $ne: null },
    passwordResetOtpExpires: { $gt: new Date() },
  });
}
function incrementOTPAttempts(id) {
  return User.findByIdAndUpdate(
    id,
    { $inc: { passwordResetAttempts: 1 } },
    { new: true }
  );
}
function saveResetToken(id, tokenHash, expires) {
  return User.findByIdAndUpdate(
    id,
    {
      passwordResetToken: tokenHash,
      passwordResetExpires: expires,
      passwordResetOtp: null,
      passwordResetOtpExpires: null,
      passwordResetAttempts: 0,
    },
    { new: true }
  );
}
function findByResetToken(tokenHash) {
  return User.findOne({
    passwordResetToken: tokenHash,
    passwordResetExpires: { $gt: new Date() },
  });
}
function updatePassword(id, hashedPassword) {
  return User.findByIdAndUpdate(
    id,
    {
      password: hashedPassword,
      passwordResetToken: null,
      passwordResetExpires: null,
      passwordResetOtp: null,
      passwordResetOtpExpires: null,
      passwordResetAttempts: 0,
      refreshToken: null,
    },
    { new: true }
  );
}
module.exports = {
  create,
  findByEmail,
  findById,
  findByOAuthId,
  updateById,
  connectOAuth,
  saveOTP,
  findWithValidOTP,
  incrementOTPAttempts,
  saveResetToken,
  findByResetToken,
  updatePassword,
};
