import type {
  AcademicPeriod,
  AppNotification,
  AppRole,
  AttendanceEntry,
  AttendanceSession,
  AttendanceStatus,
  AuditLog,
  CheckinResponse,
  CorrectionRequest,
  CorrectionStatus,
  Course,
  CourseEnrollment,
  CourseLecturer,
  CredentialMethod,
  Department,
  IssuedCredentialResult,
  LecturerRecord,
  Profile,
  StudentRecord,
  SystemSettings,
  TimetableEntry,
  UserRoleRow,
} from "@attendance/types";

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: Profile;
        Insert: Omit<Profile, "created_at"> & { created_at?: string };
        Update: Partial<Omit<Profile, "id" | "created_at">>;
      };
      user_roles: {
        Row: UserRoleRow;
        Insert: Omit<UserRoleRow, "created_at"> & { created_at?: string };
        Update: Partial<Pick<UserRoleRow, "role">>;
      };
      departments: {
        Row: Department;
        Insert: Omit<Department, "id" | "created_at"> & { id?: string; created_at?: string };
        Update: Partial<Omit<Department, "id" | "created_at">>;
      };
      academic_periods: {
        Row: AcademicPeriod;
        Insert: Omit<AcademicPeriod, "id" | "created_at"> & { id?: string; created_at?: string };
        Update: Partial<Omit<AcademicPeriod, "id" | "created_at">>;
      };
      students: {
        Row: StudentRecord;
        Insert: Omit<StudentRecord, "created_at" | "profile" | "department"> & { created_at?: string };
        Update: Partial<Omit<StudentRecord, "user_id" | "created_at" | "profile" | "department">>;
      };
      lecturers: {
        Row: LecturerRecord;
        Insert: Omit<LecturerRecord, "created_at" | "profile" | "department"> & { created_at?: string };
        Update: Partial<Omit<LecturerRecord, "user_id" | "created_at" | "profile" | "department">>;
      };
      courses: {
        Row: Course;
        Insert: Omit<Course, "id" | "created_at" | "department" | "academic_period"> & {
          id?: string;
          created_at?: string;
        };
        Update: Partial<Omit<Course, "id" | "created_at" | "department" | "academic_period">>;
      };
      course_lecturers: {
        Row: CourseLecturer;
        Insert: Omit<CourseLecturer, "assigned_at"> & { assigned_at?: string };
        Update: Partial<CourseLecturer>;
      };
      course_enrollments: {
        Row: CourseEnrollment;
        Insert: Omit<CourseEnrollment, "enrolled_at" | "unenrolled_at"> & {
          enrolled_at?: string;
          unenrolled_at?: string | null;
        };
        Update: Partial<CourseEnrollment>;
      };
      timetables: {
        Row: TimetableEntry;
        Insert: Omit<TimetableEntry, "id" | "created_at" | "course"> & {
          id?: string;
          created_at?: string;
        };
        Update: Partial<Omit<TimetableEntry, "id" | "created_at" | "course">>;
      };
      attendance_sessions: {
        Row: AttendanceSession;
        Insert: Omit<AttendanceSession, "id" | "created_at" | "course"> & {
          id?: string;
          created_at?: string;
        };
        Update: Partial<Omit<AttendanceSession, "id" | "created_at" | "course">>;
      };
      attendance_entries: {
        Row: AttendanceEntry;
        Insert: never;
        Update: never;
      };
      correction_requests: {
        Row: CorrectionRequest;
        Insert: never;
        Update: never;
      };
      notifications: {
        Row: AppNotification;
        Insert: Omit<AppNotification, "id" | "created_at"> & { id?: string; created_at?: string };
        Update: Pick<AppNotification, "is_read">;
      };
      audit_logs: {
        Row: AuditLog;
        Insert: never;
        Update: never;
      };
      system_settings: {
        Row: SystemSettings;
        Insert: Partial<SystemSettings>;
        Update: Partial<Omit<SystemSettings, "id">>;
      };
    };
    Functions: {
      current_user_role: {
        Args: Record<string, never>;
        Returns: AppRole | null;
      };
      issue_attendance_credential: {
        Args: { p_session_id: string };
        Returns: IssuedCredentialResult;
      };
      submit_checkin: {
        Args: {
          p_credential: string;
          p_method?: CredentialMethod;
          p_session_id?: string | null;
        };
        Returns: CheckinResponse;
      };
      mark_attendance: {
        Args: {
          p_session_id: string;
          p_student_id: string;
          p_status: AttendanceStatus;
          p_reason?: string | null;
        };
        Returns: AttendanceEntry;
      };
      finalize_session: {
        Args: { p_session_id: string };
        Returns: {
          session_id: string;
          status: string;
          closed_at: string;
          absent_inserted: number;
        };
      };
      submit_correction_request: {
        Args: {
          p_attendance_entry_id: string;
          p_requested_status: AttendanceStatus;
          p_reason: string;
        };
        Returns: CorrectionRequest;
      };
      review_correction: {
        Args: {
          p_request_id: string;
          p_decision: CorrectionStatus;
          p_decision_note?: string | null;
        };
        Returns: CorrectionRequest;
      };
      admin_update_user_access: {
        Args: {
          p_target_user_id: string;
          p_is_active?: boolean | null;
          p_new_role?: AppRole | null;
          p_reason?: string | null;
        };
        Returns: {
          user_id: string;
          is_active: boolean;
          role: AppRole;
        };
      };
    };
  };
}
