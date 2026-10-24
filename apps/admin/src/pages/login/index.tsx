import * as React from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { LoginScreen } from "@attendance/ui";
import { useAuth } from "@attendance/supabase";

export default function AdminLoginPage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  if (!loading && user) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <LoginScreen
      appTitle="Admin Portal"
      appSubtitle="Institution Attendance & Academic Management"
      defaultRole="admin"
      onSuccess={() => navigate("/dashboard", { replace: true })}
    />
  );
}
