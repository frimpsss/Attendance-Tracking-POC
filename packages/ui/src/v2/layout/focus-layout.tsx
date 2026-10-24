import * as React from "react";
import { PanelRightClose, PanelRightOpen, X } from "lucide-react";

import { cn } from "@attendance/utils";
import { Button } from "../button";

const widths = {
  sm: "max-w-xl",
  md: "max-w-3xl",
  lg: "max-w-5xl",
  xl: "max-w-6xl",
  full: "max-w-none",
} as const;

export interface FocusLayoutProps {
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  status?: React.ReactNode;
  onBack?: () => void;
  onClose?: () => void;
  actions?: React.ReactNode;
  footer?: React.ReactNode;
  width?: keyof typeof widths;
  aside?: React.ReactNode;
  split?: "narrow" | "half" | "wide";
  asideTone?: "field" | "canvas";
  asideTitle?: string;
  asideActions?: React.ReactNode;
  asideOpen?: boolean;
  defaultAsideOpen?: boolean;
  onAsideOpenChange?: (open: boolean) => void;
  className?: string;
  contentClassName?: string;
  children: React.ReactNode;
}

function FocusLayout({
  title,
  subtitle,
  status,
  onBack,
  onClose,
  actions,
  footer,
  width = "md",
  aside,
  split = "narrow",
  asideTone = "field",
  asideTitle = "Preview",
  asideActions,
  asideOpen,
  defaultAsideOpen = true,
  onAsideOpenChange,
  className,
  contentClassName,
  children,
}: FocusLayoutProps) {
  const [internalOpen, setInternalOpen] = React.useState(defaultAsideOpen);
  const exit = onClose ?? onBack;
  const open = asideOpen ?? internalOpen;
  const setOpen = (next: boolean) => {
    setInternalOpen(next);
    onAsideOpenChange?.(next);
  };

  return (
    <div data-v2 className={cn("font-v2 relative flex h-full flex-col overflow-hidden bg-v2-canvas text-v2-ink", className)}>
      <header className="z-v2-sticky shrink-0 border-b border-v2-line bg-v2-canvas">
        <div className="flex h-16 items-center gap-3 px-4 sm:px-6">
          {exit && (
            <Button variant="ghost" size="icon-sm" aria-label="Close" onClick={exit}>
              <X />
            </Button>
          )}
          <div className="min-w-0 flex-1">
            <div className="flex min-w-0 items-center gap-2">
              <p className="truncate text-v2-md font-semibold leading-[22px]">{title}</p>
              {status && <div className="flex shrink-0 items-center">{status}</div>}
            </div>
            {subtitle && <p className="truncate text-v2-meta text-v2-ink-tertiary">{subtitle}</p>}
          </div>
          {actions}
          {aside && (
            <Button
              variant={open ? "soft" : "secondary"}
              size="sm"
              aria-pressed={open}
              aria-controls="focus-aside"
              leadingIcon={open ? <PanelRightClose /> : <PanelRightOpen />}
              onClick={() => setOpen(!open)}
            >
              {open ? `Hide ${asideTitle.toLowerCase()}` : `Show ${asideTitle.toLowerCase()}`}
            </Button>
          )}
        </div>
      </header>
      <div className="relative flex min-h-0 flex-1">
        <div
          className={cn(
            "relative flex min-w-0 flex-col overflow-y-auto [scrollbar-width:none]",
            aside && open ? cn("flex-1 lg:flex-none", split === "half" ? "lg:w-1/2" : split === "wide" ? "lg:w-[66%]" : "lg:w-[40%] lg:min-w-[440px]") : "flex-1",
          )}
        >
          <main className={cn("mx-auto w-full flex-1 px-4 py-8 sm:px-8 sm:py-10", widths[width], contentClassName)}>{children}</main>
          {footer && (
            <footer className="sticky bottom-0 z-20 border-t border-v2-line bg-v2-canvas/95 backdrop-blur">
              <div className={cn("mx-auto flex items-center justify-end gap-2 px-4 py-3 sm:px-8", widths[width])}>{footer}</div>
            </footer>
          )}
        </div>
        {aside && (
          <aside
            id="focus-aside"
            aria-label={asideTitle}
            aria-hidden={!open}
            className={cn(
              "flex shrink-0 flex-col overflow-hidden transition-[width,opacity] duration-v2-slow ease-out",
              asideTone === "canvas" ? "bg-v2-canvas lg:border-l lg:border-v2-line" : "bg-v2-field",
              "max-lg:absolute max-lg:inset-0 max-lg:z-v2-sticky",
              open ? "w-full opacity-100 lg:w-auto lg:min-w-0 lg:flex-1" : "pointer-events-none w-0 opacity-0",
            )}
          >
            <div className="flex h-12 shrink-0 items-center gap-2 px-6">
              <p className="flex-1 text-v2-sm font-semibold uppercase tracking-[0.08em] text-v2-ink-tertiary">{asideTitle}</p>
              {asideActions}
              <Button variant="ghost" size="icon-sm" aria-label={`Hide ${asideTitle.toLowerCase()}`} onClick={() => setOpen(false)}>
                <X />
              </Button>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto px-6 pb-10 [scrollbar-width:none]">{aside}</div>
          </aside>
        )}
      </div>
    </div>
  );
}

export { FocusLayout };
