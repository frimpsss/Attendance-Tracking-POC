import * as React from "react";
import {
  queryAttendanceEntriesPage,
  queryStudentById,
  queryStudentCourseStatsPage,
  subscribeToAttendanceChanges,
  useAuth,
  type DetailedAttendanceEntryRow,
  type StudentCourseStatsRow,
  type StudentSummaryRow,
} from "@attendance/supabase";

export function useStudentHistory() {
  const { user } = useAuth();
  const [student, setStudent] = React.useState<StudentSummaryRow | null>(null);
  const [courses, setCourses] = React.useState<StudentCourseStatsRow[]>([]);
  const [items, setItems] = React.useState<DetailedAttendanceEntryRow[]>([]);
  const [total, setTotal] = React.useState(0);
  const [loading, setLoading] = React.useState(true);

  const [searchInput, setSearchInput] = React.useState("");
  const [search, setSearch] = React.useState("");
  const [courseIds, setCourseIds] = React.useState<string[]>([]);
  const [statuses, setStatuses] = React.useState<string[]>([]);
  const [dateFrom, setDateFrom] = React.useState("");
  const [dateTo, setDateTo] = React.useState("");
  const [page, setPage] = React.useState(1);
  const [pageSize, setPageSize] = React.useState(15);

  React.useEffect(() => {
    const t = setTimeout(() => {
      setSearch(searchInput.trim());
      setPage(1);
    }, 250);
    return () => clearTimeout(t);
  }, [searchInput]);

  const load = React.useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const [stu, crs, ent] = await Promise.all([
        queryStudentById(user.id),
        queryStudentCourseStatsPage({
          page: 1,
          pageSize: 50,
          studentId: user.id,
          onlyActiveEnrollments: false,
        }),
        queryAttendanceEntriesPage({
          page,
          pageSize,
          studentId: user.id,
          search,
          courseIds,
          statuses,
          dateFrom: dateFrom ? `${dateFrom}T00:00:00Z` : undefined,
          dateTo: dateTo ? `${dateTo}T23:59:59Z` : undefined,
        }),
      ]);
      setStudent(stu);
      setCourses(crs.items);
      setItems(ent.items);
      setTotal(ent.total);
    } finally {
      setLoading(false);
    }
  }, [user, page, pageSize, search, courseIds, statuses, dateFrom, dateTo]);

  React.useEffect(() => {
    void load();
    return subscribeToAttendanceChanges(() => void load());
  }, [load]);

  return {
    student,
    courses,
    items,
    total,
    loading,
    searchInput,
    setSearchInput,
    courseIds,
    setCourseIds: (v: string[]) => {
      setCourseIds(v);
      setPage(1);
    },
    statuses,
    setStatuses: (v: string[]) => {
      setStatuses(v);
      setPage(1);
    },
    dateFrom,
    setDateFrom: (v: string) => {
      setDateFrom(v);
      setPage(1);
    },
    dateTo,
    setDateTo: (v: string) => {
      setDateTo(v);
      setPage(1);
    },
    page,
    setPage,
    pageSize,
    setPageSize,
    pageCount: Math.max(1, Math.ceil(total / pageSize)),
    refetch: load,
  };
}
