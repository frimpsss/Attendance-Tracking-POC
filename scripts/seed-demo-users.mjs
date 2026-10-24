#!/usr/bin/env node
/**
 * Repeatable Demo User & Attendance Data Seeder
 * Provisions 1 Admin, 2 Lecturers, and 10 Students via Supabase Auth Admin API
 * (never raw SQL inserts into auth.users), then links their UUIDs to profiles,
 * user_roles, courses, enrollments, historical closed sessions, attendance entries,
 * pending correction requests, notifications, and audit logs.
 *
 * Usage:
 *   SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... DEMO_DEFAULT_PASSWORD=... pnpm seed:users
 */

import { createRequire } from "node:module";
import fs from "node:fs";
import path from "node:path";

const require = createRequire(new URL("../packages/supabase/package.json", import.meta.url));
const { createClient } = require("@supabase/supabase-js");

// Load .env if present
const envPath = path.resolve(process.cwd(), ".env");
if (fs.existsSync(envPath)) {
  const lines = fs.readFileSync(envPath, "utf8").split("\n");
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eqIndex = trimmed.indexOf("=");
    if (eqIndex > 0) {
      const key = trimmed.slice(0, eqIndex).trim();
      const rawValue = trimmed.slice(eqIndex + 1).trim();
      const value = rawValue.replace(/^['"]|['"]$/g, "").trim();
      if (!process.env[key]) process.env[key] = value;
    }
  }
}

const isUsableUrl = (u) =>
  typeof u === "string" &&
  /^https?:\/\//i.test(u) &&
  !u.includes("your-project-ref");

let linkedRefUrl = "";
const linkedRefPath = path.resolve(process.cwd(), "supabase/.temp/project-ref");
if (fs.existsSync(linkedRefPath)) {
  const ref = fs.readFileSync(linkedRefPath, "utf8").trim();
  if (ref) linkedRefUrl = `https://${ref}.supabase.co`;
}

const supabaseUrl = [
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_URL,
  linkedRefUrl,
].find(isUsableUrl);

const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const defaultPassword = process.env.DEMO_DEFAULT_PASSWORD || "ChangeMe123!";

if (!supabaseUrl || !serviceRoleKey || serviceRoleKey.includes("your-service-role")) {
  console.error(
    "Missing valid SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env. Please set VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env before running `pnpm seed:users`.",
  );
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const DEPT_CS = "11111111-1111-4111-8111-111111111101";
const DEPT_BUS = "11111111-1111-4111-8111-111111111102";
const PERIOD_1 = "22222222-2222-4222-8222-222222222201";

const COURSE_CS301 = "33333333-3333-4333-8333-333333333301";
const COURSE_CS304 = "33333333-3333-4333-8333-333333333302";
const COURSE_CS402 = "33333333-3333-4333-8333-333333333303";
const COURSE_BUS205 = "33333333-3333-4333-8333-333333333304";

const DEMO_USERS = [
  {
    key: "admin",
    email: "admin@university.edu.gh",
    fullName: "System Administrator",
    phone: "+233 24 100 0001",
    role: "admin",
  },
  {
    key: "lec1",
    email: "lecturer1@university.edu.gh",
    fullName: "Dr. Kwame Mensah",
    phone: "+233 24 200 0001",
    role: "lecturer",
    staffNumber: "STF-1001",
    departmentId: DEPT_CS,
  },
  {
    key: "lec2",
    email: "lecturer2@university.edu.gh",
    fullName: "Prof. Ama Osei",
    phone: "+233 24 200 0002",
    role: "lecturer",
    staffNumber: "STF-2001",
    departmentId: DEPT_BUS,
  },
  {
    key: "stu1",
    email: "student1@university.edu.gh",
    fullName: "Kofi Boateng",
    phone: "+233 50 300 0001",
    role: "student",
    studentNumber: "UG2026001",
    departmentId: DEPT_CS,
    academicLevel: "300",
  },
  {
    key: "stu2",
    email: "student2@university.edu.gh",
    fullName: "Abena Asante",
    phone: "+233 50 300 0002",
    role: "student",
    studentNumber: "UG2026002",
    departmentId: DEPT_CS,
    academicLevel: "300",
  },
  {
    key: "stu3",
    email: "student3@university.edu.gh",
    fullName: "Yaw Owusu",
    phone: "+233 50 300 0003",
    role: "student",
    studentNumber: "UG2026003",
    departmentId: DEPT_CS,
    academicLevel: "300",
  },
  {
    key: "stu4",
    email: "student4@university.edu.gh",
    fullName: "Efua Mensah",
    phone: "+233 50 300 0004",
    role: "student",
    studentNumber: "UG2026004",
    departmentId: DEPT_CS,
    academicLevel: "400",
  },
  {
    key: "stu5",
    email: "student5@university.edu.gh",
    fullName: "Kwesi Appiah",
    phone: "+233 50 300 0005",
    role: "student",
    studentNumber: "UG2026005",
    departmentId: DEPT_CS,
    academicLevel: "300",
  },
  {
    key: "stu6",
    email: "student6@university.edu.gh",
    fullName: "Akosua Darko",
    phone: "+233 50 300 0006",
    role: "student",
    studentNumber: "UG2026006",
    departmentId: DEPT_CS,
    academicLevel: "400",
  },
  {
    key: "stu7",
    email: "student7@university.edu.gh",
    fullName: "Kojo Annan",
    phone: "+233 50 300 0007",
    role: "student",
    studentNumber: "UG2026007",
    departmentId: DEPT_BUS,
    academicLevel: "200",
  },
  {
    key: "stu8",
    email: "student8@university.edu.gh",
    fullName: "Adwoa Badu",
    phone: "+233 50 300 0008",
    role: "student",
    studentNumber: "UG2026008",
    departmentId: DEPT_BUS,
    academicLevel: "200",
  },
  {
    key: "stu9",
    email: "student9@university.edu.gh",
    fullName: "Nana Agyeman",
    phone: "+233 50 300 0009",
    role: "student",
    studentNumber: "UG2026009",
    departmentId: DEPT_CS,
    academicLevel: "300",
  },
  {
    key: "stu10",
    email: "student10@university.edu.gh",
    fullName: "Esi Tetteh",
    phone: "+233 50 300 0010",
    role: "student",
    studentNumber: "UG2026010",
    departmentId: DEPT_BUS,
    academicLevel: "200",
  },
];

async function ensureAuthUser(u) {
  const { data: listData } = await supabase.auth.admin.listUsers({ perPage: 200 });
  const existing = listData?.users?.find((item) => item.email?.toLowerCase() === u.email.toLowerCase());

  let userId;
  if (existing) {
    userId = existing.id;
    await supabase.auth.admin.updateUserById(userId, {
      password: defaultPassword,
      email_confirm: true,
      user_metadata: { full_name: u.fullName },
    });
  } else {
    const { data: created, error } = await supabase.auth.admin.createUser({
      email: u.email,
      password: defaultPassword,
      email_confirm: true,
      user_metadata: { full_name: u.fullName },
    });
    if (error) throw error;
    userId = created.user.id;
  }

  await supabase.from("profiles").upsert({
    id: userId,
    full_name: u.fullName,
    email: u.email,
    phone: u.phone,
    is_active: true,
  });

  await supabase.from("user_roles").upsert({
    user_id: userId,
    role: u.role,
  });

  if (u.role === "student") {
    await supabase.from("students").upsert({
      user_id: userId,
      student_number: u.studentNumber,
      department_id: u.departmentId,
      academic_level: u.academicLevel,
    });
  } else if (u.role === "lecturer") {
    await supabase.from("lecturers").upsert({
      user_id: userId,
      staff_number: u.staffNumber,
      department_id: u.departmentId,
    });
  }

  return userId;
}

async function main() {
  console.log("Seeding base academic entities...");
  await supabase.from("departments").upsert([
    { id: DEPT_CS, code: "CS", name: "Computer Science & Engineering", is_active: true },
    { id: DEPT_BUS, code: "BUS", name: "Business Administration & Analytics", is_active: true },
  ]);

  await supabase.from("academic_periods").upsert([
    {
      id: PERIOD_1,
      name: "2026/2027 — Semester 1",
      start_date: "2026-09-01",
      end_date: "2027-01-31",
      is_active: true,
    },
  ]);

  await supabase.from("courses").upsert([
    {
      id: COURSE_CS301,
      code: "CS301",
      title: "Software Engineering & Architecture",
      department_id: DEPT_CS,
      academic_period_id: PERIOD_1,
      is_active: true,
    },
    {
      id: COURSE_CS304,
      code: "CS304",
      title: "Database Systems & Security",
      department_id: DEPT_CS,
      academic_period_id: PERIOD_1,
      is_active: true,
    },
    {
      id: COURSE_CS402,
      code: "CS402",
      title: "Distributed Cloud Systems",
      department_id: DEPT_CS,
      academic_period_id: PERIOD_1,
      is_active: true,
    },
    {
      id: COURSE_BUS205,
      code: "BUS205",
      title: "Operations & Quantitative Methods",
      department_id: DEPT_BUS,
      academic_period_id: PERIOD_1,
      is_active: true,
    },
  ]);

  console.log("Provisioning demo Auth accounts (1 Admin, 2 Lecturers, 10 Students)...");
  const ids = {};
  for (const u of DEMO_USERS) {
    ids[u.key] = await ensureAuthUser(u);
    console.log(`  ✓ ${u.role.padEnd(8)} | ${u.email} (${u.fullName})`);
  }

  console.log("Assigning lecturers and enrolling students...");
  await supabase.from("course_lecturers").upsert([
    { course_id: COURSE_CS301, lecturer_id: ids.lec1 },
    { course_id: COURSE_CS304, lecturer_id: ids.lec1 },
    { course_id: COURSE_CS402, lecturer_id: ids.lec1 },
    { course_id: COURSE_BUS205, lecturer_id: ids.lec2 },
  ]);

  const enrolledAt = "2026-09-02T08:00:00Z";
  const csStudents = ["stu1", "stu2", "stu3", "stu4", "stu5", "stu6", "stu9"];
  const busStudents = ["stu1", "stu7", "stu8", "stu10"];

  const enrollments = [];
  for (const k of csStudents) {
    enrollments.push(
      { course_id: COURSE_CS301, student_id: ids[k], enrolled_at: enrolledAt, is_active: true },
      { course_id: COURSE_CS304, student_id: ids[k], enrolled_at: enrolledAt, is_active: true },
    );
  }
  for (const k of ["stu4", "stu6", "stu1"]) {
    enrollments.push({ course_id: COURSE_CS402, student_id: ids[k], enrolled_at: enrolledAt, is_active: true });
  }
  for (const k of busStudents) {
    enrollments.push({ course_id: COURSE_BUS205, student_id: ids[k], enrolled_at: enrolledAt, is_active: true });
  }
  await supabase.from("course_enrollments").upsert(enrollments);

  console.log("Seeding weekly timetable slots...");
  await supabase.from("timetables").upsert([
    {
      id: "44444444-4444-4444-8444-444444444401",
      course_id: COURSE_CS301,
      weekday: 1,
      start_time: "09:00:00",
      end_time: "11:00:00",
      venue: "CS Lecture Hall B1",
      effective_from: "2026-09-01",
    },
    {
      id: "44444444-4444-4444-8444-444444444402",
      course_id: COURSE_CS304,
      weekday: 2,
      start_time: "10:00:00",
      end_time: "12:00:00",
      venue: "Engineering Lab 3",
      effective_from: "2026-09-01",
    },
    {
      id: "44444444-4444-4444-8444-444444444403",
      course_id: COURSE_CS402,
      weekday: 3,
      start_time: "14:00:00",
      end_time: "16:00:00",
      venue: "Cloud Innovation Lab",
      effective_from: "2026-09-01",
    },
    {
      id: "44444444-4444-4444-8444-444444444404",
      course_id: COURSE_BUS205,
      weekday: 5,
      start_time: "08:30:00",
      end_time: "10:30:00",
      venue: "Business Auditorium A",
      effective_from: "2026-09-01",
    },
  ]);

  console.log("Seeding historical closed sessions and attendance entries...");
  const SESS_1 = "55555555-5555-4555-8555-555555555501";
  const SESS_2 = "55555555-5555-4555-8555-555555555502";
  const SESS_3 = "55555555-5555-4555-8555-555555555503";
  const SESS_4 = "55555555-5555-4555-8555-555555555504";

  await supabase.from("attendance_sessions").upsert([
    {
      id: SESS_1,
      course_id: COURSE_CS301,
      created_by: ids.lec1,
      title: "Week 1 — Domain-Driven Design & Monorepos",
      scheduled_at: "2026-10-05T09:00:00Z",
      opened_at: "2026-10-05T09:02:00Z",
      closes_at: "2026-10-05T09:32:00Z",
      closed_at: "2026-10-05T10:55:00Z",
      status: "closed",
    },
    {
      id: SESS_2,
      course_id: COURSE_CS301,
      created_by: ids.lec1,
      title: "Week 2 — Clean Architecture & Boundaries",
      scheduled_at: "2026-10-12T09:00:00Z",
      opened_at: "2026-10-12T09:00:00Z",
      closes_at: "2026-10-12T09:30:00Z",
      closed_at: "2026-10-12T10:50:00Z",
      status: "closed",
    },
    {
      id: SESS_3,
      course_id: COURSE_CS304,
      created_by: ids.lec1,
      title: "Week 1 — Relational Algebra & Postgres RLS",
      scheduled_at: "2026-10-06T10:00:00Z",
      opened_at: "2026-10-06T10:01:00Z",
      closes_at: "2026-10-06T10:31:00Z",
      closed_at: "2026-10-06T11:50:00Z",
      status: "closed",
    },
    {
      id: SESS_4,
      course_id: COURSE_BUS205,
      created_by: ids.lec2,
      title: "Week 1 — Linear Programming Models",
      scheduled_at: "2026-10-09T08:30:00Z",
      opened_at: "2026-10-09T08:31:00Z",
      closes_at: "2026-10-09T09:01:00Z",
      closed_at: "2026-10-09T10:25:00Z",
      status: "closed",
    },
  ]);

  const entries = [
    // Session 1 (CS301)
    { id: "66666666-6666-4666-8666-666666666601", session_id: SESS_1, student_id: ids.stu1, status: "present", source: "qr", checked_in_at: "2026-10-05T09:05:00Z", marked_by: ids.stu1 },
    { id: "66666666-6666-4666-8666-666666666602", session_id: SESS_1, student_id: ids.stu2, status: "present", source: "code", checked_in_at: "2026-10-05T09:07:00Z", marked_by: ids.stu2 },
    { id: "66666666-6666-4666-8666-666666666603", session_id: SESS_1, student_id: ids.stu3, status: "late", source: "qr", checked_in_at: "2026-10-05T09:16:00Z", marked_by: ids.stu3 },
    { id: "66666666-6666-4666-8666-666666666604", session_id: SESS_1, student_id: ids.stu4, status: "present", source: "qr", checked_in_at: "2026-10-05T09:04:00Z", marked_by: ids.stu4 },
    { id: "66666666-6666-4666-8666-666666666605", session_id: SESS_1, student_id: ids.stu5, status: "absent", source: "manual", checked_in_at: null, marked_by: ids.lec1 },
    { id: "66666666-6666-4666-8666-666666666606", session_id: SESS_1, student_id: ids.stu6, status: "present", source: "qr", checked_in_at: "2026-10-05T09:06:00Z", marked_by: ids.stu6 },
    { id: "66666666-6666-4666-8666-666666666607", session_id: SESS_1, student_id: ids.stu9, status: "absent", source: "manual", checked_in_at: null, marked_by: ids.lec1 },

    // Session 2 (CS301)
    { id: "66666666-6666-4666-8666-666666666608", session_id: SESS_2, student_id: ids.stu1, status: "absent", source: "manual", checked_in_at: null, marked_by: ids.lec1 },
    { id: "66666666-6666-4666-8666-666666666609", session_id: SESS_2, student_id: ids.stu2, status: "present", source: "qr", checked_in_at: "2026-10-12T09:03:00Z", marked_by: ids.stu2 },
    { id: "66666666-6666-4666-8666-666666666610", session_id: SESS_2, student_id: ids.stu3, status: "present", source: "qr", checked_in_at: "2026-10-12T09:04:00Z", marked_by: ids.stu3 },
    { id: "66666666-6666-4666-8666-666666666611", session_id: SESS_2, student_id: ids.stu4, status: "late", source: "code", checked_in_at: "2026-10-12T09:14:00Z", marked_by: ids.stu4 },
    { id: "66666666-6666-4666-8666-666666666612", session_id: SESS_2, student_id: ids.stu5, status: "absent", source: "manual", checked_in_at: null, marked_by: ids.lec1 },
    { id: "66666666-6666-4666-8666-666666666613", session_id: SESS_2, student_id: ids.stu6, status: "present", source: "qr", checked_in_at: "2026-10-12T09:05:00Z", marked_by: ids.stu6 },
    { id: "66666666-6666-4666-8666-666666666614", session_id: SESS_2, student_id: ids.stu9, status: "absent", source: "manual", checked_in_at: null, marked_by: ids.lec1 },

    // Session 3 (CS304)
    { id: "66666666-6666-4666-8666-666666666615", session_id: SESS_3, student_id: ids.stu1, status: "present", source: "qr", checked_in_at: "2026-10-06T10:04:00Z", marked_by: ids.stu1 },
    { id: "66666666-6666-4666-8666-666666666616", session_id: SESS_3, student_id: ids.stu2, status: "present", source: "qr", checked_in_at: "2026-10-06T10:05:00Z", marked_by: ids.stu2 },
    { id: "66666666-6666-4666-8666-666666666617", session_id: SESS_3, student_id: ids.stu3, status: "present", source: "code", checked_in_at: "2026-10-06T10:08:00Z", marked_by: ids.stu3 },
    { id: "66666666-6666-4666-8666-666666666618", session_id: SESS_3, student_id: ids.stu4, status: "present", source: "qr", checked_in_at: "2026-10-06T10:03:00Z", marked_by: ids.stu4 },
    { id: "66666666-6666-4666-8666-666666666619", session_id: SESS_3, student_id: ids.stu5, status: "late", source: "qr", checked_in_at: "2026-10-06T10:15:00Z", marked_by: ids.stu5 },
    { id: "66666666-6666-4666-8666-666666666620", session_id: SESS_3, student_id: ids.stu6, status: "present", source: "qr", checked_in_at: "2026-10-06T10:06:00Z", marked_by: ids.stu6 },
    { id: "66666666-6666-4666-8666-666666666621", session_id: SESS_3, student_id: ids.stu9, status: "absent", source: "manual", checked_in_at: null, marked_by: ids.lec1 },

    // Session 4 (BUS205)
    { id: "66666666-6666-4666-8666-666666666622", session_id: SESS_4, student_id: ids.stu1, status: "present", source: "qr", checked_in_at: "2026-10-09T08:34:00Z", marked_by: ids.stu1 },
    { id: "66666666-6666-4666-8666-666666666623", session_id: SESS_4, student_id: ids.stu7, status: "present", source: "qr", checked_in_at: "2026-10-09T08:35:00Z", marked_by: ids.stu7 },
    { id: "66666666-6666-4666-8666-666666666624", session_id: SESS_4, student_id: ids.stu8, status: "late", source: "code", checked_in_at: "2026-10-09T08:45:00Z", marked_by: ids.stu8 },
    { id: "66666666-6666-4666-8666-666666666625", session_id: SESS_4, student_id: ids.stu10, status: "absent", source: "manual", checked_in_at: null, marked_by: ids.lec2 },
  ];

  await supabase.from("attendance_entries").upsert(entries);

  console.log("Seeding sample pending correction requests & notifications...");
  await supabase.from("correction_requests").upsert([
    {
      id: "77777777-7777-4777-8777-777777777701",
      attendance_entry_id: "66666666-6666-4666-8666-666666666608",
      student_id: ids.stu1,
      requested_status: "present",
      reason: "My phone battery died during the QR window, but I signed the lab sheet at the front desk.",
      status: "pending",
    },
    {
      id: "77777777-7777-4777-8777-777777777702",
      attendance_entry_id: "66666666-6666-4666-8666-666666666605",
      student_id: ids.stu5,
      requested_status: "late",
      reason: "Arrived 18 minutes after class started due to campus shuttle breakdown.",
      status: "pending",
    },
  ]);

  await supabase.from("notifications").upsert([
    {
      id: "88888888-8888-4888-8888-888888888801",
      recipient_id: ids.lec1,
      type: "correction_submitted",
      title: "New Correction Request — CS301",
      body: "Abena Asante requested a change from absent to present for Week 2 — Clean Architecture & Boundaries.",
      is_read: false,
      dedupe_key: "seed_corr_1",
    },
    {
      id: "88888888-8888-4888-8888-888888888802",
      recipient_id: ids.stu5,
      type: "low_attendance",
      title: "Low Attendance Warning — CS301",
      body: "Your attendance in CS301 (Software Engineering & Architecture) is currently 0% (0/2 classes), below the 75% requirement.",
      is_read: false,
      dedupe_key: "seed_low_att_stu5",
    },
    {
      id: "88888888-8888-4888-8888-888888888803",
      recipient_id: ids.stu1,
      type: "low_attendance",
      title: "Low Attendance Warning — CS301",
      body: "Your attendance in CS301 (Software Engineering & Architecture) is currently 50% (1/2 classes), below the 75% requirement.",
      is_read: false,
      dedupe_key: "seed_low_att_stu1",
    },
  ]);

  console.log("\nDone! All demo accounts and attendance records are ready.");
}

main().catch((err) => {
  console.error("Seed error:", err);
  process.exit(1);
});
