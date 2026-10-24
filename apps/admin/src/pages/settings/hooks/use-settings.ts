import * as React from "react";
import {
  querySystemSettings,
  queryUsersAccessPage,
  subscribeToAttendanceChanges,
  type UserAccessRow,
} from "@attendance/supabase";
import type { SystemSettings } from "@attendance/types";

const DEFAULT_SETTINGS: SystemSettings = {
  id: 1,
  low_attendance_threshold: 75,
  late_grace_minutes: 10,
  checkin_window_minutes: 30,
  qr_enabled: true,
  code_enabled: true,
  manual_enabled: true,
  timezone: "Africa/Accra",
  updated_at: new Date().toISOString(),
};

export function useSettings() {
  const [settings, setSettings] = React.useState<SystemSettings>(DEFAULT_SETTINGS);
  const [searchInput, setSearchInput] = React.useState("");
  const [search, setSearch] = React.useState("");
  const [roles, setRoles] = React.useState<string[]>([]);
  const [page, setPage] = React.useState(1);
  const [pageSize, setPageSize] = React.useState(10);

  const [users, setUsers] = React.useState<UserAccessRow[]>([]);
  const [totalUsers, setTotalUsers] = React.useState(0);
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
      const [sys, usr] = await Promise.all([
        querySystemSettings(),
        queryUsersAccessPage({ page, pageSize, search, roles }),
      ]);
      setSettings(sys);
      setUsers(usr.items);
      setTotalUsers(usr.total);
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, search, roles]);

  React.useEffect(() => {
    void load();
    return subscribeToAttendanceChanges(() => void load());
  }, [load]);

  return {
    settings,
    users,
    totalUsers,
    loading,
    searchInput,
    setSearchInput,
    roles,
    setRoles: (v: string[]) => {
      setRoles(v);
      setPage(1);
    },
    page,
    setPage,
    pageSize,
    setPageSize: (v: number) => {
      setPageSize(v);
      setPage(1);
    },
    pageCount: Math.max(1, Math.ceil(totalUsers / pageSize)),
    refetch: load,
  };
}
