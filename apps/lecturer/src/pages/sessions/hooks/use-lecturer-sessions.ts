import * as React from "react";
import {
  queryCoursesPage,
  querySessionActiveCredential,
  querySessionById,
  querySessionRosterPage,
  querySessionsPage,
  querySystemSettings,
  queryTimetablesPage,
  subscribeToAttendanceChanges,
  useAuth,
  type CourseSummaryRow,
  type DetailedTimetableRow,
  type SessionRosterRow,
  type SessionSummaryRow,
} from "@attendance/supabase";
import type { AttendanceCredential, SystemSettings } from "@attendance/types";

export function useLecturerSessionsList() {
  const { user } = useAuth();
  const [searchInput, setSearchInput] = React.useState("");
  const [search, setSearch] = React.useState("");
  const [statuses, setStatuses] = React.useState<string[]>([]);
  const [dateFrom, setDateFrom] = React.useState("");
  const [dateTo, setDateTo] = React.useState("");
  const [page, setPage] = React.useState(1);
  const [pageSize, setPageSize] = React.useState(15);

  const [items, setItems] = React.useState<SessionSummaryRow[]>([]);
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
    if (!user) return;
    setLoading(true);
    try {
      const res = await querySessionsPage({
        page,
        pageSize,
        search,
        statuses,
        dateFrom: dateFrom || undefined,
        dateTo: dateTo || undefined,
        lecturerId: user.id,
      });
      setItems(res.items);
      setTotal(res.total);
    } finally {
      setLoading(false);
    }
  }, [user, page, pageSize, search, statuses, dateFrom, dateTo]);

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

export function useNewSessionFormData() {
  const { user } = useAuth();
  const [courses, setCourses] = React.useState<CourseSummaryRow[]>([]);
  const [timetables, setTimetables] = React.useState<DetailedTimetableRow[]>([]);
  const [defaultWindow, setDefaultWindow] = React.useState(30);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    if (!user) return;
    let active = true;
    void Promise.all([
      queryCoursesPage({ page: 1, pageSize: 100, lecturerId: user.id, statuses: ["active"] }),
      queryTimetablesPage({ page: 1, pageSize: 100, lecturerId: user.id }),
      querySystemSettings(),
    ]).then(([crs, tt, sys]) => {
      if (!active) return;
      setCourses(crs.items);
      setTimetables(tt.items);
      setDefaultWindow(sys.checkin_window_minutes);
      setLoading(false);
    });
    return () => {
      active = false;
    };
  }, [user]);

  return { courses, timetables, defaultWindow, loading };
}

export function useLecturerSessionDetail(sessionId?: string) {
  const [session, setSession] = React.useState<SessionSummaryRow | null>(null);
  const [credential, setCredential] = React.useState<AttendanceCredential | null>(null);
  const [roster, setRoster] = React.useState<SessionRosterRow[]>([]);
  const [totalRoster, setTotalRoster] = React.useState(0);
  const [settings, setSettings] = React.useState<SystemSettings | null>(null);
  const [loading, setLoading] = React.useState(true);

  const [searchInput, setSearchInput] = React.useState("");
  const [search, setSearch] = React.useState("");
  const [statuses, setStatuses] = React.useState<string[]>([]);

  React.useEffect(() => {
    const t = setTimeout(() => setSearch(searchInput.trim()), 200);
    return () => clearTimeout(t);
  }, [searchInput]);

  const load = React.useCallback(async () => {
    if (!sessionId) return;
    setLoading(true);
    try {
      const [sess, cred, rost, sys] = await Promise.all([
        querySessionById(sessionId),
        querySessionActiveCredential(sessionId),
        querySessionRosterPage({
          sessionId,
          page: 1,
          pageSize: 200,
          search,
          statuses,
        }),
        querySystemSettings(),
      ]);
      setSession(sess);
      setCredential(cred);
      setRoster(rost.items);
      setTotalRoster(rost.total);
      setSettings(sys);
    } finally {
      setLoading(false);
    }
  }, [sessionId, search, statuses]);

  React.useEffect(() => {
    void load();
    return subscribeToAttendanceChanges(() => void load());
  }, [load]);

  return {
    session,
    credential,
    setCredential,
    roster,
    totalRoster,
    settings,
    loading,
    searchInput,
    setSearchInput,
    statuses,
    setStatuses,
    refetch: load,
  };
}
