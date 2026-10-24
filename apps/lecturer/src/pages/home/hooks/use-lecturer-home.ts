import * as React from "react";
import {
  queryCorrectionsPage,
  queryCoursesPage,
  querySessionsPage,
  queryStudentCourseStatsPage,
  querySystemSettings,
  queryTimetablesPage,
  subscribeToAttendanceChanges,
  useAuth,
  type CourseSummaryRow,
  type DetailedCorrectionRow,
  type DetailedTimetableRow,
  type SessionSummaryRow,
  type StudentCourseStatsRow,
} from "@attendance/supabase";

export function useLecturerHome() {
  const { user } = useAuth();
  const [courses, setCourses] = React.useState<CourseSummaryRow[]>([]);
  const [openSessions, setOpenSessions] = React.useState<SessionSummaryRow[]>([]);
  const [recentSessions, setRecentSessions] = React.useState<SessionSummaryRow[]>([]);
  const [todayTimetables, setTodayTimetables] = React.useState<DetailedTimetableRow[]>([]);
  const [pendingCorrections, setPendingCorrections] = React.useState<DetailedCorrectionRow[]>([]);
  const [lowStudents, setLowStudents] = React.useState<StudentCourseStatsRow[]>([]);
  const [threshold, setThreshold] = React.useState(75);
  const [loading, setLoading] = React.useState(true);

  const load = React.useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const todayWeekday = new Date().getDay();
      const [crs, openSess, recSess, tt, corr, sys] = await Promise.all([
        queryCoursesPage({ page: 1, pageSize: 50, lecturerId: user.id }),
        querySessionsPage({
          page: 1,
          pageSize: 5,
          lecturerId: user.id,
          statuses: ["open"],
        }),
        querySessionsPage({
          page: 1,
          pageSize: 5,
          lecturerId: user.id,
        }),
        queryTimetablesPage({
          page: 1,
          pageSize: 20,
          lecturerId: user.id,
          weekday: todayWeekday,
        }),
        queryCorrectionsPage({
          page: 1,
          pageSize: 5,
          lecturerId: user.id,
          statuses: ["pending"],
        }),
        querySystemSettings(),
      ]);

      setCourses(crs.items);
      setOpenSessions(openSess.items);
      setRecentSessions(recSess.items);
      setTodayTimetables(tt.items);
      setPendingCorrections(corr.items);
      setThreshold(sys.low_attendance_threshold);

      const courseIds = crs.items.map((c) => c.id);
      if (courseIds.length > 0) {
        const lowRes = await queryStudentCourseStatsPage({
          page: 1,
          pageSize: 10,
          courseIds,
          maxPercentage: sys.low_attendance_threshold,
        });
        setLowStudents(lowRes.items);
      } else {
        setLowStudents([]);
      }
    } finally {
      setLoading(false);
    }
  }, [user]);

  React.useEffect(() => {
    void load();
    return subscribeToAttendanceChanges(() => void load());
  }, [load]);

  return {
    courses,
    openSessions,
    recentSessions,
    todayTimetables,
    pendingCorrections,
    lowStudents,
    threshold,
    loading,
    refetch: load,
  };
}
