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
import { calculateAttendanceStats, isStudentEligibleForSession } from "@attendance/utils";
import { isSupabaseConfigured, supabase } from "./client";
import { getDemoState, subscribeDemoState, updateDemoState } from "./demo-store";

export interface InstitutionSnapshot {
  profiles: Profile[];
  userRoles: UserRoleRow[];
  departments: Department[];
  academicPeriods: AcademicPeriod[];
  students: StudentRecord[];
  lecturers: LecturerRecord[];
  courses: Course[];
  courseLecturers: CourseLecturer[];
  courseEnrollments: CourseEnrollment[];
  timetables: TimetableEntry[];
  sessions: AttendanceSession[];
  entries: AttendanceEntry[];
  corrections: CorrectionRequest[];
  notifications: AppNotification[];
  auditLogs: AuditLog[];
  settings: SystemSettings;
}

function genId(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

function generateShortCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let out = "";
  for (let i = 0; i < 6; i++) {
    out += chars[Math.floor(Math.random() * chars.length)];
  }
  return out;
}

export async function fetchInstitutionSnapshot(callerId?: string): Promise<InstitutionSnapshot> {
  if (!isSupabaseConfigured) {
    const db = getDemoState();
    const callerRole = callerId
      ? db.user_roles.find((r) => r.user_id === callerId)?.role
      : undefined;

    // Enforce RLS visibility in demo mode just like Postgres RLS
    const assignedCourseIds =
      callerRole === "lecturer" && callerId
        ? new Set(
            db.course_lecturers
              .filter((cl) => cl.lecturer_id === callerId)
              .map((cl) => cl.course_id),
          )
        : null;

    const enrolledCourseIds =
      callerRole === "student" && callerId
        ? new Set(
            db.course_enrollments
              .filter((ce) => ce.student_id === callerId && ce.is_active)
              .map((ce) => ce.course_id),
          )
        : null;

    const visibleCourses = db.courses.filter((c) => {
      if (!callerRole || callerRole === "admin") return true;
      if (callerRole === "lecturer") return assignedCourseIds?.has(c.id) ?? false;
      if (callerRole === "student") return enrolledCourseIds?.has(c.id) ?? false;
      return false;
    });

    const visibleCourseIdSet = new Set(visibleCourses.map((c) => c.id));

    const visibleSessions = db.attendance_sessions.filter((s) =>
      !callerRole || callerRole === "admin" ? true : visibleCourseIdSet.has(s.course_id),
    );
    const visibleSessionIdSet = new Set(visibleSessions.map((s) => s.id));

    const visibleEntries = db.attendance_entries.filter((e) => {
      if (!callerRole || callerRole === "admin") return true;
      if (callerRole === "student") return e.student_id === callerId;
      if (callerRole === "lecturer") return visibleSessionIdSet.has(e.session_id);
      return false;
    });

    const visibleCorrections = db.correction_requests.filter((cr) => {
      if (!callerRole || callerRole === "admin") return true;
      if (callerRole === "student") return cr.student_id === callerId;
      if (callerRole === "lecturer") {
        const entry = db.attendance_entries.find((e) => e.id === cr.attendance_entry_id);
        return entry ? visibleSessionIdSet.has(entry.session_id) : false;
      }
      return false;
    });

    const visibleNotifications = db.notifications
      .filter((n) => (!callerId || callerRole === "admin" ? true : n.recipient_id === callerId))
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    return {
      profiles: db.profiles,
      userRoles: db.user_roles,
      departments: db.departments,
      academicPeriods: db.academic_periods,
      students: db.students,
      lecturers: db.lecturers,
      courses: visibleCourses,
      courseLecturers: db.course_lecturers.filter((cl) =>
        !callerRole || callerRole === "admin" ? true : visibleCourseIdSet.has(cl.course_id),
      ),
      courseEnrollments: db.course_enrollments.filter((ce) => {
        if (!callerRole || callerRole === "admin") return true;
        if (callerRole === "student") return ce.student_id === callerId;
        return visibleCourseIdSet.has(ce.course_id);
      }),
      timetables: db.timetables.filter((t) =>
        !callerRole || callerRole === "admin" ? true : visibleCourseIdSet.has(t.course_id),
      ),
      sessions: [...visibleSessions].sort(
        (a, b) => new Date(b.scheduled_at).getTime() - new Date(a.scheduled_at).getTime(),
      ),
      entries: visibleEntries,
      corrections: [...visibleCorrections].sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
      ),
      notifications: visibleNotifications,
      auditLogs: [...db.audit_logs].sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
      ),
      settings: db.system_settings,
    };
  }

  // Live Supabase Postgres queries (RLS automatically filters rows per caller JWT)
  const [
    profilesRes,
    rolesRes,
    deptsRes,
    periodsRes,
    studentsRes,
    lecturersRes,
    coursesRes,
    courseLecsRes,
    enrollmentsRes,
    timetablesRes,
    sessionsRes,
    entriesRes,
    correctionsRes,
    notificationsRes,
    auditsRes,
    settingsRes,
  ] = await Promise.all([
    supabase.from("profiles").select("*").order("full_name"),
    supabase.from("user_roles").select("*"),
    supabase.from("departments").select("*").order("code"),
    supabase.from("academic_periods").select("*").order("start_date", { ascending: false }),
    supabase.from("students").select("*"),
    supabase.from("lecturers").select("*"),
    supabase.from("courses").select("*").order("code"),
    supabase.from("course_lecturers").select("*"),
    supabase.from("course_enrollments").select("*"),
    supabase.from("timetables").select("*").order("weekday").order("start_time"),
    supabase.from("attendance_sessions").select("*").order("scheduled_at", { ascending: false }),
    supabase.from("attendance_entries").select("*"),
    supabase.from("correction_requests").select("*").order("created_at", { ascending: false }),
    supabase.from("notifications").select("*").order("created_at", { ascending: false }),
    supabase.from("audit_logs").select("*").order("created_at", { ascending: false }).limit(200),
    supabase.from("system_settings").select("*").eq("id", 1).maybeSingle(),
  ]);

  return {
    profiles: (profilesRes.data ?? []) as Profile[],
    userRoles: (rolesRes.data ?? []) as UserRoleRow[],
    departments: (deptsRes.data ?? []) as Department[],
    academicPeriods: (periodsRes.data ?? []) as AcademicPeriod[],
    students: (studentsRes.data ?? []) as StudentRecord[],
    lecturers: (lecturersRes.data ?? []) as LecturerRecord[],
    courses: (coursesRes.data ?? []) as Course[],
    courseLecturers: (courseLecsRes.data ?? []) as CourseLecturer[],
    courseEnrollments: (enrollmentsRes.data ?? []) as CourseEnrollment[],
    timetables: (timetablesRes.data ?? []) as TimetableEntry[],
    sessions: (sessionsRes.data ?? []) as AttendanceSession[],
    entries: (entriesRes.data ?? []) as AttendanceEntry[],
    corrections: (correctionsRes.data ?? []) as CorrectionRequest[],
    notifications: (notificationsRes.data ?? []) as AppNotification[],
    auditLogs: (auditsRes.data ?? []) as AuditLog[],
    settings: (settingsRes.data as SystemSettings | null) ?? {
      id: 1,
      low_attendance_threshold: 75,
      late_grace_minutes: 10,
      checkin_window_minutes: 30,
      qr_enabled: true,
      code_enabled: true,
      manual_enabled: true,
      timezone: "Africa/Accra",
      updated_at: new Date().toISOString(),
    },
  };
}

const realtimeListeners = new Set<() => void>();
let activeRealtimeChannel: ReturnType<typeof supabase.channel> | null = null;

function notifyRealtimeListeners() {
  for (const listener of realtimeListeners) {
    try {
      listener();
    } catch {
      // ignore listener errors
    }
  }
}

export function subscribeToAttendanceChanges(onUpdate: () => void): () => void {
  if (!isSupabaseConfigured) {
    return subscribeDemoState(onUpdate);
  }

  realtimeListeners.add(onUpdate);

  if (!activeRealtimeChannel) {
    activeRealtimeChannel = supabase
      .channel(`attendance-live-updates-${genId()}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "attendance_entries" }, () =>
        notifyRealtimeListeners(),
      )
      .on("postgres_changes", { event: "*", schema: "public", table: "attendance_sessions" }, () =>
        notifyRealtimeListeners(),
      )
      .on("postgres_changes", { event: "*", schema: "public", table: "notifications" }, () =>
        notifyRealtimeListeners(),
      )
      .on("postgres_changes", { event: "*", schema: "public", table: "correction_requests" }, () =>
        notifyRealtimeListeners(),
      )
      .subscribe();
  }

  return () => {
    realtimeListeners.delete(onUpdate);
    if (realtimeListeners.size === 0 && activeRealtimeChannel) {
      const ch = activeRealtimeChannel;
      activeRealtimeChannel = null;
      void supabase.removeChannel(ch);
    }
  };
}

// ==============================================================================
// Admin Academic Setup & Provisioning Mutations
// ==============================================================================

export async function saveDepartment(
  payload: { id?: string; code: string; name: string; is_active: boolean },
) {
  const code = payload.code.trim().toUpperCase();
  const name = payload.name.trim();
  if (!isSupabaseConfigured) {
    updateDemoState((db) => {
      const duplicate = db.departments.find(
        (d) => d.code.toUpperCase() === code && d.id !== payload.id,
      );
      if (duplicate) throw new Error(`Department code ${code} already exists`);
      if (payload.id) {
        const idx = db.departments.findIndex((d) => d.id === payload.id);
        if (idx >= 0) {
          db.departments[idx] = { ...db.departments[idx], code, name, is_active: payload.is_active };
        }
      } else {
        db.departments.push({
          id: genId(),
          code,
          name,
          is_active: payload.is_active,
          created_at: new Date().toISOString(),
        });
      }
    });
    return;
  }

  if (payload.id) {
    const { error } = await supabase
      .from("departments")
      .update({ code, name, is_active: payload.is_active })
      .eq("id", payload.id);
    if (error) throw new Error(error.message);
  } else {
    const { error } = await supabase
      .from("departments")
      .insert({ code, name, is_active: payload.is_active });
    if (error) throw new Error(error.message);
  }
}

export async function saveAcademicPeriod(payload: {
  id?: string;
  name: string;
  start_date: string;
  end_date: string;
  is_active: boolean;
}) {
  if (!isSupabaseConfigured) {
    updateDemoState((db) => {
      if (payload.id) {
        const idx = db.academic_periods.findIndex((p) => p.id === payload.id);
        if (idx >= 0) {
          db.academic_periods[idx] = { ...db.academic_periods[idx], ...payload };
        }
      } else {
        db.academic_periods.push({
          id: genId(),
          name: payload.name.trim(),
          start_date: payload.start_date,
          end_date: payload.end_date,
          is_active: payload.is_active,
          created_at: new Date().toISOString(),
        });
      }
    });
    return;
  }

  if (payload.id) {
    const { error } = await supabase
      .from("academic_periods")
      .update({
        name: payload.name.trim(),
        start_date: payload.start_date,
        end_date: payload.end_date,
        is_active: payload.is_active,
      })
      .eq("id", payload.id);
    if (error) throw new Error(error.message);
  } else {
    const { error } = await supabase.from("academic_periods").insert({
      name: payload.name.trim(),
      start_date: payload.start_date,
      end_date: payload.end_date,
      is_active: payload.is_active,
    });
    if (error) throw new Error(error.message);
  }
}

export async function saveCourse(payload: {
  id?: string;
  code: string;
  title: string;
  department_id: string;
  academic_period_id: string;
  is_active: boolean;
  lecturer_ids?: string[];
}) {
  const code = payload.code.trim().toUpperCase();
  const title = payload.title.trim();

  if (!isSupabaseConfigured) {
    updateDemoState((db) => {
      const dup = db.courses.find(
        (c) =>
          c.code.toUpperCase() === code &&
          c.academic_period_id === payload.academic_period_id &&
          c.id !== payload.id,
      );
      if (dup) throw new Error(`Course ${code} already exists in this academic period`);

      let courseId = payload.id;
      if (courseId) {
        const idx = db.courses.findIndex((c) => c.id === courseId);
        if (idx >= 0) {
          db.courses[idx] = {
            ...db.courses[idx],
            code,
            title,
            department_id: payload.department_id,
            academic_period_id: payload.academic_period_id,
            is_active: payload.is_active,
          };
        }
      } else {
        courseId = genId();
        db.courses.push({
          id: courseId,
          code,
          title,
          department_id: payload.department_id,
          academic_period_id: payload.academic_period_id,
          is_active: payload.is_active,
          created_at: new Date().toISOString(),
        });
      }

      if (payload.lecturer_ids && courseId) {
        db.course_lecturers = db.course_lecturers.filter((cl) => cl.course_id !== courseId);
        for (const lecId of payload.lecturer_ids) {
          db.course_lecturers.push({
            course_id: courseId,
            lecturer_id: lecId,
            assigned_at: new Date().toISOString(),
          });
        }
      }
    });
    return;
  }

  let courseId = payload.id;
  if (courseId) {
    const { error } = await supabase
      .from("courses")
      .update({
        code,
        title,
        department_id: payload.department_id,
        academic_period_id: payload.academic_period_id,
        is_active: payload.is_active,
      })
      .eq("id", courseId);
    if (error) throw new Error(error.message);
  } else {
    const { data, error } = await supabase
      .from("courses")
      .insert({
        code,
        title,
        department_id: payload.department_id,
        academic_period_id: payload.academic_period_id,
        is_active: payload.is_active,
      })
      .select("id")
      .single();
    if (error) throw new Error(error.message);
    courseId = data.id;
  }

  if (payload.lecturer_ids && courseId) {
    await supabase.from("course_lecturers").delete().eq("course_id", courseId);
    if (payload.lecturer_ids.length > 0) {
      const { error } = await supabase.from("course_lecturers").insert(
        payload.lecturer_ids.map((lecturer_id) => ({
          course_id: courseId!,
          lecturer_id,
        })),
      );
      if (error) throw new Error(error.message);
    }
  }
}

export async function updateCourseEnrollments(
  courseId: string,
  activeStudentIds: string[],
) {
  const activeSet = new Set(activeStudentIds);
  const now = new Date().toISOString();

  if (!isSupabaseConfigured) {
    updateDemoState((db) => {
      // Preserve historical attendance: mark removed students as is_active = false & set unenrolled_at
      for (const ce of db.course_enrollments) {
        if (ce.course_id === courseId) {
          if (activeSet.has(ce.student_id)) {
            ce.is_active = true;
            ce.unenrolled_at = null;
          } else if (ce.is_active) {
            ce.is_active = false;
            ce.unenrolled_at = now;
          }
        }
      }
      for (const studentId of activeStudentIds) {
        const exists = db.course_enrollments.find(
          (ce) => ce.course_id === courseId && ce.student_id === studentId,
        );
        if (!exists) {
          db.course_enrollments.push({
            course_id: courseId,
            student_id: studentId,
            enrolled_at: now,
            unenrolled_at: null,
            is_active: true,
          });
        }
      }
    });
    return;
  }

  const { data: existing } = await supabase
    .from("course_enrollments")
    .select("*")
    .eq("course_id", courseId);

  const existingList = (existing ?? []) as CourseEnrollment[];
  for (const row of existingList) {
    if (!activeSet.has(row.student_id) && row.is_active) {
      await supabase
        .from("course_enrollments")
        .update({ is_active: false, unenrolled_at: now })
        .eq("course_id", courseId)
        .eq("student_id", row.student_id);
    } else if (activeSet.has(row.student_id) && !row.is_active) {
      await supabase
        .from("course_enrollments")
        .update({ is_active: true, unenrolled_at: null })
        .eq("course_id", courseId)
        .eq("student_id", row.student_id);
    }
  }

  const existingIds = new Set(existingList.map((r) => r.student_id));
  const toInsert = activeStudentIds
    .filter((id) => !existingIds.has(id))
    .map((student_id) => ({
      course_id: courseId,
      student_id,
      enrolled_at: now,
      is_active: true,
    }));

  if (toInsert.length > 0) {
    const { error } = await supabase.from("course_enrollments").insert(toInsert);
    if (error) throw new Error(error.message);
  }
}

export async function adminCreateUserAccount(payload: {
  actorId: string;
  role: "student" | "lecturer";
  fullName: string;
  email: string;
  phone?: string;
  departmentId: string;
  studentNumber?: string;
  academicLevel?: string;
  staffNumber?: string;
  password?: string;
  invite?: boolean;
}) {
  const email = payload.email.trim().toLowerCase();
  const fullName = payload.fullName.trim();

  if (!isSupabaseConfigured) {
    updateDemoState((db) => {
      if (db.profiles.some((p) => p.email.toLowerCase() === email)) {
        throw new Error(`An account with email ${email} already exists`);
      }
      if (
        payload.role === "student" &&
        db.students.some(
          (s) => s.student_number.toUpperCase() === payload.studentNumber?.trim().toUpperCase(),
        )
      ) {
        throw new Error(`Student ID ${payload.studentNumber} is already in use`);
      }
      if (
        payload.role === "lecturer" &&
        db.lecturers.some(
          (l) => l.staff_number.toUpperCase() === payload.staffNumber?.trim().toUpperCase(),
        )
      ) {
        throw new Error(`Staff ID ${payload.staffNumber} is already in use`);
      }

      const newId = genId();
      const now = new Date().toISOString();

      db.profiles.push({
        id: newId,
        full_name: fullName,
        email,
        phone: payload.phone?.trim() || null,
        is_active: true,
        created_at: now,
      });

      db.user_roles.push({
        user_id: newId,
        role: payload.role,
        created_at: now,
      });

      if (payload.role === "student") {
        db.students.push({
          user_id: newId,
          student_number: payload.studentNumber!.trim().toUpperCase(),
          department_id: payload.departmentId,
          academic_level: payload.academicLevel?.trim() || "100",
          created_at: now,
        });
      } else {
        db.lecturers.push({
          user_id: newId,
          staff_number: payload.staffNumber!.trim().toUpperCase(),
          department_id: payload.departmentId,
          created_at: now,
        });
      }

      db.audit_logs.unshift({
        id: genId(),
        actor_id: payload.actorId,
        action: "admin_create_user",
        entity_type: "profile",
        entity_id: newId,
        old_data: null,
        new_data: {
          email,
          full_name: fullName,
          role: payload.role,
          student_number: payload.studentNumber ?? null,
          staff_number: payload.staffNumber ?? null,
        },
        reason: payload.invite ? "Invited via Admin Portal" : "Created via Admin Portal",
        created_at: now,
      });
    });
    return;
  }

  // Call the privileged Supabase Edge Function `admin-create-user`
  const { data, error } = await supabase.functions.invoke("admin-create-user", {
    body: {
      email,
      fullName,
      phone: payload.phone,
      role: payload.role,
      departmentId: payload.departmentId,
      studentNumber: payload.studentNumber,
      academicLevel: payload.academicLevel,
      staffNumber: payload.staffNumber,
      password: payload.password,
      invite: payload.invite,
    },
  });

  if (error) {
    throw new Error(error.message || "Failed to provision user via Edge Function");
  }
  if (data?.error) {
    throw new Error(data.error);
  }
}

export async function adminUpdateUserProfile(payload: {
  actorId: string;
  userId: string;
  fullName: string;
  phone?: string | null;
  departmentId?: string;
  studentNumber?: string;
  academicLevel?: string;
  staffNumber?: string;
}) {
  if (!isSupabaseConfigured) {
    updateDemoState((db) => {
      const pIdx = db.profiles.findIndex((p) => p.id === payload.userId);
      if (pIdx >= 0) {
        db.profiles[pIdx] = {
          ...db.profiles[pIdx],
          full_name: payload.fullName.trim(),
          phone: payload.phone?.trim() || null,
        };
      }
      if (payload.studentNumber && payload.departmentId) {
        const sIdx = db.students.findIndex((s) => s.user_id === payload.userId);
        if (sIdx >= 0) {
          db.students[sIdx] = {
            ...db.students[sIdx],
            student_number: payload.studentNumber.trim().toUpperCase(),
            department_id: payload.departmentId,
            academic_level: payload.academicLevel || db.students[sIdx].academic_level,
          };
        }
      }
      if (payload.staffNumber && payload.departmentId) {
        const lIdx = db.lecturers.findIndex((l) => l.user_id === payload.userId);
        if (lIdx >= 0) {
          db.lecturers[lIdx] = {
            ...db.lecturers[lIdx],
            staff_number: payload.staffNumber.trim().toUpperCase(),
            department_id: payload.departmentId,
          };
        }
      }
    });
    return;
  }

  const { error: pErr } = await supabase
    .from("profiles")
    .update({
      full_name: payload.fullName.trim(),
      phone: payload.phone?.trim() || null,
    })
    .eq("id", payload.userId);
  if (pErr) throw new Error(pErr.message);

  if (payload.studentNumber && payload.departmentId) {
    const { error: sErr } = await supabase
      .from("students")
      .update({
        student_number: payload.studentNumber.trim().toUpperCase(),
        department_id: payload.departmentId,
        academic_level: payload.academicLevel,
      })
      .eq("user_id", payload.userId);
    if (sErr) throw new Error(sErr.message);
  }

  if (payload.staffNumber && payload.departmentId) {
    const { error: lErr } = await supabase
      .from("lecturers")
      .update({
        staff_number: payload.staffNumber.trim().toUpperCase(),
        department_id: payload.departmentId,
      })
      .eq("user_id", payload.userId);
    if (lErr) throw new Error(lErr.message);
  }
}

export async function adminSetUserAccess(payload: {
  actorId: string;
  targetUserId: string;
  isActive?: boolean;
  newRole?: AppRole;
  reason?: string;
}) {
  if (!isSupabaseConfigured) {
    updateDemoState((db) => {
      const pIdx = db.profiles.findIndex((p) => p.id === payload.targetUserId);
      if (pIdx < 0) throw new Error("User profile not found");
      const oldActive = db.profiles[pIdx].is_active;
      const rIdx = db.user_roles.findIndex((r) => r.user_id === payload.targetUserId);
      const oldRole = rIdx >= 0 ? db.user_roles[rIdx].role : "student";

      if (typeof payload.isActive === "boolean") {
        db.profiles[pIdx].is_active = payload.isActive;
      }
      if (payload.newRole && rIdx >= 0) {
        db.user_roles[rIdx].role = payload.newRole;
      }

      db.audit_logs.unshift({
        id: genId(),
        actor_id: payload.actorId,
        action: "admin_update_user_access",
        entity_type: "profile",
        entity_id: payload.targetUserId,
        old_data: { is_active: oldActive, role: oldRole },
        new_data: {
          is_active: payload.isActive ?? oldActive,
          role: payload.newRole ?? oldRole,
        },
        reason: payload.reason || "Administrative access update",
        created_at: new Date().toISOString(),
      });
    });
    return;
  }

  const { error } = await supabase.rpc("admin_update_user_access", {
    p_target_user_id: payload.targetUserId,
    p_is_active: typeof payload.isActive === "boolean" ? payload.isActive : null,
    p_new_role: payload.newRole ?? null,
    p_reason: payload.reason ?? "Administrative access update",
  });
  if (error) throw new Error(error.message);
}

export async function saveTimetableEntry(payload: {
  id?: string;
  course_id: string;
  weekday: number;
  start_time: string;
  end_time: string;
  venue: string;
  effective_from: string;
  effective_to?: string | null;
}) {
  if (!isSupabaseConfigured) {
    updateDemoState((db) => {
      if (payload.id) {
        const idx = db.timetables.findIndex((t) => t.id === payload.id);
        if (idx >= 0) {
          db.timetables[idx] = {
            ...db.timetables[idx],
            course_id: payload.course_id,
            weekday: payload.weekday,
            start_time: payload.start_time,
            end_time: payload.end_time,
            venue: payload.venue.trim(),
            effective_from: payload.effective_from,
            effective_to: payload.effective_to || null,
          };
        }
      } else {
        db.timetables.push({
          id: genId(),
          course_id: payload.course_id,
          weekday: payload.weekday,
          start_time: payload.start_time,
          end_time: payload.end_time,
          venue: payload.venue.trim(),
          effective_from: payload.effective_from,
          effective_to: payload.effective_to || null,
          created_at: new Date().toISOString(),
        });
      }
    });
    return;
  }

  if (payload.id) {
    const { error } = await supabase
      .from("timetables")
      .update({
        course_id: payload.course_id,
        weekday: payload.weekday,
        start_time: payload.start_time,
        end_time: payload.end_time,
        venue: payload.venue.trim(),
        effective_from: payload.effective_from,
        effective_to: payload.effective_to || null,
      })
      .eq("id", payload.id);
    if (error) throw new Error(error.message);
  } else {
    const { error } = await supabase.from("timetables").insert({
      course_id: payload.course_id,
      weekday: payload.weekday,
      start_time: payload.start_time,
      end_time: payload.end_time,
      venue: payload.venue.trim(),
      effective_from: payload.effective_from,
      effective_to: payload.effective_to || null,
    });
    if (error) throw new Error(error.message);
  }
}

export async function deleteTimetableEntry(id: string) {
  if (!isSupabaseConfigured) {
    updateDemoState((db) => {
      db.timetables = db.timetables.filter((t) => t.id !== id);
    });
    return;
  }
  const { error } = await supabase.from("timetables").delete().eq("id", id);
  if (error) throw new Error(error.message);
}

export async function updateSystemSettings(
  actorId: string,
  settings: Omit<SystemSettings, "id" | "updated_at">,
) {
  const now = new Date().toISOString();
  if (!isSupabaseConfigured) {
    updateDemoState((db) => {
      const old = { ...db.system_settings };
      db.system_settings = {
        id: 1,
        ...settings,
        updated_at: now,
      };
      db.audit_logs.unshift({
        id: genId(),
        actor_id: actorId,
        action: "update_system_settings",
        entity_type: "system_settings",
        entity_id: "1",
        old_data: old as unknown as Record<string, unknown>,
        new_data: db.system_settings as unknown as Record<string, unknown>,
        reason: "Updated institution attendance policy",
        created_at: now,
      });
    });
    return;
  }

  const { error } = await supabase
    .from("system_settings")
    .update({ ...settings, updated_at: now })
    .eq("id", 1);
  if (error) throw new Error(error.message);
}

// ==============================================================================
// Core Attendance Workflows (Sessions, Credentials, Check-in, Manual, Finalize)
// ==============================================================================

export async function createAttendanceSession(payload: {
  callerId?: string;
  lecturerId?: string;
  courseId: string;
  timetableId?: string | null;
  title: string;
  notes?: string | null;
  scheduledAt?: string;
  openImmediately?: boolean;
  windowMinutes?: number;
}): Promise<AttendanceSession & { session: AttendanceSession; credential: IssuedCredentialResult | null }> {
  const callerId = payload.callerId ?? payload.lecturerId ?? "";
  const now = new Date();
  const scheduledAt = payload.scheduledAt || now.toISOString();

  if (!isSupabaseConfigured) {
    let createdSession!: AttendanceSession;
    updateDemoState((db) => {
      const role = db.user_roles.find((r) => r.user_id === callerId)?.role;
      const isAssigned = db.course_lecturers.some(
        (cl) => cl.course_id === payload.courseId && cl.lecturer_id === callerId,
      );
      if (role !== "admin" && !(role === "lecturer" && isAssigned)) {
        throw new Error("Forbidden: you are not assigned to this course");
      }

      const windowMins = payload.windowMinutes || db.system_settings.checkin_window_minutes || 30;
      const closesAt = new Date(now.getTime() + windowMins * 60 * 1000).toISOString();

      createdSession = {
        id: genId(),
        course_id: payload.courseId,
        created_by: callerId,
        title: payload.title.trim() || "Class Session",
        scheduled_at: scheduledAt,
        opened_at: payload.openImmediately ? now.toISOString() : null,
        closes_at: payload.openImmediately ? closesAt : null,
        closed_at: null,
        status: payload.openImmediately ? "open" : "scheduled",
        created_at: now.toISOString(),
      };
      db.attendance_sessions.unshift(createdSession);
    });

    let credential: IssuedCredentialResult | null = null;
    if (payload.openImmediately) {
      credential = await issueSessionCredential(callerId, createdSession.id);
    }
    return Object.assign(createdSession, { session: createdSession, credential });
  }

  const { data: settings } = await supabase
    .from("system_settings")
    .select("checkin_window_minutes")
    .eq("id", 1)
    .maybeSingle();

  const windowMins = payload.windowMinutes ?? settings?.checkin_window_minutes ?? 30;
  const closesAt = new Date(now.getTime() + windowMins * 60 * 1000).toISOString();

  const { data, error } = await supabase
    .from("attendance_sessions")
    .insert({
      course_id: payload.courseId,
      created_by: callerId,
      title: payload.title.trim() || "Class Session",
      scheduled_at: scheduledAt,
      opened_at: payload.openImmediately ? now.toISOString() : null,
      closes_at: payload.openImmediately ? closesAt : null,
      closed_at: null,
      status: payload.openImmediately ? "open" : "scheduled",
    })
    .select("*")
    .single();

  if (error) throw new Error(error.message);
  const createdSession = data as AttendanceSession;
  let credential: IssuedCredentialResult | null = null;
  if (payload.openImmediately) {
    credential = await issueSessionCredential(callerId, createdSession.id);
  }
  return Object.assign(createdSession, { session: createdSession, credential });
}

export async function issueSessionCredential(
  callerIdOrParams:
    | string
    | { lecturerId?: string; callerId?: string; sessionId: string; windowMinutes?: number },
  maybeSessionId?: string,
): Promise<IssuedCredentialResult> {
  const callerId =
    typeof callerIdOrParams === "string"
      ? callerIdOrParams
      : callerIdOrParams.callerId ?? callerIdOrParams.lecturerId ?? "";
  const sessionId =
    typeof callerIdOrParams === "string"
      ? maybeSessionId ?? ""
      : callerIdOrParams.sessionId;

  if (!isSupabaseConfigured) {
    let result!: IssuedCredentialResult;
    updateDemoState((db) => {
      const role = db.user_roles.find((r) => r.user_id === callerId)?.role;
      const session = db.attendance_sessions.find((s) => s.id === sessionId);
      if (!session) throw new Error("Attendance session not found");

      const isAssigned = db.course_lecturers.some(
        (cl) => cl.course_id === session.course_id && cl.lecturer_id === callerId,
      );
      if (role !== "admin" && !(role === "lecturer" && isAssigned)) {
        throw new Error("Forbidden: you are not assigned to this course");
      }
      if (session.status === "closed") {
        throw new Error("Cannot issue credentials for a closed session");
      }

      const now = new Date();
      const windowMins = db.system_settings.checkin_window_minutes || 30;
      if (session.status === "scheduled") {
        session.status = "open";
        session.opened_at = now.toISOString();
        session.closes_at = new Date(now.getTime() + windowMins * 60 * 1000).toISOString();
      } else if (!session.closes_at || new Date(session.closes_at).getTime() <= now.getTime()) {
        session.closes_at = new Date(now.getTime() + windowMins * 60 * 1000).toISOString();
      }

      const expiresAt = new Date(
        Math.min(
          new Date(session.closes_at).getTime(),
          now.getTime() + 15 * 60 * 1000,
        ),
      ).toISOString();

      for (const cred of db.attendance_credentials) {
        if (cred.session_id === sessionId && !cred.revoked_at) {
          cred.revoked_at = now.toISOString();
        }
      }

      const qrToken = `qr_${genId().replace(/-/g, "")}`;
      const shortCode = generateShortCode();

      if (db.system_settings.qr_enabled) {
        db.attendance_credentials.push({
          id: genId(),
          session_id: sessionId,
          method: "qr",
          credential_value: qrToken,
          expires_at: expiresAt,
          revoked_at: null,
          created_at: now.toISOString(),
        });
      }

      if (db.system_settings.code_enabled) {
        db.attendance_credentials.push({
          id: genId(),
          session_id: sessionId,
          method: "code",
          credential_value: shortCode.toUpperCase(),
          expires_at: expiresAt,
          revoked_at: null,
          created_at: now.toISOString(),
        });
      }

      result = {
        session_id: sessionId,
        qr_token: db.system_settings.qr_enabled ? qrToken : "",
        short_code: db.system_settings.code_enabled ? shortCode : "",
        checkin_code: db.system_settings.code_enabled ? shortCode : null,
        issued_at: now.toISOString(),
        expires_at: expiresAt,
        closes_at: session.closes_at,
        is_active: true,
      };
    });
    return result;
  }

  const { data, error } = await supabase.rpc("issue_attendance_credential", {
    p_session_id: sessionId,
  });
  if (error) throw new Error(error.message);
  const raw = data as Partial<IssuedCredentialResult>;
  const issued: IssuedCredentialResult = {
    session_id: sessionId,
    qr_token: raw.qr_token ?? "",
    short_code: raw.short_code ?? raw.checkin_code ?? "",
    checkin_code: raw.checkin_code ?? raw.short_code ?? null,
    issued_at: raw.issued_at ?? new Date().toISOString(),
    expires_at: raw.expires_at ?? new Date().toISOString(),
    closes_at: raw.closes_at ?? new Date().toISOString(),
    is_active: true,
  };
  if (typeof window !== "undefined" && window.sessionStorage) {
    try {
      window.sessionStorage.setItem(`attendance:cred:${sessionId}`, JSON.stringify(issued));
    } catch {
      // ignore storage quota errors
    }
  }
  return issued;
}

export async function submitStudentCheckin(params: {
  callerId?: string;
  studentId?: string;
  credential?: string;
  qrToken?: string;
  shortCode?: string;
  method?: CredentialMethod;
  source?: CredentialMethod;
  sessionId?: string | null;
}): Promise<CheckinResponse> {
  const callerId = params.callerId ?? params.studentId ?? "";
  const method: CredentialMethod =
    params.method ?? params.source ?? (params.qrToken ? "qr" : "code");
  const credential = (params.credential ?? params.qrToken ?? params.shortCode ?? "").trim();

  if (!isSupabaseConfigured) {
    let response!: CheckinResponse;
    updateDemoState((db) => {
      const profile = db.profiles.find((p) => p.id === callerId);
      const role = db.user_roles.find((r) => r.user_id === callerId)?.role;
      if (!profile || !profile.is_active) {
        response = {
          ok: false,
          code: "ACCOUNT_DISABLED",
          message: "Your account has been deactivated. Protected check-ins are disabled.",
        };
        return;
      }
      if (role !== "student") {
        response = {
          ok: false,
          code: "FORBIDDEN",
          message: "Only active student accounts can check in.",
        };
        return;
      }

      if (method === "qr" && !db.system_settings.qr_enabled) {
        response = {
          ok: false,
          code: "METHOD_DISABLED",
          message: "QR check-in is disabled by institution policy.",
        };
        return;
      }
      if (method === "code" && !db.system_settings.code_enabled) {
        response = {
          ok: false,
          code: "METHOD_DISABLED",
          message: "Code check-in is disabled by institution policy.",
        };
        return;
      }

      if (!credential) {
        response = {
          ok: false,
          code: "INVALID_CREDENTIAL",
          message: "Please provide a valid check-in code or QR token.",
        };
        return;
      }

      const normalizedCred = method === "code" ? credential.toUpperCase() : credential;
      const now = new Date();

      let targetSession: AttendanceSession | undefined;
      if (params.sessionId) {
        targetSession = db.attendance_sessions.find((s) => s.id === params.sessionId);
      } else {
        const matchedCred = [...db.attendance_credentials]
          .reverse()
          .find((c) => c.method === method && c.credential_value === normalizedCred);
        if (matchedCred) {
          targetSession = db.attendance_sessions.find((s) => s.id === matchedCred.session_id);
        }
      }

      if (!targetSession) {
        response = {
          ok: false,
          code: "INVALID_CREDENTIAL",
          message: "Invalid or unrecognized session check-in code.",
        };
        return;
      }

      const course = db.courses.find((c) => c.id === targetSession!.course_id);
      if (!course) {
        response = {
          ok: false,
          code: "COURSE_NOT_FOUND",
          message: "Course not found.",
        };
        return;
      }

      const enrollment = db.course_enrollments.find(
        (ce) =>
          ce.course_id === targetSession!.course_id &&
          ce.student_id === callerId &&
          ce.is_active,
      );
      if (!enrollment) {
        response = {
          ok: false,
          code: "NOT_ENROLLED",
          message: `You are not enrolled in ${course.code} (${course.title}).`,
        };
        return;
      }

      const existing = db.attendance_entries.find(
        (e) => e.session_id === targetSession!.id && e.student_id === callerId,
      );
      if (existing) {
        response = {
          ok: false,
          code: "ALREADY_CHECKED_IN",
          message: `You have already checked in for ${course.code} (${existing.status.toUpperCase()}).`,
          already_checked_in: true,
          entry_id: existing.id,
          session_id: targetSession.id,
          session_title: targetSession.title,
          course_id: course.id,
          course_code: course.code,
          course_title: course.title,
          status: existing.status,
          source: existing.source,
          checked_in_at: existing.checked_in_at || existing.created_at,
        };
        return;
      }

      if (targetSession.status !== "open") {
        response = {
          ok: false,
          code: "SESSION_CLOSED",
          message: "This attendance session is closed.",
        };
        return;
      }

      const credRow = [...db.attendance_credentials]
        .reverse()
        .find(
          (c) =>
            c.session_id === targetSession!.id &&
            c.method === method &&
            c.credential_value === normalizedCred,
        );

      if (!credRow) {
        response = {
          ok: false,
          code: "INVALID_CREDENTIAL",
          message: "Invalid check-in code or QR token for this session.",
        };
        return;
      }
      if (credRow.revoked_at) {
        response = {
          ok: false,
          code: "CREDENTIAL_SUPERSEDED",
          message:
            "This QR/code has been rotated by the lecturer. Please scan or enter the latest code.",
        };
        return;
      }
      if (now.getTime() > new Date(credRow.expires_at).getTime()) {
        response = {
          ok: false,
          code: "CREDENTIAL_EXPIRED",
          message: "This QR/code has expired. Ask your lecturer to rotate the code.",
        };
        return;
      }

      const graceMs = (db.system_settings.late_grace_minutes ?? 10) * 60 * 1000;
      const openedMs = targetSession.opened_at
        ? new Date(targetSession.opened_at).getTime()
        : now.getTime();
      const status: AttendanceStatus =
        now.getTime() > openedMs + graceMs ? "late" : "present";

      const newEntry: AttendanceEntry = {
        id: genId(),
        session_id: targetSession.id,
        student_id: callerId,
        status,
        source: method,
        checked_in_at: now.toISOString(),
        marked_by: callerId,
        updated_at: now.toISOString(),
        created_at: now.toISOString(),
      };
      db.attendance_entries.push(newEntry);

      response = {
        ok: true,
        code: "CHECKED_IN",
        message: `Checked in as ${status.toUpperCase()} for ${course.code}.`,
        already_checked_in: false,
        entry_id: newEntry.id,
        session_id: targetSession.id,
        session_title: targetSession.title,
        course_id: course.id,
        course_code: course.code,
        course_title: course.title,
        status: newEntry.status,
        source: newEntry.source,
        checked_in_at: newEntry.checked_in_at!,
      };
    });
    return response;
  }

  const { data, error } = await supabase.rpc("submit_checkin", {
    p_credential: credential,
    p_method: method,
    p_session_id: params.sessionId ?? null,
  });
  if (error) {
    return {
      ok: false,
      code: "CHECKIN_FAILED",
      message: error.message,
    };
  }
  const raw = data as Partial<CheckinResponse>;
  return {
    ok: raw.ok ?? true,
    code: raw.code ?? "CHECKED_IN",
    message: raw.message ?? `Checked in as ${(raw.status ?? "present").toUpperCase()}`,
    ...raw,
  };
}

export async function markStudentAttendance(params: {
  callerId?: string;
  actorId?: string;
  sessionId: string;
  studentId: string;
  status: AttendanceStatus;
  reason?: string;
}): Promise<AttendanceEntry> {
  const callerId = params.callerId ?? params.actorId ?? "";
  if (!isSupabaseConfigured) {
    let updatedEntry!: AttendanceEntry;
    updateDemoState((db) => {
      const role = db.user_roles.find((r) => r.user_id === callerId)?.role;
      const session = db.attendance_sessions.find((s) => s.id === params.sessionId);
      if (!session) throw new Error("Session not found");

      if (role === "lecturer") {
        const assigned = db.course_lecturers.some(
          (cl) => cl.course_id === session.course_id && cl.lecturer_id === callerId,
        );
        if (!assigned) throw new Error("Forbidden: you are not assigned to this course");
      } else if (role !== "admin") {
        throw new Error("Unauthorized");
      }

      const existingIdx = db.attendance_entries.findIndex(
        (e) => e.session_id === params.sessionId && e.student_id === params.studentId,
      );
      const now = new Date().toISOString();

      if (existingIdx >= 0) {
        const prev = db.attendance_entries[existingIdx];
        if (prev.status !== params.status) {
          if (!params.reason || params.reason.trim().length < 3) {
            throw new Error(
              "An audit reason (at least 3 characters) is required when overriding an existing attendance status",
            );
          }
          db.audit_logs.unshift({
            id: genId(),
            actor_id: callerId,
            action:
              role === "admin" ? "admin_attendance_override" : "lecturer_attendance_override",
            entity_type: "attendance_entry",
            entity_id: prev.id,
            old_data: { status: prev.status, source: prev.source, student_id: params.studentId },
            new_data: { status: params.status, source: "manual", student_id: params.studentId },
            reason: params.reason.trim(),
            created_at: now,
          });
        }
        db.attendance_entries[existingIdx] = {
          ...prev,
          status: params.status,
          source: "manual",
          checked_in_at:
            params.status === "present" || params.status === "late"
              ? prev.checked_in_at || now
              : null,
          marked_by: callerId,
          override_reason: params.reason?.trim() || prev.override_reason || null,
          updated_at: now,
        };
        updatedEntry = db.attendance_entries[existingIdx];
      } else {
        updatedEntry = {
          id: genId(),
          session_id: params.sessionId,
          student_id: params.studentId,
          status: params.status,
          source: "manual",
          checked_in_at:
            params.status === "present" || params.status === "late" ? now : null,
          marked_by: callerId,
          override_reason: params.reason?.trim() || null,
          updated_at: now,
          created_at: now,
        };
        db.attendance_entries.push(updatedEntry);
      }
    });
    return updatedEntry;
  }

  const { data, error } = await supabase.rpc("mark_attendance", {
    p_session_id: params.sessionId,
    p_student_id: params.studentId,
    p_status: params.status,
    p_reason: params.reason ?? null,
  });
  if (error) throw new Error(error.message);
  return data as AttendanceEntry;
}

export async function bulkMarkAttendance(params: {
  actorId: string;
  sessionId: string;
  studentIds: string[];
  status: AttendanceStatus;
  reason?: string;
}): Promise<void> {
  for (const studentId of params.studentIds) {
    await markStudentAttendance({
      actorId: params.actorId,
      sessionId: params.sessionId,
      studentId,
      status: params.status,
      reason: params.reason,
    });
  }
}

export async function finalizeAttendanceSession(params: {
  callerId: string;
  sessionId: string;
}): Promise<{ ok: boolean; absent_inserted: number }> {
  if (!isSupabaseConfigured) {
    let absentInserted = 0;
    updateDemoState((db) => {
      const role = db.user_roles.find((r) => r.user_id === params.callerId)?.role;
      const session = db.attendance_sessions.find((s) => s.id === params.sessionId);
      if (!session) throw new Error("Session not found");

      if (role === "lecturer") {
        const assigned = db.course_lecturers.some(
          (cl) => cl.course_id === session.course_id && cl.lecturer_id === params.callerId,
        );
        if (!assigned) throw new Error("Forbidden: not assigned to this course");
      } else if (role !== "admin") {
        throw new Error("Unauthorized");
      }

      const now = new Date().toISOString();
      session.status = "closed";
      session.opened_at = session.opened_at || session.scheduled_at || now;
      session.closed_at = session.closed_at || now;

      for (const c of db.attendance_credentials) {
        if (c.session_id === params.sessionId && !c.revoked_at) {
          c.revoked_at = now;
        }
      }

      const courseEnrollments = db.course_enrollments.filter(
        (ce) =>
          ce.course_id === session.course_id &&
          isStudentEligibleForSession(session, ce),
      );

      for (const ce of courseEnrollments) {
        const hasEntry = db.attendance_entries.some(
          (e) => e.session_id === session.id && e.student_id === ce.student_id,
        );
        if (!hasEntry) {
          db.attendance_entries.push({
            id: genId(),
            session_id: session.id,
            student_id: ce.student_id,
            status: "absent",
            source: "manual",
            checked_in_at: null,
            marked_by: params.callerId,
            updated_at: now,
            created_at: now,
          });
          absentInserted++;
        }
      }

      db.audit_logs.unshift({
        id: genId(),
        actor_id: params.callerId,
        action: "finalize_session",
        entity_type: "attendance_session",
        entity_id: session.id,
        old_data: { previous_status: "open" },
        new_data: { status: "closed", absent_auto_created: absentInserted },
        reason: "Session closed and finalized",
        created_at: now,
      });

      const course = db.courses.find((c) => c.id === session.course_id);
      const courseSessions = db.attendance_sessions.filter(
        (s) => s.course_id === session.course_id && s.status === "closed",
      );

      for (const ce of courseEnrollments) {
        const stats = calculateAttendanceStats({
          sessions: courseSessions,
          entries: db.attendance_entries,
          studentId: ce.student_id,
          enrollments: db.course_enrollments,
          threshold: db.system_settings.low_attendance_threshold,
        });
        if (stats.isBelowThreshold && course) {
          const dedupeKey = `low_att:${ce.student_id}:${course.id}:${stats.eligibleSessionsCount}`;
          if (!db.notifications.some((n) => n.dedupe_key === dedupeKey)) {
            db.notifications.unshift({
              id: genId(),
              recipient_id: ce.student_id,
              type: "low_attendance",
              title: `Low Attendance Warning — ${course.code}`,
              body: `Your attendance in ${course.code} (${course.title}) is currently ${stats.formattedPercentage} (${stats.attendedCount}/${stats.eligibleSessionsCount} classes), below the ${db.system_settings.low_attendance_threshold}% threshold.`,
              is_read: false,
              dedupe_key: dedupeKey,
              created_at: now,
            });
          }
        }
      }
    });
    return { ok: true, absent_inserted: absentInserted };
  }

  const { data, error } = await supabase.rpc("finalize_session", {
    p_session_id: params.sessionId,
  });
  if (error) throw new Error(error.message);
  return { ok: true, absent_inserted: data?.absent_inserted ?? 0 };
}

export async function submitCorrectionRequest(params: {
  callerId?: string;
  studentId?: string;
  attendanceEntryId?: string;
  entryId?: string;
  requestedStatus: AttendanceStatus;
  reason: string;
  supportingNote?: string | null;
}): Promise<CorrectionRequest> {
  const callerId = params.callerId ?? params.studentId ?? "";
  const attendanceEntryId = params.attendanceEntryId ?? params.entryId ?? "";

  if (!isSupabaseConfigured) {
    let created!: CorrectionRequest;
    updateDemoState((db) => {
      const entry = db.attendance_entries.find((e) => e.id === attendanceEntryId);
      if (!entry || entry.student_id !== callerId) {
        throw new Error("Attendance entry not found or does not belong to you");
      }
      const session = db.attendance_sessions.find((s) => s.id === entry.session_id);
      if (!session || session.status !== "closed") {
        throw new Error("Correction requests can only be submitted for finalized sessions");
      }
      const duplicate = db.correction_requests.some(
        (cr) => cr.attendance_entry_id === attendanceEntryId && cr.status === "pending",
      );
      if (duplicate) {
        throw new Error("A correction request is already pending for this attendance entry");
      }

      const now = new Date().toISOString();
      created = {
        id: genId(),
        attendance_entry_id: attendanceEntryId,
        student_id: callerId,
        requested_status: params.requestedStatus,
        reason: params.reason.trim(),
        supporting_note: params.supportingNote?.trim() || null,
        status: "pending",
        reviewer_id: null,
        decision_note: null,
        reviewed_at: null,
        created_at: now,
      };
      db.correction_requests.unshift(created);

      const course = db.courses.find((c) => c.id === session.course_id);
      const studentProfile = db.profiles.find((p) => p.id === callerId);
      const assignedLecs = db.course_lecturers.filter((cl) => cl.course_id === session.course_id);

      for (const cl of assignedLecs) {
        db.notifications.unshift({
          id: genId(),
          recipient_id: cl.lecturer_id,
          type: "correction_submitted",
          title: `New Correction Request — ${course?.code ?? "Course"}`,
          body: `${studentProfile?.full_name ?? "A student"} requested a change from ${entry.status} to ${params.requestedStatus} for ${session.title}.`,
          is_read: false,
          dedupe_key: `corr_sub:${created.id}:${cl.lecturer_id}`,
          created_at: now,
        });
      }
    });
    return created;
  }

  const { data, error } = await supabase.rpc("submit_correction_request", {
    p_attendance_entry_id: attendanceEntryId,
    p_requested_status: params.requestedStatus,
    p_reason: params.reason,
  });
  if (error) throw new Error(error.message);
  return data as CorrectionRequest;
}

export const submitStudentCorrectionRequest = submitCorrectionRequest;

export async function reviewCorrectionRequest(params: {
  callerId?: string;
  reviewerId?: string;
  requestId: string;
  decision: CorrectionStatus;
  decisionNote?: string;
}): Promise<CorrectionRequest> {
  const callerId = params.callerId ?? params.reviewerId ?? "";
  if (!isSupabaseConfigured) {
    let updated!: CorrectionRequest;
    updateDemoState((db) => {
      const reqIdx = db.correction_requests.findIndex((r) => r.id === params.requestId);
      if (reqIdx < 0) throw new Error("Correction request not found");
      const req = db.correction_requests[reqIdx];
      if (req.status !== "pending") {
        throw new Error("This correction request has already been reviewed");
      }

      const entryIdx = db.attendance_entries.findIndex((e) => e.id === req.attendance_entry_id);
      if (entryIdx < 0) throw new Error("Attendance entry not found");
      const entry = db.attendance_entries[entryIdx];
      const session = db.attendance_sessions.find((s) => s.id === entry.session_id);
      const course = db.courses.find((c) => c.id === session?.course_id);

      const now = new Date().toISOString();
      req.status = params.decision;
      req.reviewer_id = callerId;
      req.decision_note = params.decisionNote?.trim() || null;
      req.reviewed_at = now;
      updated = { ...req };

      if (params.decision === "approved") {
        const prevStatus = entry.status;
        const prevSource = entry.source;
        entry.status = req.requested_status;
        entry.source = "correction";
        entry.marked_by = callerId;
        entry.updated_at = now;

        db.audit_logs.unshift({
          id: genId(),
          actor_id: callerId,
          action: "approve_correction_request",
          entity_type: "attendance_entry",
          entity_id: entry.id,
          old_data: { status: prevStatus, source: prevSource, request_id: req.id },
          new_data: { status: req.requested_status, source: "correction", request_id: req.id },
          reason: params.decisionNote?.trim() || req.reason,
          created_at: now,
        });
      } else {
        db.audit_logs.unshift({
          id: genId(),
          actor_id: callerId,
          action: "reject_correction_request",
          entity_type: "correction_request",
          entity_id: req.id,
          old_data: { status: "pending" },
          new_data: { status: "rejected" },
          reason: params.decisionNote?.trim() || "Correction rejected",
          created_at: now,
        });
      }

      db.notifications.unshift({
        id: genId(),
        recipient_id: req.student_id,
        type: `correction_${params.decision}`,
        title: `Correction Request ${params.decision === "approved" ? "Approved" : "Rejected"} — ${course?.code ?? ""}`,
        body: `Your correction request for ${course?.code ?? ""} (${session?.title ?? ""}) was ${params.decision}${params.decisionNote?.trim() ? `. Note: ${params.decisionNote.trim()}` : "."}`,
        is_read: false,
        dedupe_key: `corr_rev:${req.id}`,
        created_at: now,
      });
    });
    return updated;
  }

  const { data, error } = await supabase.rpc("review_correction", {
    p_request_id: params.requestId,
    p_decision: params.decision,
    p_decision_note: params.decisionNote ?? null,
  });
  if (error) throw new Error(error.message);
  return data as CorrectionRequest;
}

export async function markNotificationRead(notificationId: string) {
  if (!isSupabaseConfigured) {
    updateDemoState((db) => {
      const n = db.notifications.find((item) => item.id === notificationId);
      if (n) n.is_read = true;
    });
    return;
  }
  await supabase.from("notifications").update({ is_read: true }).eq("id", notificationId);
}

export async function markAllNotificationsRead(recipientId: string) {
  if (!isSupabaseConfigured) {
    updateDemoState((db) => {
      for (const n of db.notifications) {
        if (n.recipient_id === recipientId) n.is_read = true;
      }
    });
    return;
  }
  await supabase
    .from("notifications")
    .update({ is_read: true })
    .eq("recipient_id", recipientId)
    .eq("is_read", false);
}

export async function updateOwnProfile(params: {
  userId: string;
  fullName: string;
  phone: string | null;
}) {
  if (!isSupabaseConfigured) {
    updateDemoState((db) => {
      const p = db.profiles.find((item) => item.id === params.userId);
      if (p) {
        p.full_name = params.fullName.trim();
        p.phone = params.phone?.trim() || null;
      }
    });
    return;
  }
  const { error } = await supabase
    .from("profiles")
    .update({
      full_name: params.fullName.trim(),
      phone: params.phone?.trim() || null,
    })
    .eq("id", params.userId);
  if (error) throw new Error(error.message);
}
