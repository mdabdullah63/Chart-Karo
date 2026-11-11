const nodemailer = require("nodemailer");
const transporter = nodemailer.createTransport({
  host: process.env.MAIL_HOST,
  port: Number(process.env.MAIL_PORT),
  secure: process.env.MAIL_SECURE === "true",
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASSWORD,
  },
});
async function verifyMailConnection() {
  try {
    await transporter.verify();
    console.log("Mail server connected successfully");
  } catch (error) {
    console.error("Mail server connection failed:", error.message);
  }
}
function escapeHtml(value = "") {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
async function sendOTPEmail(email, otp) {
  const companyName = escapeHtml(process.env.MAIL_FROM || "Your Brand");
  const safeOtp = escapeHtml(otp);
  const year = new Date().getFullYear();

  await transporter.sendMail({
    from: `"${companyName}" <${process.env.MAIL_USER}>`,
    to: email,
    subject: `${otp} is your Password Reset Code`,
    text: `Your password reset code is ${otp}. It is valid for 5 minutes. If you did not request this, please ignore this email.`,
    html: `
      <div style="font-family: Arial, sans-serif; background:#eef2ff; padding:32px;">
        <div style="max-width:480px; margin:0 auto; background:#ffffff; border-radius:16px; overflow:hidden; border:1px solid #e2e8f0;">
          <div style="background:#4338ca; padding:24px; text-align:center; color:#ffffff;">
            <h2 style="margin:0;">${companyName}</h2>
            <p style="margin:4px 0 0; font-size:12px; letter-spacing:1px;">SECURE ACCOUNT VERIFICATION</p>
          </div>
          <div style="padding:28px;">
            <h3 style="margin-top:0;">Reset your password</h3>
            <p style="color:#334155; font-size:14px; line-height:1.6;">
              We received a request to reset your password. Use the code below to continue.
            </p>
            <div style="text-align:center; background:#f8faff; border:1px solid #e0e7ff; border-radius:12px; padding:20px; margin:20px 0;">
              <div style="font-size:32px; letter-spacing:8px; font-weight:bold; color:#4338ca;">${safeOtp}</div>
              <div style="font-size:12px; color:#94a3b8; margin-top:8px;">This code expires in 5 minutes</div>
            </div>
            <p style="color:#94a3b8; font-size:12px;">
              If you didn't request this, you can safely ignore this email.
            </p>
          </div>
          <div style="background:#f8fafc; text-align:center; padding:16px; font-size:11px; color:#94a3b8;">
            &copy; ${year} ${companyName} - All rights reserved
          </div>
        </div>
      </div>
    `,
  });
}

module.exports = { verifyMailConnection, sendOTPEmail };
