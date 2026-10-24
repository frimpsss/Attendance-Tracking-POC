import * as React from "react";
import {
  queryAttendanceEntriesPage,
  queryStudentCourseStatsPage,
  querySystemSettings,
  queryTimetablesPage,
  subscribeToAttendanceChanges,
  useAuth,
  type DetailedAttendanceEntryRow,
  type DetailedTimetableRow,
  type StudentCourseStatsRow,
} from "@attendance/supabase";

export function useStudentCoursesList() {
  const { user } = useAuth();
  const [searchInput, setSearchInput] = React.useState("");
  const [search, setSearch] = React.useState("");
  const [items, setItems] = React.useState<StudentCourseStatsRow[]>([]);
  const [threshold, setThreshold] = React.useState(75);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    const t = setTimeout(() => setSearch(searchInput.trim()), 250);
    return () => clearTimeout(t);
  }, [searchInput]);

  const load = React.useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const [res, sys] = await Promise.all([
        queryStudentCourseStatsPage({
          page: 1,
          pageSize: 50,
          studentId: user.id,
          search,
          onlyActiveEnrollments: true,
        }),
        querySystemSettings(),
      ]);
      setItems(res.items);
      setThreshold(sys.low_attendance_threshold);
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
    threshold,
    loading,
    searchInput,
    setSearchInput,
    refetch: load,
  };
}

export function useStudentCourseDetail(courseId?: string) {
  const { user } = useAuth();
  const [courseStat, setCourseStat] = React.useState<StudentCourseStatsRow | null>(null);
  const [timetables, setTimetables] = React.useState<DetailedTimetableRow[]>([]);
  const [entries, setEntries] = React.useState<DetailedAttendanceEntryRow[]>([]);
  const [threshold, setThreshold] = React.useState(75);
  const [loading, setLoading] = React.useState(true);

  const load = React.useCallback(async () => {
    if (!user || !courseId) return;
    setLoading(true);
    try {
      const [statRes, ttRes, entRes, sys] = await Promise.all([
        queryStudentCourseStatsPage({
          page: 1,
          pageSize: 1,
          studentId: user.id,
          courseId,
          onlyActiveEnrollments: false,
        }),
        queryTimetablesPage({ page: 1, pageSize: 20, courseId }),
        queryAttendanceEntriesPage({
          page: 1,
          pageSize: 50,
          studentId: user.id,
          courseIds: [courseId],
        }),
        querySystemSettings(),
      ]);
      setCourseStat(statRes.items[0] ?? null);
      setTimetables(ttRes.items);
      setEntries(entRes.items);
      setThreshold(sys.low_attendance_threshold);
    } finally {
      setLoading(false);
    }
  }, [user, courseId]);

  React.useEffect(() => {
    void load();
    return subscribeToAttendanceChanges(() => void load());
  }, [load]);

  return {
    courseStat,
    timetables,
    entries,
    threshold,
    loading,
    refetch: load,
  };
}
