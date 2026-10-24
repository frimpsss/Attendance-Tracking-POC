import * as React from "react";
import {
  queryCorrectionById,
  queryCorrectionsPage,
  subscribeToAttendanceChanges,
  useAuth,
  type DetailedCorrectionRow,
} from "@attendance/supabase";

export function useLecturerCorrectionsList() {
  const { user } = useAuth();
  const [searchInput, setSearchInput] = React.useState("");
  const [search, setSearch] = React.useState("");
  const [statuses, setStatuses] = React.useState<string[]>([]);
  const [items, setItems] = React.useState<DetailedCorrectionRow[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    const t = setTimeout(() => setSearch(searchInput.trim()), 250);
    return () => clearTimeout(t);
  }, [searchInput]);

  const load = React.useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const res = await queryCorrectionsPage({
        page: 1,
        pageSize: 50,
        lecturerId: user.id,
        search,
        statuses,
      });
      setItems(res.items);
    } finally {
      setLoading(false);
    }
  }, [user, search, statuses]);

  React.useEffect(() => {
    void load();
    return subscribeToAttendanceChanges(() => void load());
  }, [load]);

  return {
    items,
    loading,
    searchInput,
    setSearchInput,
    statuses,
    setStatuses,
    refetch: load,
  };
}

export function useLecturerCorrectionDetail(id?: string) {
  const [item, setItem] = React.useState<DetailedCorrectionRow | null>(null);
  const [loading, setLoading] = React.useState(true);

  const load = React.useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      const res = await queryCorrectionById(id);
      setItem(res);
    } finally {
      setLoading(false);
    }
  }, [id]);

  React.useEffect(() => {
    void load();
    return subscribeToAttendanceChanges(() => void load());
  }, [load]);

  return { item, loading, refetch: load };
}
