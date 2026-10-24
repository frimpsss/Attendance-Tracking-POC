import * as React from "react";
import { CheckCheck } from "lucide-react";
import { Button, EmptyState, Skeleton, Tabs, toast } from "@attendance/ui";
import {
  markAllNotificationsRead,
  markNotificationRead,
  queryNotificationsPage,
  subscribeToAttendanceChanges,
  useAuth,
} from "@attendance/supabase";
import type { AppNotification } from "@attendance/types";
import { formatDateTime } from "@attendance/utils";

export default function LecturerNotificationsPage() {
  const { user } = useAuth();
  const [items, setItems] = React.useState<AppNotification[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [tab, setTab] = React.useState<"all" | "unread">("all");

  const load = React.useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const res = await queryNotificationsPage({
        page: 1,
        pageSize: 50,
        recipientId: user.id,
        unreadOnly: tab === "unread",
      });
      setItems(res.items);
    } finally {
      setLoading(false);
    }
  }, [user, tab]);

  React.useEffect(() => {
    void load();
    return subscribeToAttendanceChanges(() => void load());
  }, [load]);

  const unreadCount = items.filter((n) => !n.is_read).length;

  return (
    <div className="flex flex-col gap-6 py-2">
      <div className="flex items-center justify-between gap-2">
        <div>
          <h1 className="text-v2-xl font-bold tracking-tight text-v2-ink">Notifications</h1>
          <p className="mt-1 text-v2-sm text-v2-ink-secondary">
            Correction requests and course attendance alerts.
          </p>
        </div>
        {user && unreadCount > 0 && (
          <Button
            variant="secondary"
            size="sm"
            leadingIcon={<CheckCheck />}
            onClick={async () => {
              await markAllNotificationsRead(user.id);
              toast.success("All notifications marked as read");
              await load();
            }}
          >
            Mark all read
          </Button>
        )}
      </div>

      <Tabs
        value={tab}
        onValueChange={(v) => setTab(v as "all" | "unread")}
        items={[
          { value: "all", label: "All" },
          { value: "unread", label: "Unread" },
        ]}
      />

      {loading ? (
        <div className="flex flex-col gap-3">
          {Array.from({ length: 3 }).map((_, idx) => (
            <div key={idx} className="rounded-v2-lg bg-v2-surface p-4">
              <Skeleton className="h-16 w-full" />
            </div>
          ))}
        </div>
      ) : items.length === 0 ? (
        <EmptyState size="sm" illustration="inbox" title="No notifications" />
      ) : (
        <div className="flex flex-col divide-y divide-v2-line rounded-v2-lg bg-v2-surface px-4">
          {items.map((n) => (
            <div
              key={n.id}
              className="flex items-start justify-between gap-3 py-4"
            >
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  {!n.is_read && (
                    <span className="h-2 w-2 shrink-0 rounded-full bg-v2-primary" />
                  )}
                  <p className="font-semibold text-v2-ink">{n.title}</p>
                </div>
                <p className="mt-1 text-v2-sm text-v2-ink-secondary">{n.body}</p>
                <p className="mt-1 text-v2-xs text-v2-ink-tertiary">
                  {formatDateTime(n.created_at)}
                </p>
              </div>
              {!n.is_read && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={async () => {
                    await markNotificationRead(n.id);
                    await load();
                  }}
                >
                  Read
                </Button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
