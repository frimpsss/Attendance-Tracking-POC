import * as React from "react";
import {
  queryCorrectionsPage,
  queryCoursesPage,
  queryLecturersPage,
  querySessionsPage,
  queryStudentsPage,
  querySystemSettings,
  subscribeToAttendanceChanges,
  type CourseSummaryRow,
  type DetailedCorrectionRow,
  type SessionSummaryRow,
  type StudentSummaryRow,
} from "@attendance/supabase";
import type { SystemSettings } from "@attendance/types";

export function useDashboard() {
  const [studentsTotal, setStudentsTotal] = React.useState(0);
  const [lecturersTotal, setLecturersTotal] = React.useState(0);
  const [courses, setCourses] = React.useState<CourseSummaryRow[]>([]);
  const [recentSessions, setRecentSessions] = React.useState<SessionSummaryRow[]>([]);
  const [sessionsTotal, setSessionsTotal] = React.useState(0);
  const [lowStudents, setLowStudents] = React.useState<StudentSummaryRow[]>([]);
  const [pendingCorrections, setPendingCorrections] = React.useState<DetailedCorrectionRow[]>([]);
  const [settings, setSettings] = React.useState<SystemSettings | null>(null);
  const [loading, setLoading] = React.useState(true);

  const load = React.useCallback(async () => {
    setLoading(true);
    try {
      const [stuRes, lecRes, courseRes, sessRes, corrRes, sysRes] = await Promise.all([
        queryStudentsPage({ page: 1, pageSize: 100 }),
        queryLecturersPage({ page: 1, pageSize: 1 }),
        queryCoursesPage({ page: 1, pageSize: 50 }),
        querySessionsPage({ page: 1, pageSize: 6 }),
        queryCorrectionsPage({ page: 1, pageSize: 6, statuses: ["pending"] }),
        querySystemSettings(),
      ]);
      setStudentsTotal(stuRes.total);
      setLecturersTotal(lecRes.total);
      setCourses(courseRes.items);
      setRecentSessions(sessRes.items);
      setSessionsTotal(sessRes.total);
      setLowStudents(stuRes.items.filter((s) => s.is_below_threshold));
      setPendingCorrections(corrRes.items);
      setSettings(sysRes);
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    void load();
    return subscribeToAttendanceChanges(() => void load());
  }, [load]);

  return {
    studentsTotal,
    lecturersTotal,
    courses,
    recentSessions,
    sessionsTotal,
    lowStudents,
    pendingCorrections,
    settings,
    loading,
    refetch: load,
  };
}
