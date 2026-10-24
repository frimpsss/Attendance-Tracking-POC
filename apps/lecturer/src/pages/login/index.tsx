import * as React from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { LoginScreen } from "@attendance/ui";
import { useAuth } from "@attendance/supabase";

export default function LecturerLoginPage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  if (!loading && user) {
    return <Navigate to="/home" replace />;
  }

  return (
    <LoginScreen
      appTitle="Lecturer PWA"
      appSubtitle="Classroom QR Sessions, Live Roster & Attendance Review"
      defaultRole="lecturer"
      onSuccess={() => navigate("/home", { replace: true })}
    />
  );
}
