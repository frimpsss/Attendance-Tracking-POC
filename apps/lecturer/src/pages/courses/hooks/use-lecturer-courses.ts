import * as React from "react";
import {
  queryCourseById,
  queryCoursesPage,
  querySessionsPage,
  queryStudentCourseStatsPage,
  querySystemSettings,
  queryTimetablesPage,
  subscribeToAttendanceChanges,
  useAuth,
  type CourseSummaryRow,
  type DetailedTimetableRow,
  type SessionSummaryRow,
  type StudentCourseStatsRow,
} from "@attendance/supabase";

export function useLecturerCoursesList() {
  const { user } = useAuth();
  const [searchInput, setSearchInput] = React.useState("");
  const [search, setSearch] = React.useState("");
  const [items, setItems] = React.useState<CourseSummaryRow[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    const t = setTimeout(() => setSearch(searchInput.trim()), 250);
    return () => clearTimeout(t);
  }, [searchInput]);

  const load = React.useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const res = await queryCoursesPage({
        page: 1,
        pageSize: 50,
        lecturerId: user.id,
        search,
      });
      setItems(res.items);
    } finally {
      setLoading(false);
    }
  }, [user, search]);

  React.useEffect(() => {
    void load();
    return subscribeToAttendanceChanges(() => void load());
  }, [load]);

  return {
    items,
    loading,
    searchInput,
    setSearchInput,
    refetch: load,
  };
}

export function useLecturerCourseDetail(courseId?: string) {
  const [course, setCourse] = React.useState<CourseSummaryRow | null>(null);
  const [timetables, setTimetables] = React.useState<DetailedTimetableRow[]>([]);
  const [sessions, setSessions] = React.useState<SessionSummaryRow[]>([]);
  const [roster, setRoster] = React.useState<StudentCourseStatsRow[]>([]);
  const [totalRoster, setTotalRoster] = React.useState(0);
  const [threshold, setThreshold] = React.useState(75);
  const [loading, setLoading] = React.useState(true);

  const [searchInput, setSearchInput] = React.useState("");
  const [search, setSearch] = React.useState("");
  const [page, setPage] = React.useState(1);
  const [pageSize, setPageSize] = React.useState(20);

  React.useEffect(() => {
    const t = setTimeout(() => {
      setSearch(searchInput.trim());
      setPage(1);
    }, 250);
    return () => clearTimeout(t);
  }, [searchInput]);

  const load = React.useCallback(async () => {
    if (!courseId) return;
    setLoading(true);
    try {
      const [crs, tt, sess, rost, sys] = await Promise.all([
        queryCourseById(courseId),
        queryTimetablesPage({ page: 1, pageSize: 20, courseId }),
        querySessionsPage({ page: 1, pageSize: 50, courseIds: [courseId] }),
        queryStudentCourseStatsPage({
          page,
          pageSize,
          courseId,
          search,
          onlyActiveEnrollments: true,
        }),
        querySystemSettings(),
      ]);
      setCourse(crs);
      setTimetables(tt.items);
      setSessions(sess.items);
      setRoster(rost.items);
      setTotalRoster(rost.total);
      setThreshold(sys.low_attendance_threshold);
    } finally {
      setLoading(false);
    }
  }, [courseId, page, pageSize, search]);

  React.useEffect(() => {
    void load();
    return subscribeToAttendanceChanges(() => void load());
  }, [load]);

  return {
    course,
    timetables,
    sessions,
    roster,
    totalRoster,
    threshold,
    loading,
    searchInput,
    setSearchInput,
    page,
    setPage,
    pageSize,
    setPageSize,
    pageCount: Math.max(1, Math.ceil(totalRoster / pageSize)),
    refetch: load,
  };
}
