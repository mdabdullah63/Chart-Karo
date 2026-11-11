import React from "react";
import { Navigate, Outlet } from "react-router-dom";
import { useGetCurrentUserQuery } from "../redux/api/authApi";

export default function ProtectedRoute() {
  const { isLoading, isError } = useGetCurrentUserQuery();

  if (isLoading) {
    return (
      <div className="dashboard-loading">
        <div className="loading-spinner"></div>
        <p>Checking session...</p>
      </div>
    );
  }

  if (isError) return <Navigate to="/" replace />;

  return <Outlet />;
}
