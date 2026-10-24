import type {
  AcademicPeriod,
  AppNotification,
  AppRole,
  AttendanceCredential,
  AttendanceStatus,
  CorrectionStatus,
  Department,
  EntrySource,
  SessionStatus,
  SystemSettings,
} from "@attendance/types";
import { calculateAttendanceStats } from "@attendance/utils";
import { isSupabaseConfigured, supabase } from "./client";
import { getDemoState } from "./demo-store";

export interface PaginatedResult<T> {
  items: T[];
  total: number;
}

export interface StudentSummaryRow {
  user_id: string;
  student_number: string;
  department_id: string;
  academic_level: string;
  created_at: string;
  full_name: string;
  email: string;
  phone: string | null;
  is_active: boolean;
  department_code: string;
  department_name: string;
  enrolled_courses_count: number;
  active_course_count: number;
  eligible_sessions_count: number;
  eligible_sessions: number;
  present_count: number;
  late_count: number;
  attended_count: number;
  absent_count: number;
  attendance_percentage: number;
  is_below_threshold: boolean;
}

export interface LecturerSummaryRow {
  user_id: string;
  staff_number: string;
  department_id: string;
  created_at: string;
  full_name: string;
  email: string;
  phone: string | null;
  is_active: boolean;
  department_code: string;
  department_name: string;
  assigned_courses_count: number;
  course_count: number;
  course_codes: string[];
  course_ids: string[];
}

export interface CourseSummaryRow {
  id: string;
  code: string;
  title: string;
  department_id: string;
  academic_period_id: string;
  level: string;
  is_active: boolean;
  created_at: string;
  department_code: string;
  department_name: string;
  academic_period_name: string;
  lecturer_names: string[];
  lecturer_ids: string[];
  enrolled_students_count: number;
  enrolled_count: number;
  total_sessions_count: number;
  closed_sessions_count: number;
  closed_session_count: number;
  open_sessions_count: number;
  open_session_count: number;
  attendance_percentage: number | null;
}

export interface SessionSummaryRow {
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
  course_code: string;
  course_title: string;
  department_id: string;
  department_code: string;
  department_name: string;
  created_by_name: string | null;
  enrolled_count: number;
  present_count: number;
  late_count: number;
  absent_count: number;
  checked_in_count: number;
}

export interface DetailedAttendanceEntryRow {
  id: string;
  session_id: string;
  student_id: string;
  status: AttendanceStatus;
  source: string;
  checked_in_at: string | null;
  marked_by: string | null;
  updated_at: string;
  created_at: string;
  course_id: string;
  session_title: string;
  session_scheduled_at: string;
  session_opened_at: string | null;
  session_status: SessionStatus;
  course_code: string;
  course_title: string;
  department_id: string;
  department_code: string;
  department_name: string;
  student_number: string;
  academic_level: string;
  student_name: string;
  student_email: string;
}

export interface DetailedCorrectionRow {
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
  session_id: string;
  current_entry_status: AttendanceStatus;
  current_entry_source: string;
  course_id: string;
  session_title: string;
  session_scheduled_at: string;
  course_code: string;
  course_title: string;
  student_number: string;
  student_name: string;
  student_email: string;
  reviewer_name: string | null;
}

export interface DetailedTimetableRow {
  id: string;
  course_id: string;
  weekday: number;
  start_time: string;
  end_time: string;
  venue: string;
  effective_from: string;
  effective_to: string | null;
  created_at: string;
  course_code: string;
  course_title: string;
  department_id: string;
  department_code: string;
  department_name: string;
  lecturer_names: string[];
  lecturer_ids: string[];
}

export interface DetailedAuditLogRow {
  id: string;
  actor_id: string | null;
  action: string;
  entity_type: string;
  entity_id: string;
  old_data: Record<string, unknown> | null;
  new_data: Record<string, unknown> | null;
  reason: string | null;
  created_at: string;
  actor_name: string | null;
  actor_email: string | null;
}

function slicePage<T>(rows: T[], page: number, pageSize: number): PaginatedResult<T> {
  const start = Math.max(0, (page - 1) * pageSize);
  return {
    items: rows.slice(start, start + pageSize),
    total: rows.length,
  };
}

export async function queryStudentsPage(params: {
  page: number;
  pageSize: number;
  search?: string;
  departmentIds?: string[];
  statuses?: string[];
  courseId?: string;
}): Promise<PaginatedResult<StudentSummaryRow>> {
  const { page, pageSize, search = "", departmentIds = [], statuses = [], courseId } = params;
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  if (isSupabaseConfigured) {
    let query = supabase
      .from("v_students_summary" as "students")
      .select("*", { count: "exact" });

    if (search.trim()) {
      const q = `%${search.trim()}%`;
      query = query.or(`full_name.ilike.${q},student_number.ilike.${q},email.ilike.${q}`);
    }
    if (departmentIds.length > 0) {
      query = query.in("department_id", departmentIds);
    }
    if (statuses.length === 1) {
      query = query.eq("is_active", statuses[0] === "active");
    }
    if (courseId) {
      const { data: enrolled } = await supabase
        .from("course_enrollments")
        .select("student_id")
        .eq("course_id", courseId)
        .eq("is_active", true);
      const ids = ((enrolled ?? []) as Array<{ student_id: string }>).map((r) => r.student_id);
      if (ids.length === 0) return { items: [], total: 0 };
      query = query.in("user_id", ids);
    }

    const { data, count, error } = await query
      .order("full_name", { ascending: true })
      .range(from, to);

    if (error) throw new Error(error.message);
    return {
      items: (data ?? []) as unknown as StudentSummaryRow[],
      total: count ?? 0,
    };
  }

  const db = getDemoState();
  let rows: StudentSummaryRow[] = db.students.map((stu) => {
    const p = db.profiles.find((item) => item.id === stu.user_id);
    const d = db.departments.find((item) => item.id === stu.department_id);
    const activeEnr = db.course_enrollments.filter(
      (ce) => ce.student_id === stu.user_id && ce.is_active,
    );
    const cIds = new Set(activeEnr.map((ce) => ce.course_id));
    const stuSessions = db.attendance_sessions.filter((s) =>
      courseId ? s.course_id === courseId : cIds.has(s.course_id),
    );
    const stats = calculateAttendanceStats({
      sessions: stuSessions,
      entries: db.attendance_entries,
      studentId: stu.user_id,
      enrollments: db.course_enrollments,
      threshold: db.system_settings.low_attendance_threshold,
    });

    return {
      user_id: stu.user_id,
      student_number: stu.student_number,
      department_id: stu.department_id,
      academic_level: stu.academic_level,
      created_at: stu.created_at,
      full_name: p?.full_name ?? "—",
      email: p?.email ?? "—",
      phone: p?.phone ?? null,
      is_active: p?.is_active ?? true,
      department_code: d?.code ?? "—",
      department_name: d?.name ?? "—",
      enrolled_courses_count: activeEnr.length,
      active_course_count: activeEnr.length,
      eligible_sessions_count: stats.eligibleSessionsCount,
      eligible_sessions: stats.eligibleSessionsCount,
      present_count: stats.presentCount,
      late_count: stats.lateCount,
      attended_count: stats.attendedCount,
      absent_count: stats.absentCount,
      attendance_percentage: stats.percentage ?? 100,
      is_below_threshold: stats.isBelowThreshold,
    };
  });

  if (courseId) {
    const enrolledIds = new Set(
      db.course_enrollments
        .filter((ce) => ce.course_id === courseId && ce.is_active)
        .map((ce) => ce.student_id),
    );
    rows = rows.filter((r) => enrolledIds.has(r.user_id));
  }
  if (search.trim()) {
    const q = search.trim().toLowerCase();
    rows = rows.filter(
      (r) =>
        r.full_name.toLowerCase().includes(q) ||
        r.student_number.toLowerCase().includes(q) ||
        r.email.toLowerCase().includes(q),
    );
  }
  if (departmentIds.length > 0) {
    rows = rows.filter((r) => departmentIds.includes(r.department_id));
  }
  if (statuses.length > 0) {
    rows = rows.filter((r) => statuses.includes(r.is_active ? "active" : "inactive"));
  }

  return slicePage(rows, page, pageSize);
}

export async function queryLecturersPage(params: {
  page: number;
  pageSize: number;
  search?: string;
  departmentIds?: string[];
  statuses?: string[];
}): Promise<PaginatedResult<LecturerSummaryRow>> {
  const { page, pageSize, search = "", departmentIds = [], statuses = [] } = params;
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  if (isSupabaseConfigured) {
    let query = supabase
      .from("v_lecturers_summary" as "lecturers")
      .select("*", { count: "exact" });

    if (search.trim()) {
      const q = `%${search.trim()}%`;
      query = query.or(`full_name.ilike.${q},staff_number.ilike.${q},email.ilike.${q}`);
    }
    if (departmentIds.length > 0) {
      query = query.in("department_id", departmentIds);
    }
    if (statuses.length === 1) {
      query = query.eq("is_active", statuses[0] === "active");
    }

    const { data, count, error } = await query
      .order("full_name", { ascending: true })
      .range(from, to);

    if (error) throw new Error(error.message);
    return {
      items: (data ?? []) as unknown as LecturerSummaryRow[],
      total: count ?? 0,
    };
  }

  const db = getDemoState();
  let rows: LecturerSummaryRow[] = db.lecturers.map((lec) => {
    const p = db.profiles.find((item) => item.id === lec.user_id);
    const d = db.departments.find((item) => item.id === lec.department_id);
    const assigned = db.course_lecturers.filter((cl) => cl.lecturer_id === lec.user_id);
    const assignedCourses = assigned
      .map((cl) => db.courses.find((c) => c.id === cl.course_id))
      .filter((c): c is NonNullable<typeof c> => Boolean(c));

    return {
      user_id: lec.user_id,
      staff_number: lec.staff_number,
      department_id: lec.department_id,
      created_at: lec.created_at,
      full_name: p?.full_name ?? "—",
      email: p?.email ?? "—",
      phone: p?.phone ?? null,
      is_active: p?.is_active ?? true,
      department_code: d?.code ?? "—",
      department_name: d?.name ?? "—",
      assigned_courses_count: assignedCourses.length,
      course_count: assignedCourses.length,
      course_codes: assignedCourses.map((c) => c.code),
      course_ids: assignedCourses.map((c) => c.id),
    };
  });

  if (search.trim()) {
    const q = search.trim().toLowerCase();
    rows = rows.filter(
      (r) =>
        r.full_name.toLowerCase().includes(q) ||
        r.staff_number.toLowerCase().includes(q) ||
        r.email.toLowerCase().includes(q),
    );
  }
  if (departmentIds.length > 0) {
    rows = rows.filter((r) => departmentIds.includes(r.department_id));
  }
  if (statuses.length > 0) {
    rows = rows.filter((r) => statuses.includes(r.is_active ? "active" : "inactive"));
  }

  return slicePage(rows, page, pageSize);
}

export async function queryDepartmentsPage(params: {
  page: number;
  pageSize: number;
  search?: string;
}): Promise<PaginatedResult<Department>> {
  const { page, pageSize, search = "" } = params;
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  if (isSupabaseConfigured) {
    let query = supabase.from("departments").select("*", { count: "exact" });
    if (search.trim()) {
      const q = `%${search.trim()}%`;
      query = query.or(`code.ilike.${q},name.ilike.${q}`);
    }
    const { data, count, error } = await query
      .order("code", { ascending: true })
      .range(from, to);
    if (error) throw new Error(error.message);
    return { items: (data ?? []) as Department[], total: count ?? 0 };
  }

  const db = getDemoState();
  let rows = [...db.departments];
  if (search.trim()) {
    const q = search.trim().toLowerCase();
    rows = rows.filter(
      (d) => d.code.toLowerCase().includes(q) || d.name.toLowerCase().includes(q),
    );
  }
  return slicePage(rows, page, pageSize);
}

export async function queryPeriodsPage(params: {
  page: number;
  pageSize: number;
  search?: string;
}): Promise<PaginatedResult<AcademicPeriod>> {
  const { page, pageSize, search = "" } = params;
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  if (isSupabaseConfigured) {
    let query = supabase.from("academic_periods").select("*", { count: "exact" });
    if (search.trim()) {
      query = query.ilike("name", `%${search.trim()}%`);
    }
    const { data, count, error } = await query
      .order("start_date", { ascending: false })
      .range(from, to);
    if (error) throw new Error(error.message);
    return { items: (data ?? []) as AcademicPeriod[], total: count ?? 0 };
  }

  const db = getDemoState();
  let rows = [...db.academic_periods];
  if (search.trim()) {
    const q = search.trim().toLowerCase();
    rows = rows.filter((p) => p.name.toLowerCase().includes(q));
  }
  return slicePage(rows, page, pageSize);
}

export async function queryCoursesPage(params: {
  page: number;
  pageSize: number;
  search?: string;
  departmentIds?: string[];
  periodIds?: string[];
  statuses?: string[];
  lecturerId?: string;
  studentId?: string;
}): Promise<PaginatedResult<CourseSummaryRow>> {
  const {
    page,
    pageSize,
    search = "",
    departmentIds = [],
    periodIds = [],
    statuses = [],
    lecturerId,
    studentId,
  } = params;
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  if (isSupabaseConfigured) {
    let query = supabase
      .from("v_courses_summary" as "courses")
      .select("*", { count: "exact" });

    if (search.trim()) {
      const q = `%${search.trim()}%`;
      query = query.or(`code.ilike.${q},title.ilike.${q}`);
    }
    if (departmentIds.length > 0) {
      query = query.in("department_id", departmentIds);
    }
    if (periodIds.length > 0) {
      query = query.in("academic_period_id", periodIds);
    }
    if (lecturerId) {
      query = query.contains("lecturer_ids", [lecturerId]);
    }

    const { data, count, error } = await query
      .order("code", { ascending: true })
      .range(from, to);
    if (error) throw new Error(error.message);
    return {
      items: (data ?? []) as unknown as CourseSummaryRow[],
      total: count ?? 0,
    };
  }

  const db = getDemoState();
  let rows: CourseSummaryRow[] = db.courses.map((c) => {
    const d = db.departments.find((item) => item.id === c.department_id);
    const ap = db.academic_periods.find((item) => item.id === c.academic_period_id);
    const lecs = db.course_lecturers.filter((cl) => cl.course_id === c.id);
    const lecProfiles = lecs
      .map((cl) => db.profiles.find((p) => p.id === cl.lecturer_id))
      .filter((p): p is NonNullable<typeof p> => Boolean(p));
    const activeEnr = db.course_enrollments.filter(
      (ce) => ce.course_id === c.id && ce.is_active,
    );
    const cSessions = db.attendance_sessions.filter((s) => s.course_id === c.id);
    const closedSessions = cSessions.filter((s) => s.status === "closed");
    const closedIds = new Set(closedSessions.map((s) => s.id));
    const closedEntries = db.attendance_entries.filter((e) => closedIds.has(e.session_id));
    const attended = closedEntries.filter(
      (e) => e.status === "present" || e.status === "late",
    ).length;
    const pct =
      closedEntries.length > 0
        ? Math.round((1000 * attended) / closedEntries.length) / 10
        : null;

    return {
      id: c.id,
      code: c.code,
      title: c.title,
      department_id: c.department_id,
      academic_period_id: c.academic_period_id,
      level: c.level ?? "300",
      is_active: c.is_active,
      created_at: c.created_at,
      department_code: d?.code ?? "—",
      department_name: d?.name ?? "—",
      academic_period_name: ap?.name ?? "—",
      lecturer_names: lecProfiles.map((p) => p.full_name),
      lecturer_ids: lecProfiles.map((p) => p.id),
      enrolled_students_count: activeEnr.length,
      enrolled_count: activeEnr.length,
      total_sessions_count: cSessions.length,
      closed_sessions_count: closedSessions.length,
      closed_session_count: closedSessions.length,
      open_sessions_count: cSessions.filter((s) => s.status === "open").length,
      open_session_count: cSessions.filter((s) => s.status === "open").length,
      attendance_percentage: pct,
    };
  });

  if (statuses.length > 0) {
    rows = rows.filter((r) => statuses.includes(r.is_active ? "active" : "archived"));
  }

  if (lecturerId) {
    rows = rows.filter((r) => r.lecturer_ids.includes(lecturerId));
  }
  if (studentId) {
    const enrolledIds = new Set(
      db.course_enrollments
        .filter((ce) => ce.student_id === studentId && ce.is_active)
        .map((ce) => ce.course_id),
    );
    rows = rows.filter((r) => enrolledIds.has(r.id));
  }
  if (search.trim()) {
    const q = search.trim().toLowerCase();
    rows = rows.filter(
      (r) => r.code.toLowerCase().includes(q) || r.title.toLowerCase().includes(q),
    );
  }
  if (departmentIds.length > 0) {
    rows = rows.filter((r) => departmentIds.includes(r.department_id));
  }
  if (periodIds.length > 0) {
    rows = rows.filter((r) => periodIds.includes(r.academic_period_id));
  }

  return slicePage(rows, page, pageSize);
}

export async function querySessionsPage(params: {
  page: number;
  pageSize: number;
  search?: string;
  courseIds?: string[];
  departmentIds?: string[];
  statuses?: string[];
  lecturerId?: string;
  studentId?: string;
  dateFrom?: string;
  dateTo?: string;
}): Promise<PaginatedResult<SessionSummaryRow>> {
  const {
    page,
    pageSize,
    search = "",
    courseIds = [],
    departmentIds = [],
    statuses = [],
    lecturerId,
    studentId,
    dateFrom,
    dateTo,
  } = params;
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  if (isSupabaseConfigured) {
    let query = supabase
      .from("v_sessions_summary" as "attendance_sessions")
      .select("*", { count: "exact" });

    if (search.trim()) {
      const q = `%${search.trim()}%`;
      query = query.or(`title.ilike.${q},course_code.ilike.${q},course_title.ilike.${q}`);
    }
    if (courseIds.length > 0) query = query.in("course_id", courseIds);
    if (departmentIds.length > 0) query = query.in("department_id", departmentIds);
    if (statuses.length > 0) query = query.in("status", statuses);
    if (dateFrom) query = query.gte("scheduled_at", `${dateFrom}T00:00:00Z`);
    if (dateTo) query = query.lte("scheduled_at", `${dateTo}T23:59:59Z`);

    const { data, count, error } = await query
      .order("scheduled_at", { ascending: false })
      .range(from, to);

    if (error) throw new Error(error.message);
    return {
      items: (data ?? []) as unknown as SessionSummaryRow[],
      total: count ?? 0,
    };
  }

  const db = getDemoState();
  let rows: SessionSummaryRow[] = db.attendance_sessions.map((s) => {
    const c = db.courses.find((item) => item.id === s.course_id);
    const d = db.departments.find((item) => item.id === c?.department_id);
    const creator = db.profiles.find((p) => p.id === s.created_by);
    const enrolledCount = db.course_enrollments.filter(
      (ce) => ce.course_id === s.course_id && ce.is_active,
    ).length;
    const sEntries = db.attendance_entries.filter((e) => e.session_id === s.id);
    const presentCount = sEntries.filter((e) => e.status === "present").length;
    const lateCount = sEntries.filter((e) => e.status === "late").length;
    const absentCount = sEntries.filter((e) => e.status === "absent").length;

    return {
      ...s,
      course_code: c?.code ?? "—",
      course_title: c?.title ?? "—",
      department_id: c?.department_id ?? "",
      department_code: d?.code ?? "—",
      department_name: d?.name ?? "—",
      created_by_name: creator?.full_name ?? null,
      enrolled_count: enrolledCount,
      present_count: presentCount,
      late_count: lateCount,
      absent_count: absentCount,
      checked_in_count: presentCount + lateCount,
    };
  });

  if (lecturerId) {
    const assignedIds = new Set(
      db.course_lecturers
        .filter((cl) => cl.lecturer_id === lecturerId)
        .map((cl) => cl.course_id),
    );
    rows = rows.filter((r) => assignedIds.has(r.course_id));
  }
  if (studentId) {
    const enrolledIds = new Set(
      db.course_enrollments
        .filter((ce) => ce.student_id === studentId && ce.is_active)
        .map((ce) => ce.course_id),
    );
    rows = rows.filter((r) => enrolledIds.has(r.course_id));
  }
  if (search.trim()) {
    const q = search.trim().toLowerCase();
    rows = rows.filter(
      (r) =>
        r.title.toLowerCase().includes(q) ||
        r.course_code.toLowerCase().includes(q) ||
        r.course_title.toLowerCase().includes(q),
    );
  }
  if (courseIds.length > 0) rows = rows.filter((r) => courseIds.includes(r.course_id));
  if (departmentIds.length > 0) rows = rows.filter((r) => departmentIds.includes(r.department_id));
  if (statuses.length > 0) rows = rows.filter((r) => statuses.includes(r.status));
  if (dateFrom) rows = rows.filter((r) => r.scheduled_at >= `${dateFrom}T00:00:00Z`);
  if (dateTo) rows = rows.filter((r) => r.scheduled_at <= `${dateTo}T23:59:59Z`);

  rows.sort((a, b) => new Date(b.scheduled_at).getTime() - new Date(a.scheduled_at).getTime());
  return slicePage(rows, page, pageSize);
}

export async function queryAttendanceEntriesPage(params: {
  page: number;
  pageSize: number;
  search?: string;
  sessionId?: string;
  courseIds?: string[];
  departmentIds?: string[];
  studentId?: string;
  statuses?: string[];
  sources?: string[];
  onlyClosedSessions?: boolean;
  dateFrom?: string;
  dateTo?: string;
}): Promise<PaginatedResult<DetailedAttendanceEntryRow>> {
  const {
    page,
    pageSize,
    search = "",
    sessionId,
    courseIds = [],
    departmentIds = [],
    studentId,
    statuses = [],
    sources = [],
    onlyClosedSessions = false,
    dateFrom,
    dateTo,
  } = params;
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  if (isSupabaseConfigured) {
    let query = supabase
      .from("v_attendance_entries_detailed" as "attendance_entries")
      .select("*", { count: "exact" });

    if (sessionId) query = query.eq("session_id", sessionId);
    if (studentId) query = query.eq("student_id", studentId);
    if (courseIds.length > 0) query = query.in("course_id", courseIds);
    if (departmentIds.length > 0) query = query.in("department_id", departmentIds);
    if (statuses.length > 0) query = query.in("status", statuses);
    if (sources.length > 0) query = query.in("source", sources);
    if (onlyClosedSessions) query = query.eq("session_status", "closed");
    if (dateFrom) query = query.gte("session_scheduled_at", `${dateFrom}T00:00:00Z`);
    if (dateTo) query = query.lte("session_scheduled_at", `${dateTo}T23:59:59Z`);
    if (search.trim()) {
      const q = `%${search.trim()}%`;
      query = query.or(
        `student_name.ilike.${q},student_number.ilike.${q},course_code.ilike.${q},session_title.ilike.${q}`,
      );
    }

    const { data, count, error } = await query
      .order("session_scheduled_at", { ascending: false })
      .range(from, to);

    if (error) throw new Error(error.message);
    return {
      items: (data ?? []) as unknown as DetailedAttendanceEntryRow[],
      total: count ?? 0,
    };
  }

  const db = getDemoState();
  let rows: DetailedAttendanceEntryRow[] = db.attendance_entries.map((ae) => {
    const s = db.attendance_sessions.find((item) => item.id === ae.session_id);
    const c = db.courses.find((item) => item.id === s?.course_id);
    const d = db.departments.find((item) => item.id === c?.department_id);
    const stu = db.students.find((item) => item.user_id === ae.student_id);
    const p = db.profiles.find((item) => item.id === ae.student_id);

    return {
      ...ae,
      course_id: s?.course_id ?? "",
      session_title: s?.title ?? "—",
      session_scheduled_at: s?.scheduled_at ?? ae.created_at,
      session_opened_at: s?.opened_at ?? null,
      session_status: s?.status ?? "closed",
      course_code: c?.code ?? "—",
      course_title: c?.title ?? "—",
      department_id: c?.department_id ?? "",
      department_code: d?.code ?? "—",
      department_name: d?.name ?? "—",
      student_number: stu?.student_number ?? "—",
      academic_level: stu?.academic_level ?? "100",
      student_name: p?.full_name ?? "—",
      student_email: p?.email ?? "—",
    };
  });

  if (sessionId) rows = rows.filter((r) => r.session_id === sessionId);
  if (studentId) rows = rows.filter((r) => r.student_id === studentId);
  if (courseIds.length > 0) rows = rows.filter((r) => courseIds.includes(r.course_id));
  if (departmentIds.length > 0) rows = rows.filter((r) => departmentIds.includes(r.department_id));
  if (statuses.length > 0) rows = rows.filter((r) => statuses.includes(r.status));
  if (sources.length > 0) rows = rows.filter((r) => sources.includes(r.source));
  if (onlyClosedSessions) rows = rows.filter((r) => r.session_status === "closed");
  if (dateFrom) rows = rows.filter((r) => r.session_scheduled_at >= `${dateFrom}T00:00:00Z`);
  if (dateTo) rows = rows.filter((r) => r.session_scheduled_at <= `${dateTo}T23:59:59Z`);
  if (search.trim()) {
    const q = search.trim().toLowerCase();
    rows = rows.filter(
      (r) =>
        r.student_name.toLowerCase().includes(q) ||
        r.student_number.toLowerCase().includes(q) ||
        r.course_code.toLowerCase().includes(q) ||
        r.session_title.toLowerCase().includes(q),
    );
  }

  rows.sort(
    (a, b) =>
      new Date(b.session_scheduled_at).getTime() - new Date(a.session_scheduled_at).getTime(),
  );
  return slicePage(rows, page, pageSize);
}

export async function queryCorrectionsPage(params: {
  page: number;
  pageSize: number;
  search?: string;
  statuses?: string[];
  courseIds?: string[];
  lecturerId?: string;
  studentId?: string;
}): Promise<PaginatedResult<DetailedCorrectionRow>> {
  const {
    page,
    pageSize,
    search = "",
    statuses = [],
    courseIds = [],
    lecturerId,
    studentId,
  } = params;
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  if (isSupabaseConfigured) {
    let query = supabase
      .from("v_correction_requests_detailed" as "correction_requests")
      .select("*", { count: "exact" });

    if (studentId) query = query.eq("student_id", studentId);
    if (statuses.length > 0) query = query.in("status", statuses);
    if (courseIds.length > 0) query = query.in("course_id", courseIds);
    if (search.trim()) {
      const q = `%${search.trim()}%`;
      query = query.or(
        `student_name.ilike.${q},student_number.ilike.${q},course_code.ilike.${q},reason.ilike.${q}`,
      );
    }

    const { data, count, error } = await query
      .order("created_at", { ascending: false })
      .range(from, to);

    if (error) throw new Error(error.message);
    return {
      items: (data ?? []) as unknown as DetailedCorrectionRow[],
      total: count ?? 0,
    };
  }

  const db = getDemoState();
  let rows: DetailedCorrectionRow[] = db.correction_requests.map((cr) => {
    const ae = db.attendance_entries.find((item) => item.id === cr.attendance_entry_id);
    const s = db.attendance_sessions.find((item) => item.id === ae?.session_id);
    const c = db.courses.find((item) => item.id === s?.course_id);
    const stu = db.students.find((item) => item.user_id === cr.student_id);
    const p = db.profiles.find((item) => item.id === cr.student_id);
    const rev = db.profiles.find((item) => item.id === cr.reviewer_id);

    return {
      ...cr,
      session_id: ae?.session_id ?? "",
      current_entry_status: ae?.status ?? "absent",
      current_entry_source: ae?.source ?? "manual",
      course_id: s?.course_id ?? "",
      session_title: s?.title ?? "—",
      session_scheduled_at: s?.scheduled_at ?? cr.created_at,
      course_code: c?.code ?? "—",
      course_title: c?.title ?? "—",
      student_number: stu?.student_number ?? "—",
      student_name: p?.full_name ?? "—",
      student_email: p?.email ?? "—",
      reviewer_name: rev?.full_name ?? null,
    };
  });

  if (lecturerId) {
    const assignedIds = new Set(
      db.course_lecturers
        .filter((cl) => cl.lecturer_id === lecturerId)
        .map((cl) => cl.course_id),
    );
    rows = rows.filter((r) => assignedIds.has(r.course_id));
  }
  if (studentId) {
    const enrolledIds = new Set(
      db.course_enrollments
        .filter((ce) => ce.student_id === studentId && ce.is_active)
        .map((ce) => ce.course_id),
    );
    rows = rows.filter((r) => enrolledIds.has(r.course_id));
  }
  if (studentId) rows = rows.filter((r) => r.student_id === studentId);
  if (statuses.length > 0) rows = rows.filter((r) => statuses.includes(r.status));
  if (courseIds.length > 0) rows = rows.filter((r) => courseIds.includes(r.course_id));
  if (search.trim()) {
    const q = search.trim().toLowerCase();
    rows = rows.filter(
      (r) =>
        r.student_name.toLowerCase().includes(q) ||
        r.student_number.toLowerCase().includes(q) ||
        r.course_code.toLowerCase().includes(q) ||
        r.reason.toLowerCase().includes(q),
    );
  }

  rows.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  return slicePage(rows, page, pageSize);
}

export async function queryCorrectionById(
  id: string,
): Promise<DetailedCorrectionRow | null> {
  if (isSupabaseConfigured) {
    const { data, error } = await supabase
      .from("v_correction_requests_detailed" as "correction_requests")
      .select("*")
      .eq("id", id)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return (data as unknown as DetailedCorrectionRow) ?? null;
  }
  const res = await queryCorrectionsPage({ page: 1, pageSize: 500 });
  return res.items.find((r) => r.id === id) ?? null;
}

export async function queryTimetablesPage(params: {
  page: number;
  pageSize: number;
  search?: string;
  courseId?: string;
  lecturerId?: string;
  studentId?: string;
  weekday?: number | null;
}): Promise<PaginatedResult<DetailedTimetableRow>> {
  const { page, pageSize, search = "", courseId, lecturerId, studentId, weekday } = params;
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  if (isSupabaseConfigured) {
    let query = supabase
      .from("v_timetables_detailed" as "timetables")
      .select("*", { count: "exact" });

    if (courseId) query = query.eq("course_id", courseId);
    if (typeof weekday === "number") query = query.eq("weekday", weekday);
    if (lecturerId) query = query.contains("lecturer_ids", [lecturerId]);
    if (search.trim()) {
      const q = `%${search.trim()}%`;
      query = query.or(`course_code.ilike.${q},course_title.ilike.${q},venue.ilike.${q}`);
    }

    const { data, count, error } = await query
      .order("weekday", { ascending: true })
      .order("start_time", { ascending: true })
      .range(from, to);

    if (error) throw new Error(error.message);
    return {
      items: (data ?? []) as unknown as DetailedTimetableRow[],
      total: count ?? 0,
    };
  }

  const db = getDemoState();
  let rows: DetailedTimetableRow[] = db.timetables.map((t) => {
    const c = db.courses.find((item) => item.id === t.course_id);
    const d = db.departments.find((item) => item.id === c?.department_id);
    const lecs = db.course_lecturers.filter((cl) => cl.course_id === t.course_id);
    const lecProfiles = lecs
      .map((cl) => db.profiles.find((p) => p.id === cl.lecturer_id))
      .filter((p): p is NonNullable<typeof p> => Boolean(p));

    return {
      ...t,
      course_code: c?.code ?? "—",
      course_title: c?.title ?? "—",
      department_id: c?.department_id ?? "",
      department_code: d?.code ?? "—",
      department_name: d?.name ?? "—",
      lecturer_names: lecProfiles.map((p) => p.full_name),
      lecturer_ids: lecProfiles.map((p) => p.id),
    };
  });

  if (courseId) rows = rows.filter((r) => r.course_id === courseId);
  if (typeof weekday === "number") rows = rows.filter((r) => r.weekday === weekday);
  if (lecturerId) rows = rows.filter((r) => r.lecturer_ids.includes(lecturerId));
  if (studentId) {
    const enrolledCourseIds = new Set(
      db.course_enrollments
        .filter((ce) => ce.student_id === studentId && ce.is_active)
        .map((ce) => ce.course_id),
    );
    rows = rows.filter((r) => enrolledCourseIds.has(r.course_id));
  }
  if (search.trim()) {
    const q = search.trim().toLowerCase();
    rows = rows.filter(
      (r) =>
        r.course_code.toLowerCase().includes(q) ||
        r.course_title.toLowerCase().includes(q) ||
        r.venue.toLowerCase().includes(q),
    );
  }

  rows.sort((a, b) => a.weekday - b.weekday || a.start_time.localeCompare(b.start_time));
  return slicePage(rows, page, pageSize);
}

export async function queryNotificationsPage(params: {
  page: number;
  pageSize: number;
  recipientId?: string;
  unreadOnly?: boolean;
}): Promise<PaginatedResult<AppNotification>> {
  const { page, pageSize, recipientId, unreadOnly } = params;
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  if (isSupabaseConfigured) {
    let query = supabase.from("notifications").select("*", { count: "exact" });
    if (recipientId) query = query.eq("recipient_id", recipientId);
    if (unreadOnly) query = query.eq("is_read", false);

    const { data, count, error } = await query
      .order("created_at", { ascending: false })
      .range(from, to);

    if (error) throw new Error(error.message);
    return { items: (data ?? []) as AppNotification[], total: count ?? 0 };
  }

  const db = getDemoState();
  let rows = [...db.notifications];
  if (recipientId) rows = rows.filter((n) => n.recipient_id === recipientId);
  if (unreadOnly) rows = rows.filter((n) => !n.is_read);
  rows.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  return slicePage(rows, page, pageSize);
}

export async function queryAuditLogsPage(params: {
  page: number;
  pageSize: number;
  search?: string;
  entityTypes?: string[];
}): Promise<PaginatedResult<DetailedAuditLogRow>> {
  const { page, pageSize, search = "", entityTypes = [] } = params;
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  if (isSupabaseConfigured) {
    let query = supabase
      .from("v_audit_logs_detailed" as "audit_logs")
      .select("*", { count: "exact" });

    if (entityTypes.length > 0) query = query.in("entity_type", entityTypes);
    if (search.trim()) {
      const q = `%${search.trim()}%`;
      query = query.or(`action.ilike.${q},reason.ilike.${q},actor_name.ilike.${q}`);
    }

    const { data, count, error } = await query
      .order("created_at", { ascending: false })
      .range(from, to);

    if (error) throw new Error(error.message);
    return {
      items: (data ?? []) as unknown as DetailedAuditLogRow[],
      total: count ?? 0,
    };
  }

  const db = getDemoState();
  let rows: DetailedAuditLogRow[] = db.audit_logs.map((al) => {
    const actor = db.profiles.find((p) => p.id === al.actor_id);
    return {
      ...al,
      actor_name: actor?.full_name ?? "System",
      actor_email: actor?.email ?? null,
    };
  });

  if (entityTypes.length > 0) rows = rows.filter((r) => entityTypes.includes(r.entity_type));
  if (search.trim()) {
    const q = search.trim().toLowerCase();
    rows = rows.filter(
      (r) =>
        r.action.toLowerCase().includes(q) ||
        (r.reason ?? "").toLowerCase().includes(q) ||
        (r.actor_name ?? "").toLowerCase().includes(q),
    );
  }

  rows.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  return slicePage(rows, page, pageSize);
}

export async function querySystemSettings(): Promise<SystemSettings> {
  if (isSupabaseConfigured) {
    const { data } = await supabase
      .from("system_settings")
      .select("*")
      .eq("id", 1)
      .maybeSingle();
    if (data) return data as SystemSettings;
  }
  return getDemoState().system_settings;
}

export interface UserAccessRow {
  id: string;
  email: string;
  full_name: string;
  phone: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  role: AppRole;
}

export interface StudentCourseStatsRow {
  student_id: string;
  course_id: string;
  enrolled_at: string;
  enrollment_active: boolean;
  course_code: string;
  course_title: string;
  department_id: string;
  academic_period_id: string;
  course_level: string;
  course_active: boolean;
  department_code: string;
  department_name: string;
  student_number: string;
  academic_level: string;
  student_name: string;
  student_email: string;
  student_active: boolean;
  lecturer_names: string[];
  eligible_sessions: number;
  present_count: number;
  late_count: number;
  absent_count: number;
  attended_count: number;
  attendance_percentage: number;
}

export interface SessionRosterRow {
  session_id: string;
  course_id: string;
  session_status: SessionStatus;
  student_id: string;
  enrolled_at: string;
  student_number: string;
  academic_level: string;
  student_name: string;
  student_email: string;
  entry_id: string | null;
  entry_status: AttendanceStatus | null;
  entry_source: EntrySource | null;
  checked_in_at: string | null;
  marked_by: string | null;
  override_reason: string | null;
}

export async function queryUsersAccessPage(params: {
  page: number;
  pageSize: number;
  search?: string;
  roles?: string[];
  statuses?: string[];
}): Promise<PaginatedResult<UserAccessRow>> {
  const { page, pageSize, search = "", roles = [], statuses = [] } = params;
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  if (isSupabaseConfigured) {
    let query = supabase
      .from("v_users_access" as "profiles")
      .select("*", { count: "exact" });

    if (roles.length > 0) query = query.in("role", roles);
    if (statuses.length === 1) query = query.eq("is_active", statuses[0] === "active");
    if (search.trim()) {
      const q = `%${search.trim()}%`;
      query = query.or(`full_name.ilike.${q},email.ilike.${q}`);
    }

    const { data, count, error } = await query
      .order("full_name", { ascending: true })
      .range(from, to);

    if (error) throw new Error(error.message);
    return {
      items: (data ?? []) as unknown as UserAccessRow[],
      total: count ?? 0,
    };
  }

  const db = getDemoState();
  let rows: UserAccessRow[] = db.profiles.map((p) => {
    const role = db.user_roles.find((r) => r.user_id === p.id)?.role ?? "student";
    return {
      ...p,
      updated_at: p.updated_at ?? p.created_at,
      role,
    };
  });

  if (roles.length > 0) rows = rows.filter((r) => roles.includes(r.role));
  if (statuses.length === 1) {
    const active = statuses[0] === "active";
    rows = rows.filter((r) => r.is_active === active);
  }
  if (search.trim()) {
    const q = search.trim().toLowerCase();
    rows = rows.filter(
      (r) => r.full_name.toLowerCase().includes(q) || r.email.toLowerCase().includes(q),
    );
  }

  rows.sort((a, b) => a.full_name.localeCompare(b.full_name));
  return slicePage(rows, page, pageSize);
}

export async function queryStudentCourseStatsPage(params: {
  page: number;
  pageSize: number;
  studentId?: string;
  courseId?: string;
  courseIds?: string[];
  departmentIds?: string[];
  search?: string;
  onlyActiveEnrollments?: boolean;
  maxPercentage?: number;
}): Promise<PaginatedResult<StudentCourseStatsRow>> {
  const {
    page,
    pageSize,
    studentId,
    courseId,
    courseIds = [],
    departmentIds = [],
    search = "",
    onlyActiveEnrollments = true,
    maxPercentage,
  } = params;
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  if (isSupabaseConfigured) {
    let query = supabase
      .from("v_student_course_stats" as "course_enrollments")
      .select("*", { count: "exact" });

    if (onlyActiveEnrollments) query = query.eq("enrollment_active", true);
    if (studentId) query = query.eq("student_id", studentId);
    if (courseId) query = query.eq("course_id", courseId);
    if (courseIds.length > 0) query = query.in("course_id", courseIds);
    if (departmentIds.length > 0) query = query.in("department_id", departmentIds);
    if (typeof maxPercentage === "number") {
      query = query.lt("attendance_percentage", maxPercentage).gt("eligible_sessions", 0);
    }
    if (search.trim()) {
      const q = `%${search.trim()}%`;
      query = query.or(
        `student_name.ilike.${q},student_number.ilike.${q},course_code.ilike.${q},course_title.ilike.${q}`,
      );
    }

    const { data, count, error } = await query
      .order("course_code", { ascending: true })
      .order("student_name", { ascending: true })
      .range(from, to);

    if (error) throw new Error(error.message);
    return {
      items: (data ?? []) as unknown as StudentCourseStatsRow[],
      total: count ?? 0,
    };
  }

  const db = getDemoState();
  let rows: StudentCourseStatsRow[] = db.course_enrollments.map((ce) => {
    const c = db.courses.find((item) => item.id === ce.course_id);
    const d = db.departments.find((item) => item.id === c?.department_id);
    const s = db.students.find((item) => item.user_id === ce.student_id);
    const p = db.profiles.find((item) => item.id === ce.student_id);
    const lecs = db.course_lecturers
      .filter((cl) => cl.course_id === ce.course_id)
      .map((cl) => db.profiles.find((lp) => lp.id === cl.lecturer_id)?.full_name ?? "—");

    const courseSessions = db.attendance_sessions.filter(
      (sess) => sess.course_id === ce.course_id,
    );
    const stats = calculateAttendanceStats({
      sessions: courseSessions,
      entries: db.attendance_entries,
      studentId: ce.student_id,
      enrollments: [ce],
      threshold: db.system_settings.low_attendance_threshold,
    });

    return {
      student_id: ce.student_id,
      course_id: ce.course_id,
      enrolled_at: ce.enrolled_at,
      enrollment_active: ce.is_active,
      course_code: c?.code ?? "—",
      course_title: c?.title ?? "—",
      department_id: c?.department_id ?? "",
      academic_period_id: c?.academic_period_id ?? "",
      course_level: c?.level ?? "100",
      course_active: c?.is_active ?? true,
      department_code: d?.code ?? "—",
      department_name: d?.name ?? "—",
      student_number: s?.student_number ?? "—",
      academic_level: s?.academic_level ?? "100",
      student_name: p?.full_name ?? "—",
      student_email: p?.email ?? "—",
      student_active: p?.is_active ?? true,
      lecturer_names: lecs,
      eligible_sessions: stats.eligibleSessionsCount,
      present_count: stats.presentCount,
      late_count: stats.lateCount,
      absent_count: stats.absentCount,
      attended_count: stats.attendedCount,
      attendance_percentage: stats.percentage ?? 100,
    };
  });

  if (onlyActiveEnrollments) rows = rows.filter((r) => r.enrollment_active);
  if (studentId) rows = rows.filter((r) => r.student_id === studentId);
  if (courseId) rows = rows.filter((r) => r.course_id === courseId);
  if (courseIds.length > 0) rows = rows.filter((r) => courseIds.includes(r.course_id));
  if (departmentIds.length > 0) rows = rows.filter((r) => departmentIds.includes(r.department_id));
  if (typeof maxPercentage === "number") {
    rows = rows.filter(
      (r) => r.eligible_sessions > 0 && r.attendance_percentage < maxPercentage,
    );
  }
  if (search.trim()) {
    const q = search.trim().toLowerCase();
    rows = rows.filter(
      (r) =>
        r.student_name.toLowerCase().includes(q) ||
        r.student_number.toLowerCase().includes(q) ||
        r.course_code.toLowerCase().includes(q) ||
        r.course_title.toLowerCase().includes(q),
    );
  }

  rows.sort(
    (a, b) => a.course_code.localeCompare(b.course_code) || a.student_name.localeCompare(b.student_name),
  );
  return slicePage(rows, page, pageSize);
}

export async function querySessionRosterPage(params: {
  sessionId: string;
  page: number;
  pageSize: number;
  search?: string;
  statuses?: string[];
}): Promise<PaginatedResult<SessionRosterRow>> {
  const { sessionId, page, pageSize, search = "", statuses = [] } = params;
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  if (isSupabaseConfigured) {
    let query = supabase
      .from("v_session_roster" as "attendance_entries")
      .select("*", { count: "exact" })
      .eq("session_id", sessionId);

    if (statuses.length > 0) {
      if (statuses.includes("unmarked")) {
        const nonNull = statuses.filter((s) => s !== "unmarked");
        if (nonNull.length > 0) {
          query = query.or(`entry_status.is.null,entry_status.in.(${nonNull.join(",")})`);
        } else {
          query = query.is("entry_status", null);
        }
      } else {
        query = query.in("entry_status", statuses);
      }
    }
    if (search.trim()) {
      const q = `%${search.trim()}%`;
      query = query.or(`student_name.ilike.${q},student_number.ilike.${q},student_email.ilike.${q}`);
    }

    const { data, count, error } = await query
      .order("student_name", { ascending: true })
      .range(from, to);

    if (error) throw new Error(error.message);
    return {
      items: (data ?? []) as unknown as SessionRosterRow[],
      total: count ?? 0,
    };
  }

  const db = getDemoState();
  const sess = db.attendance_sessions.find((s) => s.id === sessionId);
  if (!sess) return { items: [], total: 0 };

  const cutoff = new Date(sess.opened_at ?? sess.scheduled_at).getTime();
  let rows: SessionRosterRow[] = db.course_enrollments
    .filter(
      (ce) =>
        ce.course_id === sess.course_id &&
        ce.is_active &&
        new Date(ce.enrolled_at).getTime() <= cutoff,
    )
    .map((ce) => {
      const s = db.students.find((item) => item.user_id === ce.student_id);
      const p = db.profiles.find((item) => item.id === ce.student_id);
      const ae = db.attendance_entries.find(
        (item) => item.session_id === sess.id && item.student_id === ce.student_id,
      );

      return {
        session_id: sess.id,
        course_id: sess.course_id,
        session_status: sess.status,
        student_id: ce.student_id,
        enrolled_at: ce.enrolled_at,
        student_number: s?.student_number ?? "—",
        academic_level: s?.academic_level ?? "100",
        student_name: p?.full_name ?? "—",
        student_email: p?.email ?? "—",
        entry_id: ae?.id ?? null,
        entry_status: ae?.status ?? null,
        entry_source: ae?.source ?? null,
        checked_in_at: ae?.checked_in_at ?? null,
        marked_by: ae?.marked_by ?? null,
        override_reason: ae?.override_reason ?? null,
      };
    });

  if (statuses.length > 0) {
    rows = rows.filter((r) => {
      const effective = r.entry_status ?? "unmarked";
      return statuses.includes(effective);
    });
  }
  if (search.trim()) {
    const q = search.trim().toLowerCase();
    rows = rows.filter(
      (r) =>
        r.student_name.toLowerCase().includes(q) ||
        r.student_number.toLowerCase().includes(q) ||
        r.student_email.toLowerCase().includes(q),
    );
  }

  rows.sort((a, b) => a.student_name.localeCompare(b.student_name));
  return slicePage(rows, page, pageSize);
}

export async function querySessionActiveCredential(
  sessionId: string,
): Promise<AttendanceCredential | null> {
  if (isSupabaseConfigured) {
    if (typeof window !== "undefined" && window.sessionStorage) {
      try {
        const cached = window.sessionStorage.getItem(`attendance:cred:${sessionId}`);
        if (cached) {
          const parsed = JSON.parse(cached) as AttendanceCredential;
          if (parsed && parsed.expires_at && new Date(parsed.expires_at).getTime() > Date.now()) {
            return parsed;
          }
        }
      } catch {
        // ignore storage errors
      }
    }
    return null;
  }

  const db = getDemoState();
  const sess = db.attendance_sessions.find((s) => s.id === sessionId);
  const qrRow = db.attendance_credentials.find(
    (c) => c.session_id === sessionId && c.method === "qr" && !c.revoked_at,
  );
  const codeRow = db.attendance_credentials.find(
    (c) => c.session_id === sessionId && c.method === "code" && !c.revoked_at,
  );
  if (!qrRow && !codeRow) return null;
  const activeRow = qrRow ?? codeRow!;
  return {
    session_id: sessionId,
    qr_token: qrRow?.credential_value ?? "",
    short_code: codeRow?.credential_value ?? "",
    checkin_code: codeRow?.credential_value ?? null,
    issued_at: activeRow.created_at,
    expires_at: activeRow.expires_at,
    closes_at: sess?.closes_at ?? activeRow.expires_at,
    is_active: true,
  };
}

export async function queryStudentById(
  studentId: string,
): Promise<StudentSummaryRow | null> {
  if (isSupabaseConfigured) {
    const { data, error } = await supabase
      .from("v_students_summary")
      .select("*")
      .eq("user_id", studentId)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!data) return null;
    const row = data as StudentSummaryRow;
    return {
      ...row,
      active_course_count: row.enrolled_courses_count ?? 0,
      eligible_sessions: row.eligible_sessions_count ?? 0,
      attendance_percentage: row.attendance_percentage ?? 100,
    };
  }
  const res = await queryStudentsPage({ page: 1, pageSize: 500 });
  return res.items.find((r) => r.user_id === studentId) ?? null;
}

export async function queryLecturerById(
  lecturerId: string,
): Promise<LecturerSummaryRow | null> {
  if (isSupabaseConfigured) {
    const { data, error } = await supabase
      .from("v_lecturers_summary")
      .select("*")
      .eq("user_id", lecturerId)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!data) return null;
    const row = data as LecturerSummaryRow;
    return {
      ...row,
      course_count: row.assigned_courses_count ?? 0,
    };
  }
  const res = await queryLecturersPage({ page: 1, pageSize: 500 });
  return res.items.find((r) => r.user_id === lecturerId) ?? null;
}

export async function queryCourseById(
  courseId: string,
): Promise<CourseSummaryRow | null> {
  if (isSupabaseConfigured) {
    const { data, error } = await supabase
      .from("v_courses_summary")
      .select("*")
      .eq("id", courseId)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!data) return null;
    const row = data as CourseSummaryRow;
    return {
      ...row,
      level: row.level ?? "300",
      enrolled_count: row.enrolled_students_count ?? 0,
      closed_session_count: row.closed_sessions_count ?? 0,
      open_session_count: row.open_sessions_count ?? 0,
    };
  }
  const res = await queryCoursesPage({ page: 1, pageSize: 500 });
  return res.items.find((r) => r.id === courseId) ?? null;
}

export async function querySessionById(
  sessionId: string,
): Promise<SessionSummaryRow | null> {
  if (isSupabaseConfigured) {
    const { data, error } = await supabase
      .from("v_sessions_summary")
      .select("*")
      .eq("id", sessionId)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return (data as SessionSummaryRow | null) ?? null;
  }
  const res = await querySessionsPage({ page: 1, pageSize: 500 });
  return res.items.find((r) => r.id === sessionId) ?? null;
}

export async function queryDepartmentsList(): Promise<Department[]> {
  const res = await queryDepartmentsPage({ page: 1, pageSize: 200 });
  return res.items;
}

export async function queryPeriodsList(): Promise<AcademicPeriod[]> {
  const res = await queryPeriodsPage({ page: 1, pageSize: 200 });
  return res.items;
}
