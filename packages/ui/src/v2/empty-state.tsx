import * as React from "react";

import { cn } from "@attendance/utils";

type Illustration = "documents" | "search" | "inbox" | "chart";

const ink = "hsl(var(--v2-primary))";
const soft = "hsl(var(--v2-primary-soft))";
const softer = "hsl(var(--v2-primary-soft-hover))";
const field = "hsl(var(--v2-field))";
const line = "hsl(var(--v2-line))";
const paper = "hsl(var(--v2-canvas))";

const illustrations: Record<Illustration, React.ReactNode> = {
  documents: (
    <>
      <rect x="44" y="18" width="72" height="88" rx="8" fill={field} transform="rotate(-8 80 62)" />
      <rect x="44" y="14" width="72" height="88" rx="8" fill={paper} stroke={line} strokeWidth="1.5" />
      <rect x="56" y="28" width="22" height="22" rx="6" fill={soft} />
      <path d="M62 39h10M67 34v10" stroke={ink} strokeWidth="2" strokeLinecap="round" />
      <rect x="56" y="60" width="48" height="5" rx="2.5" fill={field} />
      <rect x="56" y="72" width="36" height="5" rx="2.5" fill={field} />
      <rect x="56" y="84" width="42" height="5" rx="2.5" fill={field} />
      <circle cx="116" cy="96" r="14" fill={ink} />
      <path d="M110 96h12M116 90v12" stroke={paper} strokeWidth="2.2" strokeLinecap="round" />
    </>
  ),
  search: (
    <>
      <rect x="30" y="20" width="100" height="18" rx="6" fill={field} />
      <rect x="30" y="46" width="100" height="18" rx="6" fill={field} opacity="0.7" />
      <rect x="30" y="72" width="100" height="18" rx="6" fill={field} opacity="0.4" />
      <circle cx="98" cy="62" r="20" fill={paper} stroke={ink} strokeWidth="4" />
      <circle cx="98" cy="62" r="12" fill={soft} />
      <path d="m113 77 13 13" stroke={ink} strokeWidth="5" strokeLinecap="round" />
    </>
  ),
  inbox: (
    <>
      <rect x="56" y="12" width="48" height="36" rx="6" fill={paper} stroke={line} strokeWidth="1.5" transform="rotate(-6 80 30)" />
      <rect x="62" y="24" width="48" height="36" rx="6" fill={soft} transform="rotate(5 86 42)" />
      <path d="M28 64 42 44h76l14 20v30a8 8 0 0 1-8 8H36a8 8 0 0 1-8-8Z" fill={paper} stroke={line} strokeWidth="1.5" />
      <path d="M28 64h30l6 10h32l6-10h30v30a8 8 0 0 1-8 8H36a8 8 0 0 1-8-8Z" fill={field} />
      <rect x="66" y="80" width="28" height="5" rx="2.5" fill={ink} opacity="0.85" />
    </>
  ),
  chart: (
    <>
      <rect x="24" y="14" width="112" height="88" rx="8" fill={paper} stroke={line} strokeWidth="1.5" />
      <path d="M36 88h88" stroke={line} strokeWidth="1.5" />
      <rect x="42" y="62" width="12" height="26" rx="3" fill={field} />
      <rect x="60" y="50" width="12" height="38" rx="3" fill={softer} />
      <rect x="78" y="38" width="12" height="50" rx="3" fill={field} />
      <rect x="96" y="28" width="12" height="60" rx="3" fill={ink} />
    </>
  ),
};

export interface EmptyStateProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "title"> {
  illustration?: Illustration;
  icon?: React.ReactNode;
  title: React.ReactNode;
  description?: React.ReactNode;
  action?: React.ReactNode;
  secondaryAction?: React.ReactNode;
  size?: "sm" | "md";
}

function EmptyState({
  illustration = "documents",
  icon,
  title,
  description,
  action,
  secondaryAction,
  size = "md",
  className,
  ...props
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "font-v2 flex flex-col items-center justify-center text-center",
        size === "md" ? "px-6 py-14" : "px-4 py-8",
        className,
      )}
      {...props}
    >
      {icon ? (
        <div className="mb-5 flex size-12 items-center justify-center rounded-v2-md bg-v2-primary-soft text-v2-primary [&_svg]:size-6">
          {icon}
        </div>
      ) : (
        <svg
          viewBox="0 0 160 116"
          aria-hidden
          className={cn("mb-6", size === "md" ? "h-[116px] w-40" : "h-20 w-28")}
        >
          {illustrations[illustration]}
        </svg>
      )}
      <p className={cn("font-semibold text-v2-ink", size === "md" ? "text-v2-xl leading-[24px]" : "text-v2-md leading-[22px]")}>
        {title}
      </p>
      {description && (
        <p className="mt-1.5 max-w-sm text-v2-base leading-[21px] text-v2-ink-secondary">{description}</p>
      )}
      {(action || secondaryAction) && (
        <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
          {action}
          {secondaryAction}
        </div>
      )}
    </div>
  );
}

export { EmptyState };
