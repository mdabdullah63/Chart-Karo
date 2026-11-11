import React, { useState } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import { Formik, Form, Field } from "formik";
import * as Yup from "yup";
import AuthInput from "../../components/AuthInput";
import ThemeToggle from "../../components/ThemeToggle";
import { useResetPasswordMutation } from "../../redux/api/authApi";
const ResetPasswordSchema = Yup.object().shape({
  password: Yup.string()
    .min(6, "Password must be at least 6 characters")
    .required("Password is required"),
  confirmPassword: Yup.string()
    .oneOf([Yup.ref("password")], "Passwords do not match")
    .required("Please confirm your password"),
});

export default function ResetPassword() {
  const navigate = useNavigate();
  const location = useLocation();
  const resetToken = location.state?.resetToken || "";

  const [resetPassword, { isLoading }] = useResetPasswordMutation();
  const [errorMessage, setErrorMessage] = useState("");

  if (!resetToken) return <Navigate to="/forgot-password" replace />;

  const handleSubmit = async (values, { setSubmitting }) => {
    setErrorMessage("");
    try {
      await resetPassword({ resetToken, newPassword: values.password }).unwrap();
      navigate("/");
    } catch (err) {
      setErrorMessage(err?.data?.message || "Unable to reset password.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="auth-container">
      <ThemeToggle className="auth-theme-toggle" />

      <div className="auth-card">
        <div className="auth-header">
          <h1>Reset password</h1>
          <p>Create a new password for your account.</p>
        </div>

        {errorMessage && <div className="error-banner">{errorMessage}</div>}

        <Formik
          initialValues={{ password: "", confirmPassword: "" }}
          validationSchema={ResetPasswordSchema}
          onSubmit={handleSubmit}
        >
          {({ isSubmitting }) => (
            <Form>
              <Field
                name="password"
                type="password"
                label="New password"
                placeholder="Enter new password"
                component={AuthInput}
              />
              <Field
                name="confirmPassword"
                type="password"
                label="Confirm password"
                placeholder="Confirm your password"
                component={AuthInput}
              />
              <button type="submit" className="login-btn" disabled={isSubmitting || isLoading}>
                {isLoading ? "Updating..." : "Reset Password"}
              </button>
            </Form>
          )}
        </Formik>

        <div className="bottom-text">
          Remember your password? <Link to="/">Log in</Link>
        </div>
      </div>
    </div>
  );
}
