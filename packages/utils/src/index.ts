import { clsx, type ClassValue } from "clsx";
import { extendTailwindMerge } from "tailwind-merge";
import type {
  AttendanceEntry,
  AttendanceSession,
  AttendanceSummaryStats,
  CourseEnrollment,
} from "@attendance/types";

const twMerge = extendTailwindMerge({
  extend: {
    theme: {
      spacing: [
        "v2-control-sm",
        "v2-control-md",
        "v2-control-lg",
        "v2-sidebar",
        "v2-sidebar-collapsed",
        "v2-form",
      ],
    },
    classGroups: {
      rounded: [{ rounded: ["v2-xs", "v2-sm", "v2-md", "v2-lg"] }],
      "font-size": [
        {
          text: [
            "3xs",
            "2xs",
            "xs",
            "meta",
            "sm",
            "ui",
            "base",
            "md",
            "lg",
            "xl",
            "2xl",
            "3xl",
            "4xl",
            "5xl",
            "6xl",
            "7xl",
            "8xl",
          ].map((step) => `v2-${step}`),
        },
      ],
      "ring-w": [{ ring: ["v2"] }],
      "max-w": [{ "max-w": ["v2-page", "v2-content", "v2-form"] }],
      opacity: [{ opacity: ["v2-disabled"] }],
    },
  },
});

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const WEEKDAY_NAMES = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
] as const;

export const WEEKDAY_SHORT = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] as const;

export function getWeekdayName(day: number, short = false): string {
  return (short ? WEEKDAY_SHORT[day] : WEEKDAY_NAMES[day]) ?? "Unknown";
}

/**
 * Checks whether a student enrollment was active at the time of a session.
 * Never retroactively counts sessions before a student enrolled or after enrollment ended.
 */
export function isStudentEligibleForSession(
  session: Pick<AttendanceSession, "opened_at" | "scheduled_at" | "status">,
  enrollment?: Pick<CourseEnrollment, "enrolled_at" | "unenrolled_at"> | null,
): boolean {
  if (session.status !== "closed") return false;
  if (!enrollment) return false;

  const sessionTime = new Date(session.opened_at ?? session.scheduled_at).getTime();
  const enrolledAt = new Date(enrollment.enrolled_at).getTime();

  // Allow same-day enrollment tolerance of 24h for newly seeded/enrolled students on day 1
  if (enrolledAt > sessionTime + 24 * 60 * 60 * 1000) {
    return false;
  }

  if (enrollment.unenrolled_at) {
    const unenrolledAt = new Date(enrollment.unenrolled_at).getTime();
    if (sessionTime > unenrolledAt) {
      return false;
    }
  }

  return true;
}

/**
 * Canonical attendance percentage calculation used across Admin, Lecturer, and Student apps.
 * - Counts ONLY finalized ('closed') sessions for which the student was enrolled at session time.
 * - 'present' and 'late' both count as attended (POC policy).
 * - 'absent' counts as missed.
 * - 0 eligible sessions -> percentage is null, formattedPercentage is 'N/A' (never division by zero).
 */
export function calculateAttendanceStats(params: {
  sessions: Pick<AttendanceSession, "id" | "course_id" | "opened_at" | "scheduled_at" | "status">[];
  entries: Pick<AttendanceEntry, "session_id" | "student_id" | "status">[];
  studentId: string;
  enrollments?: Pick<CourseEnrollment, "course_id" | "student_id" | "enrolled_at" | "unenrolled_at">[];
  threshold?: number;
}): AttendanceSummaryStats {
  const { sessions, entries, studentId, enrollments, threshold = 75 } = params;

  const closedEligibleSessions = sessions.filter((s) => {
    if (s.status !== "closed") return false;
    if (!enrollments || enrollments.length === 0) return true;
    const enrollment = enrollments.find(
      (e) => e.course_id === s.course_id && e.student_id === studentId,
    );
    return isStudentEligibleForSession(s, enrollment);
  });

  const eligibleIds = new Set(closedEligibleSessions.map((s) => s.id));
  const studentEntries = entries.filter(
    (e) => e.student_id === studentId && eligibleIds.has(e.session_id),
  );

  let presentCount = 0;
  let lateCount = 0;
  let recordedAbsentCount = 0;

  for (const entry of studentEntries) {
    if (entry.status === "present") presentCount++;
    else if (entry.status === "late") lateCount++;
    else if (entry.status === "absent") recordedAbsentCount++;
  }

  const eligibleSessionsCount = closedEligibleSessions.length;
  const attendedCount = presentCount + lateCount;
  // Any finalized eligible session without a present/late record is absent
  const absentCount = Math.max(recordedAbsentCount, eligibleSessionsCount - attendedCount);

  if (eligibleSessionsCount === 0) {
    return {
      eligibleSessionsCount: 0,
      presentCount: 0,
      lateCount: 0,
      attendedCount: 0,
      absentCount: 0,
      percentage: null,
      formattedPercentage: "N/A",
      isBelowThreshold: false,
    };
  }

  const rawPercentage = (100 * attendedCount) / eligibleSessionsCount;
  const percentage = Math.round(rawPercentage * 10) / 10;

  return {
    eligibleSessionsCount,
    presentCount,
    lateCount,
    attendedCount,
    absentCount,
    percentage,
    formattedPercentage: `${percentage}%`,
    isBelowThreshold: percentage < threshold,
  };
}

export function formatDateTime(
  iso: string | null | undefined,
  timezone = "Africa/Accra",
): string {
  if (!iso) return "—";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "—";
  try {
    return new Intl.DateTimeFormat("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      timeZone: timezone,
    }).format(date);
  } catch {
    return date.toLocaleString();
  }
}

export function formatDateShort(
  iso: string | null | undefined,
  timezone = "Africa/Accra",
): string {
  if (!iso) return "—";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "—";
  try {
    return new Intl.DateTimeFormat("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      timeZone: timezone,
    }).format(date);
  } catch {
    return date.toLocaleDateString();
  }
}

export function formatTimeOnly(
  iso: string | null | undefined,
  timezone = "Africa/Accra",
): string {
  if (!iso) return "—";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "—";
  try {
    return new Intl.DateTimeFormat("en-GB", {
      hour: "2-digit",
      minute: "2-digit",
      timeZone: timezone,
    }).format(date);
  } catch {
    return date.toLocaleTimeString();
  }
}

export function formatCountdown(seconds: number): string {
  const safe = Math.max(0, Math.floor(seconds));
  const mins = Math.floor(safe / 60);
  const secs = safe % 60;
  return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
}

export function formatTimeSlot(
  startTime: string | null | undefined,
  endTime: string | null | undefined,
): string {
  const trimSeconds = (value: string | null | undefined) => {
    if (!value) return "—";
    const parts = value.split(":");
    return parts.length >= 2 ? `${parts[0]}:${parts[1]}` : value;
  };
  return `${trimSeconds(startTime)} – ${trimSeconds(endTime)}`;
}

export function exportToCsv(
  filename: string,
  headersOrRows: string[] | Record<string, string | number | null | undefined>[],
  maybeRows?: (string | number | null | undefined)[][],
) {
  let headers: string[] = [];
  let rows: (string | number | null | undefined)[][] = [];

  if (Array.isArray(maybeRows)) {
    headers = headersOrRows as string[];
    rows = maybeRows;
  } else {
    const records = headersOrRows as Record<string, string | number | null | undefined>[];
    headers = records.length > 0 ? Object.keys(records[0]) : [];
    rows = records.map((rec) => headers.map((key) => rec[key]));
  }

  const escapeCsvCell = (val: string | number | null | undefined) => {
    const str = val === null || val === undefined ? "" : String(val);
    if (str.includes(",") || str.includes('"') || str.includes("\n")) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };

  const csvLines = [
    headers.map(escapeCsvCell).join(","),
    ...rows.map((row) => row.map(escapeCsvCell).join(",")),
  ];

  const csvContent = "\uFEFF" + csvLines.join("\n");
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename.endsWith(".csv") ? filename : `${filename}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Lightweight browser PDF report exporter.
 * Opens a clean, flat monochrome print-ready document and triggers the browser PDF print dialog.
 */
export function exportToPdf(params: {
  title: string;
  subtitle?: string;
  summaryItems?: { label: string; value: string }[];
  headers: string[];
  rows: (string | number | null | undefined)[][];
}) {
  const { title, subtitle, summaryItems = [], headers, rows } = params;
  const win = window.open("", "_blank", "width=960,height=720");
  if (!win) return;

  const esc = (s: string | number | null | undefined) =>
    String(s ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");

  const html = `<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <title>${esc(title)}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link href="https://fonts.googleapis.com/css2?family=Urbanist:wght@400;500;600;700&display=swap" rel="stylesheet">
  <style>
    * { box-sizing: border-box; font-family: 'Urbanist', -apple-system, BlinkMacSystemFont, sans-serif; }
    body { margin: 0; padding: 32px; color: #131e20; background: #ffffff; font-size: 13px; }
    h1 { margin: 0 0 4px 0; font-size: 22px; font-weight: 600; }
    p.sub { margin: 0 0 20px 0; color: #546163; font-size: 13px; }
    .summary { display: flex; flex-wrap: wrap; gap: 16px; margin-bottom: 24px; padding: 14px 16px; background: #f8fafa; }
    .summary-item { min-width: 120px; }
    .summary-label { font-size: 11px; color: #546163; text-transform: uppercase; letter-spacing: 0.04em; }
    .summary-value { font-size: 18px; font-weight: 600; margin-top: 2px; color: #075056; }
    table { width: 100%; border-collapse: collapse; }
    th { text-align: left; font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.04em; color: #546163; padding: 10px 8px; border-bottom: 1px solid #e7ecec; background: #f8fafa; }
    td { padding: 9px 8px; border-bottom: 1px solid #f0f3f3; color: #131e20; }
    .footer { margin-top: 24px; font-size: 11px; color: #849294; display: flex; justify-content: space-between; }
    @media print {
      body { padding: 16px; }
    }
  </style>
</head>
<body>
  <h1>${esc(title)}</h1>
  ${subtitle ? `<p class="sub">${esc(subtitle)}</p>` : ""}
  ${
    summaryItems.length > 0
      ? `<div class="summary">${summaryItems
          .map(
            (item) =>
              `<div class="summary-item"><div class="summary-label">${esc(item.label)}</div><div class="summary-value">${esc(item.value)}</div></div>`,
          )
          .join("")}</div>`
      : ""
  }
  <table>
    <thead>
      <tr>${headers.map((h) => `<th>${esc(h)}</th>`).join("")}</tr>
    </thead>
    <tbody>
      ${rows
        .map(
          (row) =>
            `<tr>${row.map((cell) => `<td>${esc(cell)}</td>`).join("")}</tr>`,
        )
        .join("")}
    </tbody>
  </table>
  <div class="footer">
    <span>Student Attendance Management System</span>
    <span>Generated ${esc(new Date().toUTCString())}</span>
  </div>
  <script>
    window.onload = function() {
      setTimeout(function() { window.print(); }, 250);
    };
  </script>
</body>
</html>`;

  win.document.open();
  win.document.write(html);
  win.document.close();
}
