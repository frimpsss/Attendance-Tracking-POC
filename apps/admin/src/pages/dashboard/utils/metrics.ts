import type { CourseSummaryRow } from "@attendance/supabase";

export function computeOverallAttendance(courses: CourseSummaryRow[]): string {
  const valid = courses.filter((c) => c.attendance_percentage !== null);
  if (valid.length === 0) return "N/A";
  const avg =
    valid.reduce((sum, c) => sum + (c.attendance_percentage ?? 0), 0) / valid.length;
  return `${Math.round(avg * 10) / 10}%`;
}
