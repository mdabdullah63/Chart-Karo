import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";

import Login from "../pages/auth/Login";
import Signup from "../pages/auth/Signup";
import ForgotPassword from "../pages/auth/ForgotPassword";
import VerifyOTP from "../pages/auth/VerifyOTP";
import ResetPassword from "../pages/auth/ResetPassword";

import Dashboard from "../pages/dashboard/Dashboard";
import Chats from "../pages/dashboard/Chats/Chats";
import Contacts from "../pages/dashboard/Contacts/Contacts";
import Notifications from "../pages/dashboard/Notifications/Notifications";
import Settings from "../pages/dashboard/Settings/Settings";
import Group from "../pages/dashboard/Group/CreateGroup";
import Location from "../pages/dashboard/Location/Location";
import ProtectedRoute from "../components/ProtectedRoute";
import PublicRoute from "../components/PublicRoute";

export default function AppRoutes() {
  return (
    <Routes>
      <Route element={<PublicRoute />}>
        <Route path="/" element={<Login />} />
        <Route path="/login" element={<Navigate to="/" replace />} />
        <Route path="/signup" element={<Signup />} />
      </Route>

      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/verify-otp" element={<VerifyOTP />} />
      <Route path="/reset-password" element={<ResetPassword />} />

      <Route element={<ProtectedRoute />}>
        <Route path="/dashboard" element={<Dashboard />}>
          <Route index element={<Chats />} />
          <Route path="chats" element={<Chats />} />
          <Route path="contacts" element={<Contacts />} />
          <Route path="notifications" element={<Notifications />} />
          <Route path="settings" element={<Settings />} />
          <Route path="group" element={<Group />} />
          <Route path="location" element={<Location />} />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
