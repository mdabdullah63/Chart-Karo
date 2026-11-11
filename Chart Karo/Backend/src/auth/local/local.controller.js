const localService = require("./local.service");
const { setAuthCookies, clearAuthCookies } = require("../../utils/cookies");

async function register(req, res) {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "Name, email and password are required",
      });
    }

    const { user, accessToken, refreshToken } = await localService.register(
      name,
      email,
      password
    );

    setAuthCookies(res, accessToken, refreshToken);

    res.status(201).json({
      success: true,
      message: "Account created",
      user,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
}

async function login(req, res) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required",
      });
    }

    const { user, accessToken, refreshToken } = await localService.login(
      email,
      password
    );

    setAuthCookies(res, accessToken, refreshToken);

    res.status(200).json({
      success: true,
      message: "Login successful",
      user,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
}

async function refresh(req, res) {
  try {
    const { accessToken, refreshToken } = await localService.refreshSession(
      req.cookies?.refreshToken
    );

    setAuthCookies(res, accessToken, refreshToken);

    res.status(200).json({
      success: true,
      message: "Session refreshed",
    });
  } catch (error) {
    clearAuthCookies(res);

    res.status(401).json({
      success: false,
      message: error.message,
    });
  }
}

async function getMe(req, res) {
  try {
    const user = await localService.getMe(req.user.id);

    res.status(200).json({
      success: true,
      user,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
}

async function logout(req, res) {
  try {
    if (req.user?.id) {
      await localService.logout(req.user.id);
    }

    clearAuthCookies(res);

    res.status(200).json({
      success: true,
      message: "Logged out",
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
}

async function forgotPassword(req, res) {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email is required",
      });
    }

    await localService.forgotPassword(email.trim().toLowerCase());

    res.status(200).json({
      success: true,
      message: "If an account exists, an OTP has been sent",
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
}

async function verifyOTP(req, res) {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({
        success: false,
        message: "Email and OTP are required",
      });
    }

    if (!/^\d{4}$/.test(otp)) {
      return res.status(400).json({
        success: false,
        message: "OTP must be 4 digits",
      });
    }

    const resetToken = await localService.verifyOTP(
      email.trim().toLowerCase(),
      otp
    );

    res.status(200).json({
      success: true,
      message: "OTP verified",
      resetToken,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
}

async function resetPassword(req, res) {
  try {
    const { resetToken, newPassword } = req.body;

    if (!resetToken || !newPassword) {
      return res.status(400).json({
        success: false,
        message: "Reset token and new password are required",
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 6 characters",
      });
    }

    await localService.resetPassword(resetToken, newPassword);

    res.status(200).json({
      success: true,
      message: "Password reset successfully",
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
}

module.exports = {
  register,
  login,
  refresh,
  getMe,
  logout,
  forgotPassword,
  verifyOTP,
  resetPassword,
};
