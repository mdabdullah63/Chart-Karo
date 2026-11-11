import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Formik, Form, Field } from "formik";
import * as Yup from "yup";
import AuthInput from "../../components/AuthInput";
import ThemeToggle from "../../components/ThemeToggle";
import { useForgotPasswordMutation } from "../../redux/api/authApi";
const ForgotPasswordSchema = Yup.object().shape({
  email: Yup.string().email("Invalid email address").required("Email is required"),
});

export default function ForgotPassword() {
  const navigate = useNavigate();
  const [forgotPassword, { isLoading }] = useForgotPasswordMutation();
  const [errorMessage, setErrorMessage] = useState("");

  const handleSubmit = async (values, { setSubmitting }) => {
    setErrorMessage("");
    try {
      await forgotPassword(values).unwrap();
      navigate("/verify-otp", { state: { email: values.email } });
    } catch (err) {
      setErrorMessage(err?.data?.message || "Unable to send OTP. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="auth-container">
      <ThemeToggle className="auth-theme-toggle" />

      <div className="auth-card">
        <div className="auth-header">
          <h1>Forgot password?</h1>
          <p>
            Enter your email address to reset your
            <br />
            password.
          </p>
        </div>

        {errorMessage && <div className="error-banner">{errorMessage}</div>}

        <Formik
          initialValues={{ email: "" }}
          validationSchema={ForgotPasswordSchema}
          onSubmit={handleSubmit}
        >
          {({ isSubmitting }) => (
            <Form>
              <Field
                name="email"
                type="email"
                label="Email"
                placeholder="Enter your email"
                component={AuthInput}
              />
              <button type="submit" className="login-btn" disabled={isSubmitting || isLoading}>
                {isLoading ? "Sending..." : "Send OTP"}
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
