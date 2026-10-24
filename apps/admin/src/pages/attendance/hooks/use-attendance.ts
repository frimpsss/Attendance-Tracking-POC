import * as React from "react";
import {
  queryAttendanceEntriesPage,
  queryCorrectionsPage,
  queryCoursesPage,
  queryDepartmentsPage,
  querySessionsPage,
  subscribeToAttendanceChanges,
  type CourseSummaryRow,
  type DetailedAttendanceEntryRow,
  type DetailedCorrectionRow,
  type SessionSummaryRow,
} from "@attendance/supabase";
import type { Department } from "@attendance/types";

export function useAttendanceExplorer() {
  const [searchInput, setSearchInput] = React.useState("");
  const [search, setSearch] = React.useState("");
  const [courseIds, setCourseIds] = React.useState<string[]>([]);
  const [departmentIds, setDepartmentIds] = React.useState<string[]>([]);
  const [statuses, setStatuses] = React.useState<string[]>([]);
  const [dateFrom, setDateFrom] = React.useState("");
  const [dateTo, setDateTo] = React.useState("");
  const [page, setPage] = React.useState(1);
  const [pageSize, setPageSize] = React.useState(10);

  const [sessions, setSessions] = React.useState<SessionSummaryRow[]>([]);
  const [sessionsTotal, setSessionsTotal] = React.useState(0);
  const [entries, setEntries] = React.useState<DetailedAttendanceEntryRow[]>([]);
  const [entriesTotal, setEntriesTotal] = React.useState(0);
  const [corrections, setCorrections] = React.useState<DetailedCorrectionRow[]>([]);
  const [correctionsTotal, setCorrectionsTotal] = React.useState(0);

  const [courses, setCourses] = React.useState<CourseSummaryRow[]>([]);
  const [departments, setDepartments] = React.useState<Department[]>([]);
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
        const [sessRes, entRes, corrRes, cRes, dRes] = await Promise.all([
          querySessionsPage({
            page,
            pageSize,
            search,
            courseIds,
            departmentIds,
            statuses,
            dateFrom: dateFrom || undefined,
            dateTo: dateTo || undefined,
          }),
          queryAttendanceEntriesPage({
            page,
            pageSize,
            search,
            courseIds,
            departmentIds,
            statuses,
            dateFrom: dateFrom || undefined,
            dateTo: dateTo || undefined,
          }),
          queryCorrectionsPage({
            page,
            pageSize,
            search,
            courseIds,
          }),
          queryCoursesPage({ page: 1, pageSize: 100 }),
          queryDepartmentsPage({ page: 1, pageSize: 100 }),
        ]);

        setSessions(sessRes.items);
        setSessionsTotal(sessRes.total);
        setEntries(entRes.items);
        setEntriesTotal(entRes.total);
        setCorrections(corrRes.items);
        setCorrectionsTotal(corrRes.total);
        setCourses(cRes.items);
        setDepartments(dRes.items);
      } finally {
        setIsPending(false);
        setIsFetching(false);
      }
    },
    [page, pageSize, search, courseIds, departmentIds, statuses, dateFrom, dateTo],
  );

  React.useEffect(() => {
    void load();
    return subscribeToAttendanceChanges(() => void load(true));
  }, [load]);

  return {
    sessions,
    sessionsTotal,
    entries,
    entriesTotal,
    corrections,
    correctionsTotal,
    courses,
    departments,
    page,
    pageSize,
    setPage,
    setPageSize: (v: number) => {
      setPageSize(v);
      setPage(1);
    },
    searchInput,
    setSearchInput,
    courseIds,
    setCourseIds: (v: string[]) => {
      setCourseIds(v);
      setPage(1);
    },
    departmentIds,
    setDepartmentIds: (v: string[]) => {
      setDepartmentIds(v);
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
    isPending,
    isFetching,
    refetch: () => load(false),
  };
}
