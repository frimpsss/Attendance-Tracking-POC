import * as React from "react";
import {
  queryCoursesPage,
  queryDepartmentsPage,
  queryPeriodsPage,
  queryStudentsPage,
  querySystemSettings,
  subscribeToAttendanceChanges,
  type CourseSummaryRow,
  type StudentSummaryRow,
} from "@attendance/supabase";
import type { AcademicPeriod, Department, SystemSettings } from "@attendance/types";

export function useReports() {
  const [searchInput, setSearchInput] = React.useState("");
  const [search, setSearch] = React.useState("");
  const [departmentIds, setDepartmentIds] = React.useState<string[]>([]);
  const [periodIds, setPeriodIds] = React.useState<string[]>([]);
  const [courseIds, setCourseIds] = React.useState<string[]>([]);
  const [standings, setStandings] = React.useState<string[]>([]);
  const [page, setPage] = React.useState(1);
  const [pageSize, setPageSize] = React.useState(15);

  const [students, setStudents] = React.useState<StudentSummaryRow[]>([]);
  const [studentsTotal, setStudentsTotal] = React.useState(0);
  const [courses, setCourses] = React.useState<CourseSummaryRow[]>([]);
  const [departments, setDepartments] = React.useState<Department[]>([]);
  const [periods, setPeriods] = React.useState<AcademicPeriod[]>([]);
  const [settings, setSettings] = React.useState<SystemSettings | null>(null);
  const [isPending, setIsPending] = React.useState(true);

  React.useEffect(() => {
    const t = setTimeout(() => {
      setSearch(searchInput.trim());
      setPage(1);
    }, 250);
    return () => clearTimeout(t);
  }, [searchInput]);

  const load = React.useCallback(async () => {
    setIsPending(true);
    try {
      const primaryCourseId = courseIds.length === 1 ? courseIds[0] : undefined;
      const [stuRes, courseRes, deptRes, perRes, sysRes] = await Promise.all([
        queryStudentsPage({
          page,
          pageSize,
          search,
          departmentIds,
          courseId: primaryCourseId,
        }),
        queryCoursesPage({
          page: 1,
          pageSize: 100,
          departmentIds,
          periodIds,
        }),
        queryDepartmentsPage({ page: 1, pageSize: 100 }),
        queryPeriodsPage({ page: 1, pageSize: 100 }),
        querySystemSettings(),
      ]);

      let filteredStudents = stuRes.items;
      if (standings.length === 1) {
        if (standings[0] === "below") {
          filteredStudents = filteredStudents.filter((s) => s.is_below_threshold);
        } else if (standings[0] === "good") {
          filteredStudents = filteredStudents.filter((s) => !s.is_below_threshold);
        }
      }

      setStudents(filteredStudents);
      setStudentsTotal(standings.length === 1 ? filteredStudents.length : stuRes.total);
      setCourses(courseRes.items);
      setDepartments(deptRes.items);
      setPeriods(perRes.items);
      setSettings(sysRes);
    } finally {
      setIsPending(false);
    }
  }, [page, pageSize, search, departmentIds, periodIds, courseIds, standings]);

  React.useEffect(() => {
    void load();
    return subscribeToAttendanceChanges(() => void load());
  }, [load]);

  return {
    students,
    studentsTotal,
    courses,
    departments,
    periods,
    settings,
    page,
    pageSize,
    setPage,
    setPageSize: (v: number) => {
      setPageSize(v);
      setPage(1);
    },
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
    courseIds,
    setCourseIds: (v: string[]) => {
      setCourseIds(v);
      setPage(1);
    },
    standings,
    setStandings: (v: string[]) => {
      setStandings(v);
      setPage(1);
    },
    isPending,
    refetch: load,
  };
}
