import * as React from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { AuthProvider } from "@attendance/supabase";
import { RoleGuard, Toaster } from "@attendance/ui";
import "@attendance/ui/styles.css";

import { StudentLayout } from "./layouts/student-layout";
import StudentLoginPage from "./pages/login";
import StudentHomePage from "./pages/home";
import StudentCoursesPage from "./pages/courses";
import StudentCourseDetailPage from "./pages/courses/detail";
import StudentTimetablePage from "./pages/timetable";
import StudentCheckinPage from "./pages/check-in";
import StudentHistoryPage from "./pages/history";
import StudentCorrectionsPage from "./pages/corrections";
import NewStudentCorrectionPage from "./pages/corrections/new";
import StudentNotificationsPage from "./pages/notifications";
import StudentProfilePage from "./pages/profile";

function StudentRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<StudentLoginPage />} />
        <Route
          path="/"
          element={
            <RoleGuard requiredRole="student" appName="Student PWA">
              <StudentLayout />
            </RoleGuard>
          }
        >
          <Route index element={<Navigate to="/home" replace />} />
          <Route path="home" element={<StudentHomePage />} />
          <Route path="courses" element={<StudentCoursesPage />} />
          <Route path="courses/:id" element={<StudentCourseDetailPage />} />
          <Route path="timetable" element={<StudentTimetablePage />} />
          <Route path="check-in" element={<StudentCheckinPage />} />
          <Route path="history" element={<StudentHistoryPage />} />
          <Route path="corrections" element={<StudentCorrectionsPage />} />
          <Route path="corrections/new" element={<NewStudentCorrectionPage />} />
          <Route path="notifications" element={<StudentNotificationsPage />} />
          <Route path="profile" element={<StudentProfilePage />} />
          <Route path="*" element={<Navigate to="/home" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <AuthProvider expectedRole="student">
      <StudentRouter />
      <Toaster />
    </AuthProvider>
  </React.StrictMode>,
);
