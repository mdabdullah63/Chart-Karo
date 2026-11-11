import React, { useEffect, useRef, useState } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import { MdArrowBack } from "react-icons/md";
import ThemeToggle from "../../components/ThemeToggle";
import { useVerifyResetOTPMutation, useForgotPasswordMutation } from "../../redux/api/authApi";
export default function VerifyOTP() {
  const navigate = useNavigate();
  const location = useLocation();
  const email = location.state?.email || "";

  const [otp, setOtp] = useState(["", "", "", ""]);
  const [errorMessage, setErrorMessage] = useState("");
  const [timer, setTimer] = useState(30);

  const inputRefs = useRef([]);
  const [verifyResetOTP, { isLoading }] = useVerifyResetOTPMutation();
  const [forgotPassword, { isLoading: isResending }] = useForgotPasswordMutation();

  useEffect(() => {
    if (timer === 0) return;
    const interval = setInterval(() => setTimer((prev) => prev - 1), 1000);
    return () => clearInterval(interval);
  }, [timer]);

  if (!email) return <Navigate to="/forgot-password" replace />;

  const handleChange = (value, index) => {
    if (!/^\d*$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value.slice(-1);
    setOtp(newOtp);
    setErrorMessage("");

    if (value && index < 3) inputRefs.current[index + 1]?.focus();
  };

  const handleKeyDown = (e, index) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const enteredOTP = otp.join("");

    if (enteredOTP.length !== 4) {
      setErrorMessage("Please enter the complete 4-digit OTP.");
      return;
    }

    try {
      const response = await verifyResetOTP({ email, otp: enteredOTP }).unwrap();
      navigate("/reset-password", { state: { email, resetToken: response.resetToken } });
    } catch (err) {
      setErrorMessage(err?.data?.message || "Invalid or expired OTP.");
    }
  };

  const handleResend = async () => {
    setErrorMessage("");
    try {
      await forgotPassword({ email }).unwrap();
      setOtp(["", "", "", ""]);
      setTimer(30);
    } catch (err) {
      setErrorMessage(err?.data?.message || "Unable to resend OTP.");
    }
  };

  return (
    <div className="auth-container">
      <ThemeToggle className="auth-theme-toggle" />

      <div className="auth-card">
        <div className="otp-header">
          <Link to="/forgot-password" className="change-email">
            <MdArrowBack />
          </Link>
          <h1>Verify OTP</h1>
        </div>

        <p className="otp-description">
          Enter the 4-digit OTP sent to
          <br />
          <strong>{email}</strong>
        </p>

        {errorMessage && <div className="error-banner">{errorMessage}</div>}

        <form onSubmit={handleSubmit}>
          <div className="otp-container">
            {otp.map((digit, index) => (
              <input
                key={index}
                ref={(el) => (inputRefs.current[index] = el)}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={(e) => handleChange(e.target.value, index)}
                onKeyDown={(e) => handleKeyDown(e, index)}
                className="otp-input"
                autoFocus={index === 0}
              />
            ))}
          </div>

          <button type="submit" className="login-btn" disabled={isLoading}>
            {isLoading ? "Verifying..." : "Verify OTP"}
          </button>
        </form>

        <div className="bottom-text resend-text">
          Didn't receive the OTP?
          {timer > 0 ? (
            <span className="otp-timer">Resend OTP in {timer}s</span>
          ) : (
            <button type="button" className="resend-btn" onClick={handleResend} disabled={isResending}>
              {isResending ? "Sending..." : "Resend OTP"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
