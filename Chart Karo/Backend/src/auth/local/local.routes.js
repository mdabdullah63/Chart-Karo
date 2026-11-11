const express = require("express");
const localController = require("./local.controller");
const { authMiddleware } = require("../../middleware/auth.middleware");
const { authLimiter, otpLimiter } = require("../../middleware/rateLimiter.middleware");

const router = express.Router();

router.post("/register", authLimiter, localController.register);
router.post("/login", authLimiter, localController.login);
router.post("/refresh", localController.refresh);
router.get("/me", authMiddleware, localController.getMe);
router.post("/logout", authMiddleware, localController.logout);

router.post("/password/forgot", otpLimiter, localController.forgotPassword);
router.post("/password/verify-otp", otpLimiter, localController.verifyOTP);
router.post("/password/reset", localController.resetPassword);

module.exports = router;
