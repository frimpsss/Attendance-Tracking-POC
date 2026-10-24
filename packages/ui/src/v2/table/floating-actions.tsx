import * as React from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";

import { cn } from "@attendance/utils";
import { useLayer } from "../shared/layer";

export interface FloatingAction {
  label: string;
  icon?: React.ReactNode;
  tone?: "default" | "danger";
  onClick: () => void;
}

export interface FloatingActionsProps {
  count: number;
  actions: FloatingAction[];
  onClear: () => void;
  noun?: [singular: string, plural: string];
}

function FloatingActions({ count, actions, onClear, noun = ["item", "items"] }: FloatingActionsProps) {
  const layer = useLayer();
  if (count === 0 || typeof document === "undefined") return null;

  return createPortal(
    <div
      data-v2
      role="toolbar"
      aria-label="Bulk actions"
      className={cn("font-v2 inset-x-0 bottom-6 z-v2-floating mx-auto flex w-fit max-w-[calc(100vw-2rem)] items-center gap-1 rounded-v2-lg bg-v2-primary p-1.5 pl-4 text-v2-on-primary animate-in fade-in-0 slide-in-from-bottom-3 duration-v2-base", layer ? "absolute" : "fixed")}
    >
      <span className="mr-2 flex items-center gap-2 whitespace-nowrap text-v2-base font-medium">
        <span className="flex h-6 min-w-6 items-center justify-center rounded-v2-xs bg-white px-1.5 text-v2-meta font-semibold tabular-nums text-v2-primary">
          {count}
        </span>
        {count === 1 ? noun[0] : noun[1]} selected
      </span>
      <span className="h-5 w-px bg-white/15" />
      {actions.map((action) => (
        <button
          key={action.label}
          type="button"
          data-v2
          data-press
          onClick={action.onClick}
          className={cn(
            "inline-flex h-9 items-center gap-2 whitespace-nowrap rounded-v2-sm bg-transparent px-3 text-v2-base font-medium transition-colors duration-v2-fast hover:bg-white/15 [&_svg]:size-4",
            action.tone === "danger" ? "text-v2-danger-on-primary" : "text-white",
          )}
        >
          {action.icon}
          {action.label}
        </button>
      ))}
      <span className="h-5 w-px bg-white/15" />
      <button
        type="button"
        data-v2
        data-press
        aria-label="Clear selection"
        onClick={onClear}
        className="flex size-9 items-center justify-center rounded-v2-sm bg-transparent text-white/70 transition-colors duration-v2-fast hover:bg-white/15 hover:text-white"
      >
        <X className="size-4" />
      </button>
    </div>,
    layer ?? document.body,
  );
}

export { FloatingActions };
