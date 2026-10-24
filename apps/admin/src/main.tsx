import * as React from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Navigate, Outlet, Route, Routes } from "react-router-dom";
import { AuthProvider } from "@attendance/supabase";
import { RoleGuard, Toaster } from "@attendance/ui";
import "@attendance/ui/styles.css";

import { AdminLayout } from "./layouts/admin-layout";
import AdminLoginPage from "./pages/login";
import DashboardPage from "./pages/dashboard";
import StudentsPage from "./pages/students";
import StudentDetailPage from "./pages/students/detail";
import LecturersPage from "./pages/lecturers";
import LecturerDetailPage from "./pages/lecturers/detail";
import DepartmentsPage from "./pages/departments";
import AcademicPeriodsPage from "./pages/periods";
import CoursesPage from "./pages/courses";
import CourseDetailPage from "./pages/courses/detail";
import TimetablePage from "./pages/timetable";
import AttendancePage from "./pages/attendance";
import SessionDetailPage from "./pages/attendance/session-detail";
import ReportsPage from "./pages/reports";
import NotificationsPage from "./pages/notifications";
import SettingsPage from "./pages/settings";
import AuditLogsPage from "./pages/audit-logs";

function AdminRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<AdminLoginPage />} />
        <Route
          path="/"
          element={
            <RoleGuard requiredRole="admin" appName="Admin Portal">
              <Outlet />
            </RoleGuard>
          }
        >
          <Route path="students/:id" element={<StudentDetailPage />} />
          <Route path="lecturers/:id" element={<LecturerDetailPage />} />
          <Route path="courses/:id" element={<CourseDetailPage />} />
          <Route path="attendance/sessions/:id" element={<SessionDetailPage />} />

          <Route element={<AdminLayout />}>
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<DashboardPage />} />
            <Route path="students" element={<StudentsPage />} />
            <Route path="lecturers" element={<LecturersPage />} />
            <Route path="departments" element={<DepartmentsPage />} />
            <Route path="periods" element={<AcademicPeriodsPage />} />
            <Route path="academic-periods" element={<AcademicPeriodsPage />} />
            <Route path="courses" element={<CoursesPage />} />
            <Route path="timetable" element={<TimetablePage />} />
            <Route path="attendance" element={<AttendancePage />} />
            <Route path="reports" element={<ReportsPage />} />
            <Route path="notifications" element={<NotificationsPage />} />
            <Route path="settings" element={<SettingsPage />} />
            <Route path="audit-logs" element={<AuditLogsPage />} />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Route>
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <AuthProvider expectedRole="admin">
      <AdminRouter />
      <Toaster />
    </AuthProvider>
  </React.StrictMode>,
);
