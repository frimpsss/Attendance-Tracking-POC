import type {
  AcademicPeriod,
  AppNotification,
  AppRole,
  AttendanceEntry,
  AttendanceSession,
  AuditLog,
  CorrectionRequest,
  Course,
  CourseEnrollment,
  CourseLecturer,
  CredentialMethod,
  Department,
  LecturerRecord,
  Profile,
  StudentRecord,
  SystemSettings,
  TimetableEntry,
  UserRoleRow,
} from "@attendance/types";

export interface DemoCredentialRow {
  id: string;
  session_id: string;
  method: CredentialMethod;
  credential_value: string;
  expires_at: string;
  revoked_at: string | null;
  created_at: string;
}

export interface DemoDatabaseState {
  profiles: Profile[];
  user_roles: UserRoleRow[];
  departments: Department[];
  academic_periods: AcademicPeriod[];
  students: StudentRecord[];
  lecturers: LecturerRecord[];
  courses: Course[];
  course_lecturers: CourseLecturer[];
  course_enrollments: CourseEnrollment[];
  timetables: TimetableEntry[];
  attendance_sessions: AttendanceSession[];
  attendance_credentials: DemoCredentialRow[];
  attendance_entries: AttendanceEntry[];
  correction_requests: CorrectionRequest[];
  notifications: AppNotification[];
  audit_logs: AuditLog[];
  system_settings: SystemSettings;
}

const STORAGE_KEY = "attendance_poc_demo_db_v1";
const CHANNEL_NAME = "attendance_poc_demo_sync";

const DEPT_CS = "11111111-1111-4111-8111-111111111101";
const DEPT_BUS = "11111111-1111-4111-8111-111111111102";
const PERIOD_1 = "22222222-2222-4222-8222-222222222201";

const COURSE_CS301 = "33333333-3333-4333-8333-333333333301";
const COURSE_CS304 = "33333333-3333-4333-8333-333333333302";
const COURSE_CS402 = "33333333-3333-4333-8333-333333333303";
const COURSE_BUS205 = "33333333-3333-4333-8333-333333333304";

const USER_ADMIN = "00000000-0000-4000-8000-000000000001";
const USER_LEC1 = "00000000-0000-4000-8000-000000000002";
const USER_LEC2 = "00000000-0000-4000-8000-000000000003";

const STU_IDS = [
  "00000000-0000-4000-8000-000000000101",
  "00000000-0000-4000-8000-000000000102",
  "00000000-0000-4000-8000-000000000103",
  "00000000-0000-4000-8000-000000000104",
  "00000000-0000-4000-8000-000000000105",
  "00000000-0000-4000-8000-000000000106",
  "00000000-0000-4000-8000-000000000107",
  "00000000-0000-4000-8000-000000000108",
  "00000000-0000-4000-8000-000000000109",
  "00000000-0000-4000-8000-000000000110",
];

export function buildInitialDemoState(): DemoDatabaseState {
  const createdAt = "2026-09-01T08:00:00Z";

  const profiles: Profile[] = [
    { id: USER_ADMIN, full_name: "Nana Kwame Mensah", email: "admin@university.edu.gh", phone: "+233 24 100 0001", is_active: true, created_at: createdAt },
    { id: USER_LEC1, full_name: "Dr. Kofi Boateng", email: "k.boateng@university.edu.gh", phone: "+233 24 200 0001", is_active: true, created_at: createdAt },
    { id: USER_LEC2, full_name: "Prof. Ama Osei-Tutu", email: "a.osei@university.edu.gh", phone: "+233 24 200 0002", is_active: true, created_at: createdAt },
    { id: STU_IDS[0], full_name: "Abena Asante", email: "abena.asante@st.university.edu.gh", phone: "+233 50 300 0001", is_active: true, created_at: createdAt },
    { id: STU_IDS[1], full_name: "Kwesi Appiah", email: "kwesi.appiah@st.university.edu.gh", phone: "+233 50 300 0002", is_active: true, created_at: createdAt },
    { id: STU_IDS[2], full_name: "Efua Tetteh", email: "efua.tetteh@st.university.edu.gh", phone: "+233 50 300 0003", is_active: true, created_at: createdAt },
    { id: STU_IDS[3], full_name: "Yaw Darko", email: "yaw.darko@st.university.edu.gh", phone: "+233 50 300 0004", is_active: true, created_at: createdAt },
    { id: STU_IDS[4], full_name: "Akosua Owusu", email: "akosua.owusu@st.university.edu.gh", phone: "+233 50 300 0005", is_active: true, created_at: createdAt },
    { id: STU_IDS[5], full_name: "Kojo Baffour", email: "kojo.baffour@st.university.edu.gh", phone: "+233 50 300 0006", is_active: true, created_at: createdAt },
    { id: STU_IDS[6], full_name: "Adwoa Nyarko", email: "adwoa.nyarko@st.university.edu.gh", phone: "+233 50 300 0007", is_active: true, created_at: createdAt },
    { id: STU_IDS[7], full_name: "Fiifi Quaye", email: "fiifi.quaye@st.university.edu.gh", phone: "+233 50 300 0008", is_active: true, created_at: createdAt },
    { id: STU_IDS[8], full_name: "Esi Ankrah", email: "esi.ankrah@st.university.edu.gh", phone: "+233 50 300 0009", is_active: true, created_at: createdAt },
    { id: STU_IDS[9], full_name: "Nii Lante Addo", email: "niilante.addo@st.university.edu.gh", phone: "+233 50 300 0010", is_active: true, created_at: createdAt },
  ];

  const user_roles: UserRoleRow[] = [
    { user_id: USER_ADMIN, role: "admin", created_at: createdAt },
    { user_id: USER_LEC1, role: "lecturer", created_at: createdAt },
    { user_id: USER_LEC2, role: "lecturer", created_at: createdAt },
    ...STU_IDS.map((id) => ({ user_id: id, role: "student" as AppRole, created_at: createdAt })),
  ];

  const departments: Department[] = [
    { id: DEPT_CS, code: "CS", name: "Computer Science & Engineering", is_active: true, created_at: createdAt },
    { id: DEPT_BUS, code: "BUS", name: "Business Administration & Analytics", is_active: true, created_at: createdAt },
  ];

  const academic_periods: AcademicPeriod[] = [
    { id: PERIOD_1, name: "2026/2027 — Semester 1", start_date: "2026-09-01", end_date: "2027-01-31", is_active: true, created_at: createdAt },
  ];

  const students: StudentRecord[] = [
    { user_id: STU_IDS[0], student_number: "STU-109001", department_id: DEPT_CS, academic_level: "300", created_at: createdAt },
    { user_id: STU_IDS[1], student_number: "STU-109002", department_id: DEPT_CS, academic_level: "300", created_at: createdAt },
    { user_id: STU_IDS[2], student_number: "STU-109003", department_id: DEPT_CS, academic_level: "300", created_at: createdAt },
    { user_id: STU_IDS[3], student_number: "STU-109004", department_id: DEPT_CS, academic_level: "400", created_at: createdAt },
    { user_id: STU_IDS[4], student_number: "STU-109005", department_id: DEPT_CS, academic_level: "300", created_at: createdAt },
    { user_id: STU_IDS[5], student_number: "STU-109006", department_id: DEPT_CS, academic_level: "400", created_at: createdAt },
    { user_id: STU_IDS[6], student_number: "STU-109007", department_id: DEPT_BUS, academic_level: "200", created_at: createdAt },
    { user_id: STU_IDS[7], student_number: "STU-109008", department_id: DEPT_BUS, academic_level: "200", created_at: createdAt },
    { user_id: STU_IDS[8], student_number: "STU-109009", department_id: DEPT_CS, academic_level: "300", created_at: createdAt },
    { user_id: STU_IDS[9], student_number: "STU-109010", department_id: DEPT_BUS, academic_level: "200", created_at: createdAt },
  ];

  const lecturers: LecturerRecord[] = [
    { user_id: USER_LEC1, staff_number: "STF-2026-001", department_id: DEPT_CS, created_at: createdAt },
    { user_id: USER_LEC2, staff_number: "STF-2026-002", department_id: DEPT_BUS, created_at: createdAt },
  ];

  const courses: Course[] = [
    { id: COURSE_CS301, code: "CS301", title: "Software Engineering & Architecture", department_id: DEPT_CS, academic_period_id: PERIOD_1, is_active: true, created_at: createdAt },
    { id: COURSE_CS304, code: "CS304", title: "Database Systems & Security", department_id: DEPT_CS, academic_period_id: PERIOD_1, is_active: true, created_at: createdAt },
    { id: COURSE_CS402, code: "CS402", title: "Distributed Cloud Systems", department_id: DEPT_CS, academic_period_id: PERIOD_1, is_active: true, created_at: createdAt },
    { id: COURSE_BUS205, code: "BUS205", title: "Operations & Quantitative Methods", department_id: DEPT_BUS, academic_period_id: PERIOD_1, is_active: true, created_at: createdAt },
  ];

  const course_lecturers: CourseLecturer[] = [
    { course_id: COURSE_CS301, lecturer_id: USER_LEC1, assigned_at: createdAt },
    { course_id: COURSE_CS304, lecturer_id: USER_LEC1, assigned_at: createdAt },
    { course_id: COURSE_CS402, lecturer_id: USER_LEC1, assigned_at: createdAt },
    { course_id: COURSE_BUS205, lecturer_id: USER_LEC2, assigned_at: createdAt },
  ];

  const csIndices = [0, 1, 2, 3, 4, 5, 8];
  const busIndices = [0, 6, 7, 9];
  const course_enrollments: CourseEnrollment[] = [
    ...csIndices.map((idx) => ({
      course_id: COURSE_CS301,
      student_id: STU_IDS[idx],
      enrolled_at: createdAt,
      unenrolled_at: null,
      is_active: true,
    })),
    ...csIndices.map((idx) => ({
      course_id: COURSE_CS304,
      student_id: STU_IDS[idx],
      enrolled_at: createdAt,
      unenrolled_at: null,
      is_active: true,
    })),
    ...[0, 3, 5].map((idx) => ({
      course_id: COURSE_CS402,
      student_id: STU_IDS[idx],
      enrolled_at: createdAt,
      unenrolled_at: null,
      is_active: true,
    })),
    ...busIndices.map((idx) => ({
      course_id: COURSE_BUS205,
      student_id: STU_IDS[idx],
      enrolled_at: createdAt,
      unenrolled_at: null,
      is_active: true,
    })),
  ];

  const timetables: TimetableEntry[] = [
    { id: "44444444-4444-4444-8444-444444444401", course_id: COURSE_CS301, weekday: 1, start_time: "09:00", end_time: "11:00", venue: "Engineering Block — Lecture Hall A", effective_from: "2026-09-01", effective_to: "2027-01-31", created_at: createdAt },
    { id: "44444444-4444-4444-8444-444444444402", course_id: COURSE_CS301, weekday: 3, start_time: "14:00", end_time: "16:00", venue: "Software Lab 2", effective_from: "2026-09-01", effective_to: "2027-01-31", created_at: createdAt },
    { id: "44444444-4444-4444-8444-444444444403", course_id: COURSE_CS304, weekday: 2, start_time: "10:00", end_time: "12:00", venue: "Engineering Block — Room 204", effective_from: "2026-09-01", effective_to: "2027-01-31", created_at: createdAt },
    { id: "44444444-4444-4444-8444-444444444404", course_id: COURSE_CS402, weekday: 4, start_time: "13:00", end_time: "15:00", venue: "Innovation Auditorium", effective_from: "2026-09-01", effective_to: "2027-01-31", created_at: createdAt },
    { id: "44444444-4444-4444-8444-444444444405", course_id: COURSE_BUS205, weekday: 5, start_time: "08:30", end_time: "10:30", venue: "Business School — Hall B", effective_from: "2026-09-01", effective_to: "2027-01-31", created_at: createdAt },
  ];

  const SESS_1 = "55555555-5555-4555-8555-555555555501";
  const SESS_2 = "55555555-5555-4555-8555-555555555502";
  const SESS_3 = "55555555-5555-4555-8555-555555555503";
  const SESS_4 = "55555555-5555-4555-8555-555555555504";
  const SESS_OPEN = "55555555-5555-4555-8555-555555555505";

  const nowIso = new Date().toISOString();
  const futureIso = new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString();

  const attendance_sessions: AttendanceSession[] = [
    { id: SESS_OPEN, course_id: COURSE_CS301, created_by: USER_LEC1, title: "Week 3 — Live Classroom Session", scheduled_at: nowIso, opened_at: nowIso, closes_at: futureIso, closed_at: null, status: "open", created_at: nowIso },
    { id: SESS_1, course_id: COURSE_CS301, created_by: USER_LEC1, title: "Week 1 — Domain-Driven Design & Monorepos", scheduled_at: "2026-10-05T09:00:00Z", opened_at: "2026-10-05T09:02:00Z", closes_at: "2026-10-05T09:32:00Z", closed_at: "2026-10-05T10:55:00Z", status: "closed", created_at: "2026-10-05T08:55:00Z" },
    { id: SESS_2, course_id: COURSE_CS301, created_by: USER_LEC1, title: "Week 2 — Clean Architecture & Boundaries", scheduled_at: "2026-10-12T09:00:00Z", opened_at: "2026-10-12T09:00:00Z", closes_at: "2026-10-12T09:30:00Z", closed_at: "2026-10-12T10:50:00Z", status: "closed", created_at: "2026-10-12T08:55:00Z" },
    { id: SESS_3, course_id: COURSE_CS304, created_by: USER_LEC1, title: "Week 1 — Relational Algebra & Postgres RLS", scheduled_at: "2026-10-06T10:00:00Z", opened_at: "2026-10-06T10:01:00Z", closes_at: "2026-10-06T10:31:00Z", closed_at: "2026-10-06T11:50:00Z", status: "closed", created_at: "2026-10-06T09:50:00Z" },
    { id: SESS_4, course_id: COURSE_BUS205, created_by: USER_LEC2, title: "Week 1 — Linear Programming Models", scheduled_at: "2026-10-09T08:30:00Z", opened_at: "2026-10-09T08:31:00Z", closes_at: "2026-10-09T09:01:00Z", closed_at: "2026-10-09T10:25:00Z", status: "closed", created_at: "2026-10-09T08:25:00Z" },
  ];

  const attendance_entries: AttendanceEntry[] = [
    // SESS_1
    { id: "66666666-6666-4666-8666-666666666601", session_id: SESS_1, student_id: STU_IDS[0], status: "present", source: "qr", checked_in_at: "2026-10-05T09:05:00Z", marked_by: STU_IDS[0], updated_at: "2026-10-05T09:05:00Z", created_at: "2026-10-05T09:05:00Z" },
    { id: "66666666-6666-4666-8666-666666666602", session_id: SESS_1, student_id: STU_IDS[1], status: "present", source: "code", checked_in_at: "2026-10-05T09:07:00Z", marked_by: STU_IDS[1], updated_at: "2026-10-05T09:07:00Z", created_at: "2026-10-05T09:07:00Z" },
    { id: "66666666-6666-4666-8666-666666666603", session_id: SESS_1, student_id: STU_IDS[2], status: "late", source: "qr", checked_in_at: "2026-10-05T09:16:00Z", marked_by: STU_IDS[2], updated_at: "2026-10-05T09:16:00Z", created_at: "2026-10-05T09:16:00Z" },
    { id: "66666666-6666-4666-8666-666666666604", session_id: SESS_1, student_id: STU_IDS[3], status: "present", source: "qr", checked_in_at: "2026-10-05T09:04:00Z", marked_by: STU_IDS[3], updated_at: "2026-10-05T09:04:00Z", created_at: "2026-10-05T09:04:00Z" },
    { id: "66666666-6666-4666-8666-666666666605", session_id: SESS_1, student_id: STU_IDS[4], status: "absent", source: "manual", checked_in_at: null, marked_by: USER_LEC1, updated_at: "2026-10-05T10:55:00Z", created_at: "2026-10-05T10:55:00Z" },
    { id: "66666666-6666-4666-8666-666666666606", session_id: SESS_1, student_id: STU_IDS[5], status: "present", source: "qr", checked_in_at: "2026-10-05T09:06:00Z", marked_by: STU_IDS[5], updated_at: "2026-10-05T09:06:00Z", created_at: "2026-10-05T09:06:00Z" },
    { id: "66666666-6666-4666-8666-666666666607", session_id: SESS_1, student_id: STU_IDS[8], status: "absent", source: "manual", checked_in_at: null, marked_by: USER_LEC1, updated_at: "2026-10-05T10:55:00Z", created_at: "2026-10-05T10:55:00Z" },
    // SESS_2
    { id: "66666666-6666-4666-8666-666666666608", session_id: SESS_2, student_id: STU_IDS[0], status: "absent", source: "manual", checked_in_at: null, marked_by: USER_LEC1, updated_at: "2026-10-12T10:50:00Z", created_at: "2026-10-12T10:50:00Z" },
    { id: "66666666-6666-4666-8666-666666666609", session_id: SESS_2, student_id: STU_IDS[1], status: "present", source: "qr", checked_in_at: "2026-10-12T09:03:00Z", marked_by: STU_IDS[1], updated_at: "2026-10-12T09:03:00Z", created_at: "2026-10-12T09:03:00Z" },
    { id: "66666666-6666-4666-8666-666666666610", session_id: SESS_2, student_id: STU_IDS[2], status: "present", source: "qr", checked_in_at: "2026-10-12T09:04:00Z", marked_by: STU_IDS[2], updated_at: "2026-10-12T09:04:00Z", created_at: "2026-10-12T09:04:00Z" },
    { id: "66666666-6666-4666-8666-666666666611", session_id: SESS_2, student_id: STU_IDS[3], status: "late", source: "code", checked_in_at: "2026-10-12T09:14:00Z", marked_by: STU_IDS[3], updated_at: "2026-10-12T09:14:00Z", created_at: "2026-10-12T09:14:00Z" },
    { id: "66666666-6666-4666-8666-666666666612", session_id: SESS_2, student_id: STU_IDS[4], status: "absent", source: "manual", checked_in_at: null, marked_by: USER_LEC1, updated_at: "2026-10-12T10:50:00Z", created_at: "2026-10-12T10:50:00Z" },
    { id: "66666666-6666-4666-8666-666666666613", session_id: SESS_2, student_id: STU_IDS[5], status: "present", source: "qr", checked_in_at: "2026-10-12T09:05:00Z", marked_by: STU_IDS[5], updated_at: "2026-10-12T09:05:00Z", created_at: "2026-10-12T09:05:00Z" },
    { id: "66666666-6666-4666-8666-666666666614", session_id: SESS_2, student_id: STU_IDS[8], status: "absent", source: "manual", checked_in_at: null, marked_by: USER_LEC1, updated_at: "2026-10-12T10:50:00Z", created_at: "2026-10-12T10:50:00Z" },
    // SESS_3
    { id: "66666666-6666-4666-8666-666666666615", session_id: SESS_3, student_id: STU_IDS[0], status: "present", source: "qr", checked_in_at: "2026-10-06T10:04:00Z", marked_by: STU_IDS[0], updated_at: "2026-10-06T10:04:00Z", created_at: "2026-10-06T10:04:00Z" },
    { id: "66666666-6666-4666-8666-666666666616", session_id: SESS_3, student_id: STU_IDS[1], status: "present", source: "qr", checked_in_at: "2026-10-06T10:05:00Z", marked_by: STU_IDS[1], updated_at: "2026-10-06T10:05:00Z", created_at: "2026-10-06T10:05:00Z" },
    { id: "66666666-6666-4666-8666-666666666617", session_id: SESS_3, student_id: STU_IDS[2], status: "present", source: "code", checked_in_at: "2026-10-06T10:08:00Z", marked_by: STU_IDS[2], updated_at: "2026-10-06T10:08:00Z", created_at: "2026-10-06T10:08:00Z" },
    { id: "66666666-6666-4666-8666-666666666618", session_id: SESS_3, student_id: STU_IDS[3], status: "present", source: "qr", checked_in_at: "2026-10-06T10:03:00Z", marked_by: STU_IDS[3], updated_at: "2026-10-06T10:03:00Z", created_at: "2026-10-06T10:03:00Z" },
    { id: "66666666-6666-4666-8666-666666666619", session_id: SESS_3, student_id: STU_IDS[4], status: "late", source: "qr", checked_in_at: "2026-10-06T10:15:00Z", marked_by: STU_IDS[4], updated_at: "2026-10-06T10:15:00Z", created_at: "2026-10-06T10:15:00Z" },
    { id: "66666666-6666-4666-8666-666666666620", session_id: SESS_3, student_id: STU_IDS[5], status: "present", source: "qr", checked_in_at: "2026-10-06T10:06:00Z", marked_by: STU_IDS[5], updated_at: "2026-10-06T10:06:00Z", created_at: "2026-10-06T10:06:00Z" },
    { id: "66666666-6666-4666-8666-666666666621", session_id: SESS_3, student_id: STU_IDS[8], status: "absent", source: "manual", checked_in_at: null, marked_by: USER_LEC1, updated_at: "2026-10-06T11:50:00Z", created_at: "2026-10-06T11:50:00Z" },
    // SESS_4
    { id: "66666666-6666-4666-8666-666666666622", session_id: SESS_4, student_id: STU_IDS[0], status: "present", source: "qr", checked_in_at: "2026-10-09T08:34:00Z", marked_by: STU_IDS[0], updated_at: "2026-10-09T08:34:00Z", created_at: "2026-10-09T08:34:00Z" },
    { id: "66666666-6666-4666-8666-666666666623", session_id: SESS_4, student_id: STU_IDS[6], status: "present", source: "qr", checked_in_at: "2026-10-09T08:35:00Z", marked_by: STU_IDS[6], updated_at: "2026-10-09T08:35:00Z", created_at: "2026-10-09T08:35:00Z" },
    { id: "66666666-6666-4666-8666-666666666624", session_id: SESS_4, student_id: STU_IDS[7], status: "late", source: "code", checked_in_at: "2026-10-09T08:45:00Z", marked_by: STU_IDS[7], updated_at: "2026-10-09T08:45:00Z", created_at: "2026-10-09T08:45:00Z" },
    { id: "66666666-6666-4666-8666-666666666625", session_id: SESS_4, student_id: STU_IDS[9], status: "absent", source: "manual", checked_in_at: null, marked_by: USER_LEC2, updated_at: "2026-10-09T10:25:00Z", created_at: "2026-10-09T10:25:00Z" },
  ];

  const correction_requests: CorrectionRequest[] = [
    {
      id: "77777777-7777-4777-8777-777777777701",
      attendance_entry_id: "66666666-6666-4666-8666-666666666608",
      student_id: STU_IDS[0],
      requested_status: "present",
      reason: "My phone battery died during the QR window, but I signed the lab sheet at the front desk.",
      status: "pending",
      reviewer_id: null,
      decision_note: null,
      reviewed_at: null,
      created_at: "2026-10-12T12:15:00Z",
    },
    {
      id: "77777777-7777-4777-8777-777777777702",
      attendance_entry_id: "66666666-6666-4666-8666-666666666605",
      student_id: STU_IDS[4],
      requested_status: "late",
      reason: "Arrived 18 minutes after class started due to campus shuttle breakdown.",
      status: "pending",
      reviewer_id: null,
      decision_note: null,
      reviewed_at: null,
      created_at: "2026-10-06T08:30:00Z",
    },
  ];

  const notifications: AppNotification[] = [
    {
      id: "88888888-8888-4888-8888-888888888801",
      recipient_id: USER_LEC1,
      type: "correction_submitted",
      title: "New Correction Request — CS301",
      body: "Abena Asante requested a change from absent to present for Week 2 — Clean Architecture & Boundaries.",
      is_read: false,
      dedupe_key: "seed_corr_1",
      created_at: "2026-10-12T12:15:00Z",
    },
    {
      id: "88888888-8888-4888-8888-888888888802",
      recipient_id: STU_IDS[4],
      type: "low_attendance",
      title: "Low Attendance Warning — CS301",
      body: "Your attendance in CS301 (Software Engineering & Architecture) is currently 0% (0/2 classes), below the 75% requirement.",
      is_read: false,
      dedupe_key: "seed_low_att_stu5",
      created_at: "2026-10-12T10:55:00Z",
    },
    {
      id: "88888888-8888-4888-8888-888888888803",
      recipient_id: STU_IDS[0],
      type: "low_attendance",
      title: "Low Attendance Warning — CS301",
      body: "Your attendance in CS301 (Software Engineering & Architecture) is currently 50% (1/2 classes), below the 75% requirement.",
      is_read: false,
      dedupe_key: "seed_low_att_stu1",
      created_at: "2026-10-12T10:55:00Z",
    },
  ];

  const audit_logs: AuditLog[] = [
    {
      id: "99999999-9999-4999-8999-999999999901",
      actor_id: USER_LEC1,
      action: "finalize_session",
      entity_type: "attendance_session",
      entity_id: SESS_2,
      old_data: { previous_status: "open" },
      new_data: { status: "closed", absent_auto_created: 3 },
      reason: "Session closed and finalized",
      created_at: "2026-10-12T10:50:00Z",
    },
  ];

  return {
    profiles,
    user_roles,
    departments,
    academic_periods,
    students,
    lecturers,
    courses,
    course_lecturers,
    course_enrollments,
    timetables,
    attendance_sessions,
    attendance_credentials: [
      {
        id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaa01",
        session_id: SESS_OPEN,
        method: "qr",
        credential_value: "qr_demo_token_cs401a",
        expires_at: futureIso,
        revoked_at: null,
        created_at: nowIso,
      },
      {
        id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaa02",
        session_id: SESS_OPEN,
        method: "code",
        credential_value: "CS401A",
        expires_at: futureIso,
        revoked_at: null,
        created_at: nowIso,
      },
    ],
    attendance_entries,
    correction_requests,
    notifications,
    audit_logs,
    system_settings: {
      id: 1,
      low_attendance_threshold: 75,
      late_grace_minutes: 10,
      checkin_window_minutes: 30,
      qr_enabled: true,
      code_enabled: true,
      manual_enabled: true,
      timezone: "Africa/Accra",
      updated_at: createdAt,
    },
  };
}

let memoryState: DemoDatabaseState | null = null;
const listeners = new Set<() => void>();
let bc: BroadcastChannel | null = null;

if (typeof window !== "undefined" && "BroadcastChannel" in window) {
  try {
    bc = new BroadcastChannel(CHANNEL_NAME);
    bc.onmessage = (ev) => {
      if (ev.data?.type === "STATE_UPDATED" && ev.data?.state) {
        memoryState = ev.data.state;
        try {
          window.localStorage.setItem(STORAGE_KEY, JSON.stringify(memoryState));
        } catch {
          // ignore storage quota errors
        }
        listeners.forEach((fn) => fn());
      }
    };
  } catch {
    bc = null;
  }
}

export function getDemoState(): DemoDatabaseState {
  if (memoryState) return memoryState;
  if (typeof window !== "undefined") {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) {
        memoryState = JSON.parse(raw) as DemoDatabaseState;
        return memoryState;
      }
    } catch {
      // fall through
    }
  }
  memoryState = buildInitialDemoState();
  if (typeof window !== "undefined") {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(memoryState));
    } catch {
      // ignore
    }
  }
  return memoryState;
}

export function updateDemoState(updater: (draft: DemoDatabaseState) => void): DemoDatabaseState {
  const current = JSON.parse(JSON.stringify(getDemoState())) as DemoDatabaseState;
  updater(current);
  memoryState = current;
  if (typeof window !== "undefined") {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(current));
    } catch {
      // ignore
    }
  }
  try {
    bc?.postMessage({ type: "STATE_UPDATED", state: current });
  } catch {
    // ignore
  }
  listeners.forEach((fn) => fn());
  return current;
}

export function resetDemoState(): DemoDatabaseState {
  const fresh = buildInitialDemoState();
  memoryState = fresh;
  if (typeof window !== "undefined") {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(fresh));
    } catch {
      // ignore
    }
  }
  try {
    bc?.postMessage({ type: "STATE_UPDATED", state: fresh });
  } catch {
    // ignore
  }
  listeners.forEach((fn) => fn());
  return fresh;
}

export function subscribeDemoState(listener: () => void): () => void {
  listeners.add(listener);
  const onStorage = (e: StorageEvent) => {
    if (e.key === STORAGE_KEY && e.newValue) {
      try {
        memoryState = JSON.parse(e.newValue) as DemoDatabaseState;
        listener();
      } catch {
        // ignore
      }
    }
  };
  if (typeof window !== "undefined") {
    window.addEventListener("storage", onStorage);
  }
  return () => {
    listeners.delete(listener);
    if (typeof window !== "undefined") {
      window.removeEventListener("storage", onStorage);
    }
  };
}

export const DEMO_IDS = {
  admin: USER_ADMIN,
  lecturers: {
    mensah: USER_LEC1,
    osei: USER_LEC2,
  },
  students: {
    student1: STU_IDS[0],
    student2: STU_IDS[1],
    student3: STU_IDS[4],
  },
  courses: {
    cs301: COURSE_CS301,
    cs401: COURSE_CS402,
    it305: COURSE_BUS205,
  },
  sessions: {
    cs401Open: "55555555-5555-4555-8555-555555555505",
  },
  corrections: {
    pending1: "77777777-7777-4777-8777-777777777702",
  },
  entries: {
    pendingEntry1: "66666666-6666-4666-8666-666666666605",
  },
} as const;
