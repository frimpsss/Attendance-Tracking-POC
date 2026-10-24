import * as React from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";

import { cn } from "@attendance/utils";
import { overlay } from "../shared/styles";
import { Sidebar, type SidebarProps } from "./sidebar";
import { Topbar, type TopbarProps } from "./topbar";

export interface AppShellProps {
  sidebar: Omit<SidebarProps, "collapsed" | "onCollapsedChange">;
  topbar?: Omit<TopbarProps, "onMenuClick">;
  collapsible?: boolean;
  defaultCollapsed?: boolean;
  contentClassName?: string;
  scrollRef?: React.Ref<HTMLDivElement>;
  children: React.ReactNode;
}

function AppShell({ sidebar, topbar, collapsible = true, defaultCollapsed = false, contentClassName, scrollRef, children }: AppShellProps) {
  const [collapsed, setCollapsed] = React.useState(defaultCollapsed);
  const [mobileOpen, setMobileOpen] = React.useState(false);

  return (
    <div data-v2 className="font-v2 relative flex h-full min-h-0 overflow-hidden bg-v2-canvas text-v2-ink">
      <div className="hidden h-full shrink-0 lg:block">
        <Sidebar {...sidebar} collapsed={collapsed} onCollapsedChange={collapsible ? setCollapsed : undefined} />
      </div>
      <DialogPrimitive.Root open={mobileOpen} onOpenChange={setMobileOpen}>
        <DialogPrimitive.Portal>
          <DialogPrimitive.Overlay className={overlay} />
          <DialogPrimitive.Content
            aria-describedby={undefined}
            className="fixed inset-y-0 left-0 z-v2-overlay outline-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:slide-out-to-left data-[state=open]:slide-in-from-left"
            onClick={(event) => (event.target as HTMLElement).closest("a") && setMobileOpen(false)}
          >
            <DialogPrimitive.Title className="sr-only">Navigation</DialogPrimitive.Title>
            <Sidebar {...sidebar} />
          </DialogPrimitive.Content>
        </DialogPrimitive.Portal>
      </DialogPrimitive.Root>
      <div className="flex min-w-0 flex-1 flex-col">
        <div ref={scrollRef} className="relative flex min-h-0 flex-1 flex-col overflow-y-auto">
          {topbar ? (
            <Topbar {...topbar} onMenuClick={() => setMobileOpen(true)} />
          ) : (
            <Topbar leading={sidebar.logo} onMenuClick={() => setMobileOpen(true)} className="lg:hidden" />
          )}
          <main className={cn("mx-auto w-full max-w-v2-page flex-1 px-6 pb-12 pt-4 sm:px-10 sm:pb-16 sm:pt-6", contentClassName)}>{children}</main>
        </div>
      </div>
    </div>
  );
}

export { AppShell };
