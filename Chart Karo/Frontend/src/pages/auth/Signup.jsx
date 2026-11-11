import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Formik, Form, Field } from "formik";
import * as Yup from "yup";
import AuthInput from "../../components/AuthInput";
import SocialLogin from "../../components/SocialLogin";
import ThemeToggle from "../../components/ThemeToggle";
import { useRegisterUserMutation } from "../../redux/api/authApi";

const SignupSchema = Yup.object().shape({
  name: Yup.string().min(2, "Name is too short").required("Full name is required"),
  email: Yup.string().email("Invalid email address").required("Email is required"),
  password: Yup.string()
    .min(6, "Password must be at least 6 characters")
    .required("Password is required"),
});

export default function Signup() {
  const navigate = useNavigate();
  const [registerUser, { isLoading }] = useRegisterUserMutation();
  const [errorMessage, setErrorMessage] = useState("");

  const handleSubmit = async (values, { setSubmitting }) => {
    setErrorMessage("");
    try {
      await registerUser(values).unwrap();
      navigate("/dashboard");
    } catch (err) {
      setErrorMessage(err?.data?.message || "Unable to create account.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="auth-container">
      <ThemeToggle className="auth-theme-toggle" />

      <div className="auth-card">
        <h1>Create Account</h1>

        {errorMessage && <div className="error-banner">{errorMessage}</div>}

        <Formik
          initialValues={{ name: "", email: "", password: "" }}
          validationSchema={SignupSchema}
          onSubmit={handleSubmit}
        >
          {({ isSubmitting }) => (
            <Form>
              <Field
                name="name"
                type="text"
                label="Full Name"
                placeholder="Enter full name"
                component={AuthInput}
              />
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
                label="Password"
                placeholder="Enter password"
                component={AuthInput}
              />
              <button type="submit" className="login-btn" disabled={isSubmitting || isLoading}>
                {isLoading ? "Creating Account..." : "Create Account"}
              </button>
            </Form>
          )}
        </Formik>

        <SocialLogin />

        <div className="bottom-text">
          Already have an account? <Link to="/">Sign In</Link>
        </div>
      </div>
    </div>
  );
}
