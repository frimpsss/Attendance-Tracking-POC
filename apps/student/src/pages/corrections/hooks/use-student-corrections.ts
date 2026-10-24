import * as React from "react";
import {
  queryAttendanceEntriesPage,
  queryCorrectionsPage,
  subscribeToAttendanceChanges,
  useAuth,
  type DetailedAttendanceEntryRow,
  type DetailedCorrectionRow,
} from "@attendance/supabase";

export function useStudentCorrections() {
  const { user } = useAuth();
  const [items, setItems] = React.useState<DetailedCorrectionRow[]>([]);
  const [eligibleEntries, setEligibleEntries] = React.useState<DetailedAttendanceEntryRow[]>([]);
  const [loading, setLoading] = React.useState(true);

  const load = React.useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const [corrRes, entRes] = await Promise.all([
        queryCorrectionsPage({
          page: 1,
          pageSize: 50,
          studentId: user.id,
        }),
        queryAttendanceEntriesPage({
          page: 1,
          pageSize: 100,
          studentId: user.id,
          onlyClosedSessions: true,
        }),
      ]);
      setItems(corrRes.items);
      setEligibleEntries(entRes.items);
    } finally {
      setLoading(false);
    }
  }, [user]);

  React.useEffect(() => {
    void load();
    return subscribeToAttendanceChanges(() => void load());
  }, [load]);

  return {
    items,
    eligibleEntries,
    loading,
    refetch: load,
  };
}
