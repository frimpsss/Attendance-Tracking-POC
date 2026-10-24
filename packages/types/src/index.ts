import { z } from "zod";

export type AppRole = "admin" | "lecturer" | "student";
export type SessionStatus = "scheduled" | "open" | "closed";
export type CredentialMethod = "qr" | "code";
export type AttendanceStatus = "present" | "late" | "absent";
export type AttendanceSource = "qr" | "code" | "manual" | "correction";
export type EntrySource = AttendanceSource;
export type CorrectionStatus = "pending" | "approved" | "rejected";

export interface Profile {
  id: string;
  full_name: string;
  email: string;
  phone: string | null;
  is_active: boolean;
  created_at: string;
  updated_at?: string;
}

export interface UserRoleRow {
  user_id: string;
  role: AppRole;
  created_at: string;
  updated_at?: string;
}

export interface Department {
  id: string;
  code: string;
  name: string;
  is_active: boolean;
  created_at: string;
}

export interface AcademicPeriod {
  id: string;
  name: string;
  start_date: string;
  end_date: string;
  is_active: boolean;
  created_at: string;
}

export interface StudentRecord {
  user_id: string;
  student_number: string;
  department_id: string;
  academic_level: string;
  created_at: string;
  profile?: Profile;
  department?: Department;
}

export interface LecturerRecord {
  user_id: string;
  staff_number: string;
  department_id: string;
  created_at: string;
  profile?: Profile;
  department?: Department;
}

export interface Course {
  id: string;
  code: string;
  title: string;
  department_id: string;
  academic_period_id: string;
  level?: string;
  is_active: boolean;
  created_at: string;
  department?: Department;
  academic_period?: AcademicPeriod;
}

export interface CourseLecturer {
  course_id: string;
  lecturer_id: string;
  assigned_at: string;
}

export interface CourseEnrollment {
  course_id: string;
  student_id: string;
  enrolled_at: string;
  unenrolled_at: string | null;
  is_active: boolean;
}

export interface TimetableEntry {
  id: string;
  course_id: string;
  weekday: number; // 0 = Sun, 1 = Mon, ..., 6 = Sat
  start_time: string; // HH:mm
  end_time: string; // HH:mm
  venue: string;
  effective_from: string;
  effective_to: string | null;
  created_at: string;
  course?: Course;
}

export interface AttendanceSession {
  id: string;
  course_id: string;
  created_by: string;
  title: string;
  scheduled_at: string;
  opened_at: string | null;
  closes_at: string | null;
  closed_at: string | null;
  status: SessionStatus;
  created_at: string;
  course?: Course;
}

export interface IssuedCredentialResult {
  session_id: string;
  qr_token: string;
  short_code: string;
  checkin_code: string | null;
  issued_at: string;
  expires_at: string;
  closes_at: string;
  is_active: boolean;
}

export type AttendanceCredential = IssuedCredentialResult;

export interface AttendanceEntry {
  id: string;
  session_id: string;
  student_id: string;
  status: AttendanceStatus;
  source: AttendanceSource;
  checked_in_at: string | null;
  marked_by: string | null;
  override_reason?: string | null;
  updated_at: string;
  created_at: string;
}

export interface CheckinResponse {
  ok: boolean;
  code?: string;
  message: string;
  already_checked_in?: boolean;
  entry_id?: string;
  session_id?: string;
  session_title?: string;
  course_id?: string;
  course_code?: string;
  course_title?: string;
  status?: AttendanceStatus;
  source?: AttendanceSource;
  checked_in_at?: string;
}

export interface CorrectionRequest {
  id: string;
  attendance_entry_id: string;
  student_id: string;
  requested_status: AttendanceStatus;
  reason: string;
  supporting_note?: string | null;
  status: CorrectionStatus;
  reviewer_id: string | null;
  decision_note: string | null;
  reviewed_at: string | null;
  created_at: string;
}

export interface AppNotification {
  id: string;
  recipient_id: string;
  type: string;
  title: string;
  body: string;
  is_read: boolean;
  dedupe_key: string | null;
  created_at: string;
}

export interface AuditLog {
  id: string;
  actor_id: string | null;
  action: string;
  entity_type: string;
  entity_id: string;
  old_data: Record<string, unknown> | null;
  new_data: Record<string, unknown> | null;
  reason: string | null;
  created_at: string;
}

export interface SystemSettings {
  id: number;
  low_attendance_threshold: number;
  late_grace_minutes: number;
  checkin_window_minutes: number;
  qr_enabled: boolean;
  code_enabled: boolean;
  manual_enabled: boolean;
  timezone: string;
  updated_at: string;
}

export interface AttendanceSummaryStats {
  eligibleSessionsCount: number;
  presentCount: number;
  lateCount: number;
  attendedCount: number;
  absentCount: number;
  percentage: number | null; // null when eligibleSessionsCount === 0 ("N/A")
  formattedPercentage: string;
  isBelowThreshold: boolean;
}

// ==============================================================================
// Zod Validation Schemas
// ==============================================================================

export const loginSchema = z.object({
  email: z.string().trim().email("Enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export const departmentSchema = z.object({
  code: z.string().trim().min(2, "Code is required").max(16),
  name: z.string().trim().min(2, "Department name is required"),
  is_active: z.boolean().default(true),
});

export const academicPeriodSchema = z
  .object({
    name: z.string().trim().min(3, "Period name is required"),
    start_date: z.string().min(1, "Start date is required"),
    end_date: z.string().min(1, "End date is required"),
    is_active: z.boolean().default(true),
  })
  .refine((data) => data.end_date >= data.start_date, {
    message: "End date must be on or after start date",
    path: ["end_date"],
  });

export const courseSchema = z.object({
  code: z.string().trim().min(2, "Course code is required").max(20),
  title: z.string().trim().min(3, "Course title is required"),
  department_id: z.string().min(1, "Select a department"),
  academic_period_id: z.string().min(1, "Select an academic period"),
  is_active: z.boolean().default(true),
});

export const createStudentSchema = z.object({
  full_name: z.string().trim().min(2, "Full name is required"),
  email: z.string().trim().email("Valid email is required"),
  phone: z.string().trim().optional(),
  student_number: z.string().trim().min(3, "Student ID is required"),
  department_id: z.string().min(1, "Department is required"),
  academic_level: z.string().trim().min(1, "Academic level is required"),
  password: z.string().min(6, "Initial password must be at least 6 characters").optional(),
});

export const createLecturerSchema = z.object({
  full_name: z.string().trim().min(2, "Full name is required"),
  email: z.string().trim().email("Valid email is required"),
  phone: z.string().trim().optional(),
  staff_number: z.string().trim().min(3, "Staff ID is required"),
  department_id: z.string().min(1, "Department is required"),
  password: z.string().min(6, "Initial password must be at least 6 characters").optional(),
});

export const timetableSchema = z
  .object({
    course_id: z.string().min(1, "Select a course"),
    weekday: z.number().int().min(0).max(6),
    start_time: z.string().min(1, "Start time is required"),
    end_time: z.string().min(1, "End time is required"),
    venue: z.string().trim().min(2, "Venue is required"),
    effective_from: z.string().min(1, "Effective from date is required"),
    effective_to: z.string().optional().nullable(),
  })
  .refine((data) => data.end_time > data.start_time, {
    message: "End time must be after start time",
    path: ["end_time"],
  });

export const correctionRequestSchema = z.object({
  attendance_entry_id: z.string().min(1, "Select an attendance record"),
  requested_status: z.enum(["present", "late", "absent"]),
  reason: z.string().trim().min(5, "Please explain why a correction is needed (min 5 characters)"),
});

export const systemSettingsSchema = z.object({
  low_attendance_threshold: z.number().min(1).max(100),
  late_grace_minutes: z.number().int().min(0).max(180),
  checkin_window_minutes: z.number().int().min(1).max(240),
  qr_enabled: z.boolean(),
  code_enabled: z.boolean(),
  manual_enabled: z.boolean(),
  timezone: z.string().min(1),
});
