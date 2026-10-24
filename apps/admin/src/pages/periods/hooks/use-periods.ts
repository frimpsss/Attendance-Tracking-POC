import * as React from "react";
import { queryPeriodsPage, subscribeToAttendanceChanges } from "@attendance/supabase";
import type { AcademicPeriod } from "@attendance/types";

export function usePeriods() {
  const [searchInput, setSearchInput] = React.useState("");
  const [search, setSearch] = React.useState("");
  const [page, setPage] = React.useState(1);
  const [pageSize, setPageSize] = React.useState(10);
  const [items, setItems] = React.useState<AcademicPeriod[]>([]);
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
        const res = await queryPeriodsPage({ page, pageSize, search });
        setItems(res.items);
        setTotal(res.total);
      } finally {
        setIsPending(false);
        setIsFetching(false);
      }
    },
    [page, pageSize, search],
  );

  React.useEffect(() => {
    void load();
    return subscribeToAttendanceChanges(() => void load(true));
  }, [load]);

  return {
    items,
    total,
    page,
    pageSize,
    pageCount: Math.max(1, Math.ceil(total / pageSize)),
    searchInput,
    setSearchInput,
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
