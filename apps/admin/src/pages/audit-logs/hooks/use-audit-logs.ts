import * as React from "react";
import {
  queryAuditLogsPage,
  subscribeToAttendanceChanges,
  type DetailedAuditLogRow,
} from "@attendance/supabase";

export function useAuditLogs() {
  const [searchInput, setSearchInput] = React.useState("");
  const [search, setSearch] = React.useState("");
  const [entityTypes, setEntityTypes] = React.useState<string[]>([]);
  const [page, setPage] = React.useState(1);
  const [pageSize, setPageSize] = React.useState(15);

  const [items, setItems] = React.useState<DetailedAuditLogRow[]>([]);
  const [total, setTotal] = React.useState(0);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    const t = setTimeout(() => {
      setSearch(searchInput.trim());
      setPage(1);
    }, 250);
    return () => clearTimeout(t);
  }, [searchInput]);

  const load = React.useCallback(async () => {
    setLoading(true);
    try {
      const res = await queryAuditLogsPage({
        page,
        pageSize,
        search,
        entityTypes,
      });
      setItems(res.items);
      setTotal(res.total);
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, search, entityTypes]);

  React.useEffect(() => {
    void load();
    return subscribeToAttendanceChanges(() => void load());
  }, [load]);

  return {
    items,
    total,
    loading,
    searchInput,
    setSearchInput,
    entityTypes,
    setEntityTypes: (v: string[]) => {
      setEntityTypes(v);
      setPage(1);
    },
    page,
    setPage,
    pageSize,
    setPageSize: (v: number) => {
      setPageSize(v);
      setPage(1);
    },
    pageCount: Math.max(1, Math.ceil(total / pageSize)),
    refetch: load,
  };
}
