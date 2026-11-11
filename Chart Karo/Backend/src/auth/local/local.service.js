const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");

const userRepository = require("../../users/user.repository");
const { generateOTP, hashOTP, compareOTP } = require("../../utils/otp");
const { sendOTPEmail } = require("../../config/mail");

function generateAccessToken(user) {
  return jwt.sign(
    { id: user._id, email: user.email, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: "15m" }
  );
}

function generateRefreshToken(user) {
  return jwt.sign({ id: user._id }, process.env.REFRESH_TOKEN_SECRET, {
    expiresIn: "7d",
  });
}
async function issueSession(user) {
  const accessToken = generateAccessToken(user);
  const refreshToken = generateRefreshToken(user);

  await userRepository.updateById(user._id, {
    refreshToken,
    lastLogin: new Date(),
  });

  return { user, accessToken, refreshToken };
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

async function register(name, email, password) {
  name = String(name).trim();
  email = String(email).trim().toLowerCase();
  password = String(password);

  if (name.length < 2) throw new Error("Name is too short");
  if (!EMAIL_REGEX.test(email)) throw new Error("Invalid email address");
  if (password.length < 6) throw new Error("Password must be at least 6 characters");

  const existingUser = await userRepository.findByEmail(email);
  if (existingUser) {
    throw new Error("Email already registered");
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  const user = await userRepository.create({ name, email, password: hashedPassword });

  return issueSession(user);
}

async function login(email, password) {
  const user = await userRepository.findByEmail(String(email).trim());
  if (!user || user.isActive === false) {
    throw new Error("Invalid email or password");
  }

  if (!user.password) {
    throw new Error(
      "This account has no password yet. Login with social account or use forgot password."
    );
  }

  const isMatch = await bcrypt.compare(String(password), user.password);
  if (!isMatch) {
    throw new Error("Invalid email or password");
  }

  return issueSession(user);
}

async function refreshSession(refreshToken) {
  if (!refreshToken) {
    throw new Error("Refresh token missing");
  }

  let decoded;
  try {
    decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);
  } catch (error) {
    throw new Error("Invalid or expired refresh token");
  }

  const user = await userRepository.findById(decoded.id);

  if (!user || user.refreshToken !== refreshToken) {
    throw new Error("Invalid or expired refresh token");
  }

  return issueSession(user);
}

async function getMe(userId) {
  const user = await userRepository.findById(userId);
  if (!user) {
    throw new Error("User not found");
  }
  return user;
}

async function logout(userId) {
  await userRepository.updateById(userId, { refreshToken: null });
}

async function forgotPassword(email) {
  const user = await userRepository.findByEmail(email);
  // Don't reveal whether the email exists or not - always resolve.
  if (!user) return;

  const otp = generateOTP();
  const otpHash = await hashOTP(otp);
  const otpExpires = new Date(Date.now() + 5 * 60 * 1000);

  await userRepository.saveOTP(user._id, otpHash, otpExpires);
  await sendOTPEmail(user.email, otp);
}

async function verifyOTP(email, otp) {
  const user = await userRepository.findByEmail(email);
  if (!user) {
    throw new Error("Invalid or expired OTP");
  }

  if (user.passwordResetAttempts >= 5) {
    throw new Error("Too many attempts. Please request a new OTP.");
  }

  const validUser = await userRepository.findWithValidOTP(user._id);
  if (!validUser) {
    throw new Error("Invalid or expired OTP");
  }

  const isValid = await compareOTP(otp, validUser.passwordResetOtp);
  if (!isValid) {
    await userRepository.incrementOTPAttempts(user._id);
    throw new Error("Invalid or expired OTP");
  }

  const resetToken = crypto.randomBytes(32).toString("hex");
  const resetTokenHash = crypto.createHash("sha256").update(resetToken).digest("hex");
  const resetTokenExpires = new Date(Date.now() + 10 * 60 * 1000);

  await userRepository.saveResetToken(user._id, resetTokenHash, resetTokenExpires);

  return resetToken;
}

async function resetPassword(resetToken, newPassword) {
  const resetTokenHash = crypto.createHash("sha256").update(resetToken).digest("hex");
  const user = await userRepository.findByResetToken(resetTokenHash);

  if (!user) {
    throw new Error("Invalid or expired reset link");
  }

  const hashedPassword = await bcrypt.hash(newPassword, 10);
  await userRepository.updatePassword(user._id, hashedPassword);
}

module.exports = {
  generateAccessToken,
  generateRefreshToken,
  issueSession,
  register,
  login,
  refreshSession,
  getMe,
  logout,
  forgotPassword,
  verifyOTP,
  resetPassword,
};
