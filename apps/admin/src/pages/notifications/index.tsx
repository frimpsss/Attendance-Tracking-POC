import * as React from "react";
import { CheckCheck } from "lucide-react";
import { Button, EmptyState, PageHeader, Skeleton, Tabs, toast } from "@attendance/ui";
import {
  markAllNotificationsRead,
  markNotificationRead,
  useAuth,
} from "@attendance/supabase";
import { cn, formatDateTime } from "@attendance/utils";
import { useNotifications } from "./hooks/use-notifications";

export default function NotificationsPage() {
  const { user } = useAuth();
  const { items, loading, refetch } = useNotifications();
  const [tab, setTab] = React.useState("all");

  const unreadItems = React.useMemo(() => items.filter((n) => !n.is_read), [items]);
  const visibleItems = tab === "unread" ? unreadItems : items;

  const renderList = () => {
    if (loading) {
      return (
        <div className="flex flex-col gap-4">
          <Skeleton className="h-20" />
          <Skeleton className="h-20" />
          <Skeleton className="h-20" />
        </div>
      );
    }

    if (visibleItems.length === 0) {
      return (
        <EmptyState
          size="sm"
          illustration="inbox"
          title={tab === "unread" ? "All caught up" : "No notifications"}
          description={
            tab === "unread"
              ? "You have no unread notifications right now."
              : "Institution alerts and attendance updates will appear here."
          }
        />
      );
    }

    return (
      <div className="flex flex-col divide-y divide-v2-line">
        {visibleItems.map((n) => (
          <div
            key={n.id}
            onClick={async () => {
              if (!n.is_read) {
                await markNotificationRead(n.id);
                await refetch();
              }
            }}
            className={cn(
              "-mx-3 flex items-start justify-between gap-6 rounded-v2-sm px-3 py-5 transition-colors duration-v2-fast first:pt-2",
              !n.is_read && "cursor-pointer hover:bg-v2-surface",
            )}
          >
            <div className="flex min-w-0 items-start gap-3.5">
              <span
                aria-hidden
                className={cn(
                  "mt-2 size-2 shrink-0 rounded-full",
                  !n.is_read ? "bg-v2-primary" : "bg-v2-line-strong",
                )}
              />
              <div className="min-w-0">
                <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                  <p
                    className={cn(
                      "text-v2-base text-v2-ink",
                      !n.is_read ? "font-semibold" : "font-medium",
                    )}
                  >
                    {n.title}
                  </p>
                  <span className="text-v2-xs text-v2-ink-tertiary">
                    {formatDateTime(n.created_at)}
                  </span>
                </div>
                <p className="mt-1 text-v2-sm leading-relaxed text-v2-ink-secondary">
                  {n.body}
                </p>
              </div>
            </div>
            {!n.is_read && (
              <Button
                variant="ghost"
                size="sm"
                onClick={async (e) => {
                  e.stopPropagation();
                  await markNotificationRead(n.id);
                  await refetch();
                }}
              >
                Mark read
              </Button>
            )}
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        title="Notifications"
        description="Institution-wide alerts for low-attendance trends and correction requests."
        actions={
          user &&
          unreadItems.length > 0 && (
            <Button
              variant="secondary"
              size="sm"
              leadingIcon={<CheckCheck />}
              onClick={async () => {
                for (const item of unreadItems) {
                  await markNotificationRead(item.id);
                }
                await markAllNotificationsRead(user.id);
                toast.success("All notifications marked as read");
                await refetch();
              }}
            >
              Mark all read
            </Button>
          )
        }
      />

      <Tabs
        value={tab}
        onValueChange={setTab}
        contentClassName="mt-6"
        items={[
          {
            value: "all",
            label: "All Notifications",
            count: items.length || undefined,
            content: renderList(),
          },
          {
            value: "unread",
            label: "Unread",
            count: unreadItems.length || undefined,
            content: renderList(),
          },
        ]}
      />
    </div>
  );
}
