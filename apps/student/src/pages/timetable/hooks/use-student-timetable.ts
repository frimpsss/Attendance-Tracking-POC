import * as React from "react";
import {
  queryTimetablesPage,
  subscribeToAttendanceChanges,
  useAuth,
  type DetailedTimetableRow,
} from "@attendance/supabase";

export function useStudentTimetable() {
  const { user } = useAuth();
  const [items, setItems] = React.useState<DetailedTimetableRow[]>([]);
  const [loading, setLoading] = React.useState(true);

  const load = React.useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const res = await queryTimetablesPage({
        page: 1,
        pageSize: 100,
        studentId: user.id,
      });
      setItems(res.items);
    } finally {
      setLoading(false);
    }
  }, [user]);

  React.useEffect(() => {
    void load();
    return subscribeToAttendanceChanges(() => void load());
  }, [load]);

  return { items, loading, refetch: load };
}
