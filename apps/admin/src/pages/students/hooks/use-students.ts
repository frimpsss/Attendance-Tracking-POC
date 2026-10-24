import * as React from "react";
import {
  queryDepartmentsPage,
  queryStudentsPage,
  subscribeToAttendanceChanges,
  type StudentSummaryRow,
} from "@attendance/supabase";
import type { Department } from "@attendance/types";

export function useStudents() {
  const [searchInput, setSearchInput] = React.useState("");
  const [search, setSearch] = React.useState("");
  const [departmentIds, setDepartmentIds] = React.useState<string[]>([]);
  const [statuses, setStatuses] = React.useState<string[]>([]);
  const [page, setPage] = React.useState(1);
  const [pageSize, setPageSize] = React.useState(10);

  const [students, setStudents] = React.useState<StudentSummaryRow[]>([]);
  const [departments, setDepartments] = React.useState<Department[]>([]);
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
        const [stuRes, deptRes] = await Promise.all([
          queryStudentsPage({
            page,
            pageSize,
            search,
            departmentIds,
            statuses,
          }),
          queryDepartmentsPage({ page: 1, pageSize: 100 }),
        ]);
        setStudents(stuRes.items);
        setTotal(stuRes.total);
        setDepartments(deptRes.items);
      } finally {
        setIsPending(false);
        setIsFetching(false);
      }
    },
    [page, pageSize, search, departmentIds, statuses],
  );

  React.useEffect(() => {
    void load();
    return subscribeToAttendanceChanges(() => void load(true));
  }, [load]);

  return {
    students,
    departments,
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
    statuses,
    setStatuses: (v: string[]) => {
      setStatuses(v);
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

export type StudentsListState = ReturnType<typeof useStudents>;
