import * as React from "react";
import {
  queryAttendanceEntriesPage,
  querySessionsPage,
  queryStudentById,
  queryStudentCourseStatsPage,
  querySystemSettings,
  queryTimetablesPage,
  subscribeToAttendanceChanges,
  useAuth,
  type DetailedAttendanceEntryRow,
  type DetailedTimetableRow,
  type SessionSummaryRow,
  type StudentCourseStatsRow,
  type StudentSummaryRow,
} from "@attendance/supabase";

export function useStudentHome() {
  const { user } = useAuth();
  const [student, setStudent] = React.useState<StudentSummaryRow | null>(null);
  const [courseStats, setCourseStats] = React.useState<StudentCourseStatsRow[]>([]);
  const [openSessions, setOpenSessions] = React.useState<SessionSummaryRow[]>([]);
  const [todayTimetables, setTodayTimetables] = React.useState<DetailedTimetableRow[]>([]);
  const [recentEntries, setRecentEntries] = React.useState<DetailedAttendanceEntryRow[]>([]);
  const [threshold, setThreshold] = React.useState(75);
  const [loading, setLoading] = React.useState(true);

  const load = React.useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const todayWeekday = new Date().getDay();
      const [stu, cStats, openSess, tt, recEnt, sys] = await Promise.all([
        queryStudentById(user.id),
        queryStudentCourseStatsPage({
          page: 1,
          pageSize: 50,
          studentId: user.id,
          onlyActiveEnrollments: true,
        }),
        querySessionsPage({
          page: 1,
          pageSize: 10,
          studentId: user.id,
          statuses: ["open"],
        }),
        queryTimetablesPage({
          page: 1,
          pageSize: 20,
          studentId: user.id,
          weekday: todayWeekday,
        }),
        queryAttendanceEntriesPage({
          page: 1,
          pageSize: 5,
          studentId: user.id,
        }),
        querySystemSettings(),
      ]);

      setStudent(stu);
      setCourseStats(cStats.items);
      setOpenSessions(openSess.items);
      setTodayTimetables(tt.items);
      setRecentEntries(recEnt.items);
      setThreshold(sys.low_attendance_threshold);
    } finally {
      setLoading(false);
    }
  }, [user]);

  React.useEffect(() => {
    void load();
    return subscribeToAttendanceChanges(() => void load());
  }, [load]);

  return {
    student,
    courseStats,
    openSessions,
    todayTimetables,
    recentEntries,
    threshold,
    loading,
    refetch: load,
  };
}
