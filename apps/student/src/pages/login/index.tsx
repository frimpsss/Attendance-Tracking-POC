import * as React from "react";
import { Navigate, useNavigate, useSearchParams } from "react-router-dom";
import { LoginScreen } from "@attendance/ui";
import { useAuth } from "@attendance/supabase";

export default function StudentLoginPage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const redirectTarget = searchParams.get("redirect") || "/home";

  if (!loading && user) {
    return <Navigate to={redirectTarget} replace />;
  }

  return (
    <LoginScreen
      appTitle="Student PWA"
      appSubtitle="Classroom QR Check-In, Timetable & Attendance History"
      defaultRole="student"
      onSuccess={() => navigate(redirectTarget, { replace: true })}
    />
  );
}
