import * as React from "react";
import {
  queryCoursesPage,
  queryLecturersPage,
  queryStudentsPage,
  queryTimetablesPage,
  subscribeToAttendanceChanges,
  type CourseSummaryRow,
  type DetailedTimetableRow,
  type LecturerSummaryRow,
  type StudentSummaryRow,
} from "@attendance/supabase";

export function useTimetable() {
  const [searchInput, setSearchInput] = React.useState("");
  const [search, setSearch] = React.useState("");
  const [courseId, setCourseId] = React.useState<string>("");
  const [lecturerId, setLecturerId] = React.useState<string>("");
  const [studentId, setStudentId] = React.useState<string>("");
  const [page, setPage] = React.useState(1);
  const [pageSize, setPageSize] = React.useState(200);

  const [items, setItems] = React.useState<DetailedTimetableRow[]>([]);
  const [courses, setCourses] = React.useState<CourseSummaryRow[]>([]);
  const [lecturers, setLecturers] = React.useState<LecturerSummaryRow[]>([]);
  const [students, setStudents] = React.useState<StudentSummaryRow[]>([]);
  const [total, setTotal] = React.useState(0);
  const [isPending, setIsPending] = React.useState(true);
  const [isFetching, setIsFetching] = React.useState(false);

  React.useEffect(() => {
    const t = setTimeout(() => {
      setSearch(searchInput.trim());
      setPage(1);
    }, 250);
    return () => clearTimeout(t);
  }, [searchInput]);

  const load = React.useCallback(
    async (silent = false) => {
      if (!silent) setIsFetching(true);
      try {
        const [ttRes, cRes, lRes, sRes] = await Promise.all([
          queryTimetablesPage({
            page,
            pageSize,
            search,
            courseId: courseId || undefined,
            lecturerId: lecturerId || undefined,
            studentId: studentId || undefined,
          }),
          queryCoursesPage({ page: 1, pageSize: 100 }),
          queryLecturersPage({ page: 1, pageSize: 100 }),
          queryStudentsPage({ page: 1, pageSize: 100 }),
        ]);
        setItems(ttRes.items);
        setTotal(ttRes.total);
        setCourses(cRes.items);
        setLecturers(lRes.items);
        setStudents(sRes.items);
      } finally {
        setIsPending(false);
        setIsFetching(false);
      }
    },
    [page, pageSize, search, courseId, lecturerId, studentId],
  );

  React.useEffect(() => {
    void load();
    return subscribeToAttendanceChanges(() => void load(true));
  }, [load]);

  return {
    items,
    courses,
    lecturers,
    students,
    total,
    page,
    pageSize,
    pageCount: Math.max(1, Math.ceil(total / pageSize)),
    searchInput,
    setSearchInput,
    courseId,
    setCourseId: (v: string) => {
      setCourseId(v);
      setPage(1);
    },
    lecturerId,
    setLecturerId: (v: string) => {
      setLecturerId(v);
      setPage(1);
    },
    studentId,
    setStudentId: (v: string) => {
      setStudentId(v);
      setPage(1);
    },
    setPage,
    setPageSize: (v: number) => {
      setPageSize(v);
      setPage(1);
    },
    isPending,
    isFetching,
    refetch: () => load(false),
  };
}
