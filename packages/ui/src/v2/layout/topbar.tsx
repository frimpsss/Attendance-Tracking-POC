import * as React from "react";
import { Menu } from "lucide-react";

import { cn } from "@attendance/utils";

export interface TopbarProps {
  leading?: React.ReactNode;
  center?: React.ReactNode;
  actions?: React.ReactNode;
  onMenuClick?: () => void;
  className?: string;
}

function Topbar({ leading, center, actions, onMenuClick, className }: TopbarProps) {
  return (
    <header
      data-v2
      className={cn(
        "font-v2 sticky top-0 z-v2-sticky flex h-16 shrink-0 items-center gap-4 bg-v2-canvas/95 px-4 backdrop-blur sm:px-10",
        className,
      )}
    >
      {onMenuClick && (
        <button
          type="button"
          data-v2
          aria-label="Open navigation"
          onClick={onMenuClick}
          className="-ml-1 flex size-9 items-center justify-center rounded-v2-sm bg-transparent text-v2-ink-secondary hover:bg-v2-surface-hover lg:hidden"
        >
          <Menu className="size-5" />
        </button>
      )}
      {leading && <div className="flex min-w-0 items-center gap-3">{leading}</div>}
      <div className="flex min-w-0 flex-1 justify-center">{center}</div>
      {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
    </header>
  );
}

export { Topbar };
