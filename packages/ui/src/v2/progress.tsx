import * as React from "react";

import { cn } from "@attendance/utils";

const tones = {
  primary: "bg-v2-primary",
  neutral: "bg-v2-ink-tertiary",
} as const;

export interface ProgressProps extends React.HTMLAttributes<HTMLDivElement> {
  value: number;
  max?: number;
  tone?: keyof typeof tones;
  size?: "sm" | "md";
  label?: React.ReactNode;
  showValue?: boolean;
}

function Progress({
  value,
  max = 100,
  tone = "primary",
  size = "md",
  label,
  showValue,
  className,
  ...props
}: ProgressProps) {
  const percent = Math.min(100, Math.max(0, (value / max) * 100));
  const bar = (
    <div
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={max}
      aria-valuenow={value}
      className={cn(
        "w-full overflow-hidden rounded-full bg-v2-surface-active",
        size === "sm" ? "h-1" : "h-1.5",
        className,
      )}
      {...props}
    >
      <div
        className={cn("h-full rounded-full transition-[width] duration-v2-slow ease-out", tones[tone])}
        style={{ width: `${percent}%` }}
      />
    </div>
  );
  if (!label && !showValue) return bar;
  return (
    <div className="font-v2 flex flex-col gap-1.5">
      <div className="flex items-center justify-between text-v2-meta leading-[18px]">
        <span className="text-v2-ink-secondary">{label}</span>
        {showValue && <span className="font-medium tabular-nums text-v2-ink">{Math.round(percent)}%</span>}
      </div>
      {bar}
    </div>
  );
}

export { Progress };
