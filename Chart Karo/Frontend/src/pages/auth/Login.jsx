import React, { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Formik, Form, Field } from "formik";
import * as Yup from "yup";
import AuthInput from "../../components/AuthInput";
import SocialLogin from "../../components/SocialLogin";
import ThemeToggle from "../../components/ThemeToggle";
import { useLoginUserMutation } from "../../redux/api/authApi";

const OAUTH_ERRORS = {
  oauth_failed: "Social sign-in failed. Please try again or use your email.",
  provider_unavailable: "That sign-in method is not available right now.",
};
const LoginSchema = Yup.object().shape({
  email: Yup.string().email("Invalid email address").required("Email is required"),
  password: Yup.string()
    .min(6, "Password must be at least 6 characters")
    .required("Password is required"),
});

export default function Login() {
  const navigate = useNavigate();
  const [loginUser, { isLoading }] = useLoginUserMutation();
  const [searchParams, setSearchParams] = useSearchParams();
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    const code = searchParams.get("error");
    if (!code) return;
    setErrorMessage(OAUTH_ERRORS[code] || "Something went wrong. Please try again.");
    setSearchParams({}, { replace: true });
  }, [searchParams, setSearchParams]);

  const handleSubmit = async (values, { setSubmitting }) => {
    setErrorMessage("");
    try {
      await loginUser(values).unwrap();
      navigate("/dashboard");
    } catch (err) {
      setErrorMessage(err?.data?.message || "Invalid email or password.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="auth-container">
      <ThemeToggle className="auth-theme-toggle" />

      <div className="auth-card">
        <h1>Welcome back</h1>

        {errorMessage && <div className="error-banner">{errorMessage}</div>}

        <Formik
          initialValues={{ email: "", password: "" }}
          validationSchema={LoginSchema}
          onSubmit={handleSubmit}
        >
          {({ isSubmitting }) => (
            <Form>
              <Field
                name="email"
                type="email"
                label="Email"
                placeholder="Enter email"
                component={AuthInput}
              />
              <Field
                name="password"
                type="password"
                label={
                  <div className="password-label">
                    <span>Password</span>
                    <Link to="/forgot-password" className="forgot-password">
                      Forgot password?
                    </Link>
                  </div>
                }
                placeholder="Enter your password"
                component={AuthInput}
              />
              <button type="submit" className="login-btn" disabled={isSubmitting || isLoading}>
                {isLoading ? "Logging in..." : "Log In"}
              </button>
            </Form>
          )}
        </Formik>

        <SocialLogin />

        <div className="bottom-text">
          Don't have an account? <Link to="/signup">Sign up</Link>
        </div>
      </div>
    </div>
  );
}
