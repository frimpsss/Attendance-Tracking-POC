import * as React from "react";

import { cn } from "@attendance/utils";

type StatusTone = "positive" | "progress" | "attention" | "negative" | "neutral";

const positive = [
  "present", "completed", "auto posted", "auto_posted", "closed", "success", "successful", "active",
  "transferred", "paid", "approved", "accepted", "booked", "actioned", "submitted", "computed",
  "on-time", "early", "scheduled", "low", "enabled", "resolved", "reconciled", "sent", "opted-in",
  "updated", "under budget", "on track", "earning", "published", "received", "good standing",
];

const negative = [
  "absent", "below threshold", "cancelled", "failed", "unmatched", "inactive", "returned", "return", "rejected", "overdue",
  "high", "disabled", "no_show", "no show", "shortage", "unresolved", "unreconciled",
  "opted-out", "over budget", "disposed", "fully depreciated", "deduction", "archived",
];

const progress = [
  "confirmed", "commented", "in_progress", "pending review", "pending_review", "queued", "running",
  "completed_with_errors", "completed with errors", "partly paid", "partially ordered",
  "consolidated", "open", "under maintenance", "qr", "code", "manual", "correction",
];

const attention = ["late", "pending", "unpaid", "due", "awaiting payment", "on hold", "hold", "expiring", "needs review"];

const toneFor = (value: string): StatusTone => {
  const key = value.toLowerCase();
  if (positive.includes(key)) return "positive";
  if (negative.includes(key)) return "negative";
  if (progress.includes(key)) return "progress";
  if (attention.includes(key)) return "attention";
  return "neutral";
};

const glyphs: Record<StatusTone, React.ReactNode> = {
  positive: (
    <>
      <circle cx="8" cy="8" r="7" fill="currentColor" />
      <path d="M5 8.2 7 10.2 11 6" fill="none" stroke="#fff" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </>
  ),
  progress: (
    <>
      <circle cx="8" cy="8" r="6.2" fill="none" stroke="currentColor" strokeWidth="1.6" />
      <path d="M8 4.2a3.8 3.8 0 0 1 0 7.6Z" fill="currentColor" />
    </>
  ),
  attention: (
    <>
      <circle cx="8" cy="8" r="7" fill="currentColor" />
      <path d="M8 4.6v4" stroke="#fff" strokeWidth="1.6" strokeLinecap="round" />
      <circle cx="8" cy="11.1" r="0.95" fill="#fff" />
    </>
  ),
  negative: (
    <>
      <circle cx="8" cy="8" r="7" fill="currentColor" />
      <path d="m5.8 5.8 4.4 4.4m0-4.4-4.4 4.4" stroke="#fff" strokeWidth="1.6" strokeLinecap="round" />
    </>
  ),
  neutral: (
    <circle cx="8" cy="8" r="6.2" fill="none" stroke="currentColor" strokeWidth="1.6" strokeDasharray="2.4 2.2" />
  ),
};

const tones: Record<StatusTone, { pill: string; icon: string; dot: string }> = {
  positive: { pill: "bg-v2-primary-soft text-v2-primary", icon: "text-v2-primary", dot: "bg-v2-primary" },
  progress: { pill: "bg-sky-500/10 text-sky-600", icon: "text-sky-500", dot: "border-[1.5px] border-sky-500" },
  attention: { pill: "bg-amber-500/10 text-amber-600", icon: "text-amber-500", dot: "bg-amber-500" },
  negative: { pill: "bg-v2-danger-soft text-v2-danger", icon: "text-v2-danger", dot: "bg-v2-danger" },
  neutral: { pill: "bg-amber-500/10 text-amber-600", icon: "text-amber-500", dot: "border-[1.5px] border-dashed border-amber-500" },
};

export interface StatusProps extends React.HTMLAttributes<HTMLSpanElement> {
  value?: string | null;
  label?: React.ReactNode;
  tone?: StatusTone;
  variant?: "pill" | "dot";
  size?: "sm" | "md";
}

function Status({ value, label, tone, variant = "pill", size = "md", className, ...props }: StatusProps) {
  if (!value && !label) return null;

  const resolved = tones[tone ?? toneFor(value ?? "")];
  const text = label ?? String(value).replace(/_/g, " ");

  if (variant === "dot") {
    return (
      <span
        className={cn(
          "font-v2 inline-flex items-center whitespace-nowrap capitalize text-v2-ink",
          size === "sm" ? "gap-1.5 text-v2-xs" : "gap-2 text-v2-sm",
          className,
        )}
        {...props}
      >
        <span className={cn("shrink-0 rounded-full", size === "sm" ? "size-1.5" : "size-2", resolved.dot)} />
        <span className="pt-px leading-none">{text}</span>
      </span>
    );
  }

  return (
    <span
      className={cn(
        "font-v2 inline-flex w-fit items-center whitespace-nowrap rounded-full font-semibold capitalize",
        size === "sm" ? "h-5 gap-1 pl-1 pr-2 text-v2-2xs" : "h-6 gap-1.5 pl-1.5 pr-2.5 text-v2-sm",
        resolved.pill,
        className,
      )}
      {...props}
    >
      <svg viewBox="0 0 16 16" aria-hidden className={cn("shrink-0", size === "sm" ? "size-3" : "size-3.5", resolved.icon)}>
        {glyphs[tone ?? toneFor(value ?? "")]}
      </svg>
      <span className="pt-px leading-none">{text}</span>
    </span>
  );
}

export { Status };
