import * as React from "react";
import { cn } from "@attendance/utils";
import { focusRing } from "../shared/styles";
import { OfflineBanner } from "./offline-banner";

export interface MobileTabItem {
  key: string;
  label: string;
  href?: string;
  onClick?: () => void;
  icon: React.ReactNode;
  active?: boolean;
  badge?: number;
  badgeCount?: number;
  prominent?: boolean;
}

export interface MobileAppShellProps {
  appName?: string;
  title?: string;
  roleBadge?: string;
  userName?: string;
  subtitle?: string;
  activeTab?: string;
  headerActions?: React.ReactNode;
  headerRight?: React.ReactNode;
  tabs: MobileTabItem[];
  onNavigate?: (href: string) => void;
  children: React.ReactNode;
}

export function MobileAppShell({
  appName,
  title,
  roleBadge,
  userName,
  subtitle,
  activeTab,
  headerActions,
  headerRight,
  tabs,
  onNavigate,
  children,
}: MobileAppShellProps) {
  const resolvedTitle = appName ?? title ?? "Attendance";
  const resolvedSubtitle = userName ?? subtitle;
  const resolvedRight = headerActions ?? headerRight;

  return (
    <div
      data-v2
      className="font-v2 flex min-h-dvh flex-col bg-v2-canvas text-v2-ink"
    >
      <OfflineBanner />

      <header className="sticky top-0 z-v2-sticky bg-v2-canvas/95 backdrop-blur">
        <div className="mx-auto flex h-16 w-full max-w-2xl items-center justify-between gap-3 px-4 sm:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex size-8 shrink-0 items-center justify-center rounded-v2-sm bg-v2-primary text-v2-sm font-bold text-v2-on-primary">
              {resolvedTitle.slice(0, 1).toUpperCase()}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="truncate text-v2-base font-semibold leading-tight text-v2-ink">
                  {resolvedTitle}
                </span>
                {roleBadge && (
                  <span className="rounded-v2-xs bg-v2-primary-soft px-1.5 py-0.5 text-v2-2xs font-semibold uppercase tracking-wide text-v2-primary">
                    {roleBadge}
                  </span>
                )}
              </div>
              {resolvedSubtitle && (
                <p className="truncate text-v2-xs text-v2-ink-tertiary">
                  {resolvedSubtitle}
                </p>
              )}
            </div>
          </div>
          {resolvedRight && (
            <div className="flex shrink-0 items-center gap-1.5">{resolvedRight}</div>
          )}
        </div>
      </header>

      <main className="mx-auto w-full max-w-2xl flex-1 px-4 pb-28 pt-4 sm:px-6 sm:pt-6">
        {children}
      </main>

      <nav
        aria-label="Primary Bottom Navigation"
        className="fixed inset-x-0 bottom-0 z-v2-sticky border-t border-v2-line bg-v2-canvas/95 backdrop-blur"
        style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
      >
        <div className="mx-auto grid h-16 max-w-2xl grid-cols-5 items-center gap-1 px-2">
          {tabs.map((tab) => {
            const active =
              typeof tab.active === "boolean" ? tab.active : activeTab === tab.key;
            const badge = tab.badge ?? tab.badgeCount ?? 0;

            return (
              <button
                key={tab.key}
                type="button"
                data-v2
                data-press="sm"
                onClick={() => {
                  if (tab.onClick) {
                    tab.onClick();
                  } else if (tab.href && onNavigate) {
                    onNavigate(tab.href);
                  }
                }}
                className={cn(
                  "relative flex h-12 flex-col items-center justify-center gap-1 rounded-v2-sm px-1 transition-colors duration-v2-fast",
                  tab.prominent
                    ? active
                      ? "bg-v2-primary text-v2-on-primary"
                      : "bg-v2-primary-soft text-v2-primary hover:bg-v2-primary-soft-hover"
                    : active
                      ? "font-semibold text-v2-primary"
                      : "text-v2-ink-tertiary hover:bg-v2-surface-hover hover:text-v2-ink",
                  focusRing,
                )}
              >
                <span className="relative flex items-center justify-center [&_svg]:size-[19px]">
                  {tab.icon}
                  {badge > 0 && (
                    <span className="absolute -right-2.5 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-v2-danger px-1 text-[10px] font-bold leading-none text-white">
                      {badge > 99 ? "99+" : badge}
                    </span>
                  )}
                </span>
                <span className="truncate text-v2-2xs font-semibold leading-none">
                  {tab.label}
                </span>
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
