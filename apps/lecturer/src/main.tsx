import * as React from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { AuthProvider } from "@attendance/supabase";
import { RoleGuard, Toaster } from "@attendance/ui";
import "@attendance/ui/styles.css";

import { LecturerLayout } from "./layouts/lecturer-layout";
import LecturerLoginPage from "./pages/login";
import LecturerHomePage from "./pages/home";
import LecturerCoursesPage from "./pages/courses";
import LecturerCourseDetailPage from "./pages/courses/detail";
import LecturerSessionsPage from "./pages/sessions";
import NewLecturerSessionPage from "./pages/sessions/new";
import LecturerSessionDetailPage from "./pages/sessions/detail";
import LecturerSessionMarkPage from "./pages/sessions/mark";
import LecturerSessionReportPage from "./pages/sessions/report";
import LecturerCorrectionsPage from "./pages/corrections";
import LecturerCorrectionDetailPage from "./pages/corrections/detail";
import LecturerNotificationsPage from "./pages/notifications";
import LecturerProfilePage from "./pages/profile";

function LecturerRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LecturerLoginPage />} />
        <Route
          path="/"
          element={
            <RoleGuard requiredRole="lecturer" appName="Lecturer PWA">
              <LecturerLayout />
            </RoleGuard>
          }
        >
          <Route index element={<Navigate to="/home" replace />} />
          <Route path="home" element={<LecturerHomePage />} />
          <Route path="courses" element={<LecturerCoursesPage />} />
          <Route path="courses/:id" element={<LecturerCourseDetailPage />} />
          <Route path="sessions" element={<LecturerSessionsPage />} />
          <Route path="sessions/new" element={<NewLecturerSessionPage />} />
          <Route path="sessions/:id" element={<LecturerSessionDetailPage />} />
          <Route path="sessions/:id/mark" element={<LecturerSessionMarkPage />} />
          <Route path="sessions/:id/report" element={<LecturerSessionReportPage />} />
          <Route path="corrections" element={<LecturerCorrectionsPage />} />
          <Route path="corrections/:id" element={<LecturerCorrectionDetailPage />} />
          <Route path="notifications" element={<LecturerNotificationsPage />} />
          <Route path="profile" element={<LecturerProfilePage />} />
          <Route path="*" element={<Navigate to="/home" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <AuthProvider expectedRole="lecturer">
      <LecturerRouter />
      <Toaster />
    </AuthProvider>
  </React.StrictMode>,
);
