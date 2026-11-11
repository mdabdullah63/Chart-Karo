import React from "react";
import { Navigate, Outlet } from "react-router-dom";
import { useGetCurrentUserQuery } from "../redux/api/authApi";

// Login / signup pages: already signed-in users go straight to the app.
export default function PublicRoute() {
  const { data, isLoading } = useGetCurrentUserQuery();

  if (isLoading) {
    return (
      <div className="dashboard-loading">
        <div className="loading-spinner"></div>
        <p>Loading...</p>
      </div>
    );
  }

  if (data?.user) return <Navigate to="/dashboard" replace />;

  return <Outlet />;
}
