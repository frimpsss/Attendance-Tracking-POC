import * as React from "react";
import * as PopoverPrimitive from "@radix-ui/react-popover";
import { Bell } from "lucide-react";

import { cn } from "@attendance/utils";
import { Button } from "../button";
import { EmptyState } from "../empty-state";
import { floatingSurface, focusRing } from "../shared/styles";
import { SidebarAction } from "./sidebar-action";

export interface NotificationItem {
  id: string;
  title: string;
  description?: string;
  time: string;
  read?: boolean;
  icon?: React.ReactNode;
}

export interface NotificationsProps {
  items: NotificationItem[];
  onItemClick?: (item: NotificationItem) => void;
  onMarkAllRead?: () => void;
  viewAllHref?: string;
  onNavigate?: (href: string) => void;
  variant?: "icon" | "sidebar";
}

function Notifications({ items, onItemClick, onMarkAllRead, viewAllHref, onNavigate, variant = "icon" }: NotificationsProps) {
  const inSidebar = variant === "sidebar";
  const [open, setOpen] = React.useState(false);
  const [tab, setTab] = React.useState<"all" | "unread">("all");
  const unread = items.filter((item) => !item.read).length;
  const visible = tab === "unread" ? items.filter((item) => !item.read) : items;

  return (
    <PopoverPrimitive.Root open={open} onOpenChange={setOpen}>
      <PopoverPrimitive.Trigger asChild>
        {inSidebar ? (
          <SidebarAction
            icon={<Bell />}
            label="Notifications"
            aria-label={unread ? `Notifications, ${unread} unread` : "Notifications"}
            indicator={unread > 0}
            trailing={
              unread > 0 && (
                <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-v2-primary px-1.5 text-v2-2xs font-semibold leading-none tabular-nums text-v2-on-primary">
                  {unread > 9 ? "9+" : unread}
                </span>
              )
            }
          />
        ) : (
          <Button variant="ghost" size="icon-sm" aria-label={unread ? `Notifications, ${unread} unread` : "Notifications"} className="relative rounded-full">
            <Bell />
            {unread > 0 && (
              <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-v2-primary px-1 text-v2-3xs font-bold tabular-nums text-v2-on-primary ring-2 ring-v2-canvas">
                {unread > 9 ? "9+" : unread}
              </span>
            )}
          </Button>
        )}
      </PopoverPrimitive.Trigger>
      <PopoverPrimitive.Portal>
        <PopoverPrimitive.Content align="end" side={inSidebar ? "right" : "bottom"} sideOffset={inSidebar ? 12 : 8} className={cn(floatingSurface, "flex w-[380px] flex-col")}>
          <div className="flex items-center justify-between px-4 pb-2 pt-3.5">
            <p className="text-v2-md font-semibold text-v2-ink">Notifications</p>
            {onMarkAllRead && unread > 0 && (
              <Button variant="link" className="text-v2-sm no-underline hover:underline" onClick={onMarkAllRead}>
                Mark all as read
              </Button>
            )}
          </div>
          <div className="flex gap-4 border-b border-v2-line px-4">
            {(["all", "unread"] as const).map((key) => (
              <button
                key={key}
                type="button"
                data-v2
                onClick={() => setTab(key)}
                className={cn(
                  "-mb-px h-9 border-b-2 bg-transparent text-v2-ui font-medium capitalize transition-colors duration-v2-fast",
                  tab === key ? "border-v2-primary text-v2-ink" : "border-transparent text-v2-ink-tertiary hover:text-v2-ink",
                  focusRing,
                )}
              >
                {key}
                {key === "unread" && unread > 0 && <span className="ml-1.5 text-v2-primary">{unread}</span>}
              </button>
            ))}
          </div>
          <div className="max-h-[380px] overflow-y-auto p-1.5">
            {visible.length === 0 ? (
              <EmptyState size="sm" illustration="inbox" title="You’re all caught up" description="New activity will show up here." />
            ) : (
              visible.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  data-v2
                  onClick={() => {
                    setOpen(false);
                    onItemClick?.(item);
                  }}
                  className={cn(
                    "flex w-full gap-3 rounded-v2-sm bg-transparent px-2.5 py-3 text-left transition-colors duration-v2-fast hover:bg-v2-surface-hover",
                    focusRing,
                  )}
                >
                  <span
                    className={cn(
                      "flex size-9 shrink-0 items-center justify-center rounded-full [&_svg]:size-4",
                      item.read ? "bg-v2-field text-v2-ink-tertiary" : "bg-v2-primary-soft text-v2-primary",
                    )}
                  >
                    {item.icon ?? <Bell />}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-start gap-2">
                      <span className={cn("flex-1 text-v2-ui leading-[19px]", item.read ? "text-v2-ink-secondary" : "font-semibold text-v2-ink")}>
                        {item.title}
                      </span>
                      {!item.read && <span className="mt-1.5 size-2 shrink-0 rounded-full bg-v2-primary" />}
                    </span>
                    {item.description && (
                      <span className="mt-0.5 line-clamp-2 block text-v2-meta leading-[18px] text-v2-ink-tertiary">{item.description}</span>
                    )}
                    <span className="mt-1 block text-v2-2xs text-v2-ink-tertiary">{item.time}</span>
                  </span>
                </button>
              ))
            )}
          </div>
          {viewAllHref && (
            <a
              href={viewAllHref}
              data-v2
              onClick={(event) => {
                setOpen(false);
                if (!onNavigate || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
                event.preventDefault();
                onNavigate(viewAllHref);
              }}
              className="flex h-11 items-center justify-center border-t border-v2-line text-v2-ui font-semibold text-v2-primary transition-colors duration-v2-fast hover:bg-v2-primary-soft"
            >
              View all notifications
            </a>
          )}
        </PopoverPrimitive.Content>
      </PopoverPrimitive.Portal>
    </PopoverPrimitive.Root>
  );
}

export { Notifications };
