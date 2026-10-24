import * as React from "react";
import {
  queryCoursesPage,
  queryDepartmentsPage,
  queryLecturersPage,
  queryPeriodsPage,
  subscribeToAttendanceChanges,
  type CourseSummaryRow,
  type LecturerSummaryRow,
} from "@attendance/supabase";
import type { AcademicPeriod, Department } from "@attendance/types";

export function useCourses() {
  const [searchInput, setSearchInput] = React.useState("");
  const [search, setSearch] = React.useState("");
  const [departmentIds, setDepartmentIds] = React.useState<string[]>([]);
  const [periodIds, setPeriodIds] = React.useState<string[]>([]);
  const [page, setPage] = React.useState(1);
  const [pageSize, setPageSize] = React.useState(10);

  const [courses, setCourses] = React.useState<CourseSummaryRow[]>([]);
  const [departments, setDepartments] = React.useState<Department[]>([]);
  const [periods, setPeriods] = React.useState<AcademicPeriod[]>([]);
  const [lecturers, setLecturers] = React.useState<LecturerSummaryRow[]>([]);
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
        const [courseRes, deptRes, perRes, lecRes] = await Promise.all([
          queryCoursesPage({ page, pageSize, search, departmentIds, periodIds }),
          queryDepartmentsPage({ page: 1, pageSize: 100 }),
          queryPeriodsPage({ page: 1, pageSize: 100 }),
          queryLecturersPage({ page: 1, pageSize: 100 }),
        ]);
        setCourses(courseRes.items);
        setTotal(courseRes.total);
        setDepartments(deptRes.items);
        setPeriods(perRes.items);
        setLecturers(lecRes.items);
      } finally {
        setIsPending(false);
        setIsFetching(false);
      }
    },
    [page, pageSize, search, departmentIds, periodIds],
  );

  React.useEffect(() => {
    void load();
    return subscribeToAttendanceChanges(() => void load(true));
  }, [load]);

  return {
    courses,
    departments,
    periods,
    lecturers,
    total,
    page,
    pageSize,
    pageCount: Math.max(1, Math.ceil(total / pageSize)),
    searchInput,
    setSearchInput,
    departmentIds,
    setDepartmentIds: (v: string[]) => {
      setDepartmentIds(v);
      setPage(1);
    },
    periodIds,
    setPeriodIds: (v: string[]) => {
      setPeriodIds(v);
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
