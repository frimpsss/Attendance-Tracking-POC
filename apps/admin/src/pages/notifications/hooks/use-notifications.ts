import * as React from "react";
import {
  queryNotificationsPage,
  subscribeToAttendanceChanges,
} from "@attendance/supabase";
import type { AppNotification } from "@attendance/types";

export function useNotifications(recipientId?: string) {
  const [items, setItems] = React.useState<AppNotification[]>([]);
  const [loading, setLoading] = React.useState(true);

  const load = React.useCallback(async () => {
    setLoading(true);
    try {
      const res = await queryNotificationsPage({
        page: 1,
        pageSize: 50,
        recipientId,
      });
      setItems(res.items);
    } finally {
      setLoading(false);
    }
  }, [recipientId]);

  React.useEffect(() => {
    void load();
    return subscribeToAttendanceChanges(() => void load());
  }, [load]);

  return { items, loading, refetch: load };
}
