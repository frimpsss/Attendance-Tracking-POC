import * as React from "react";

import { cn } from "@attendance/utils";
import { ChartSkeleton } from "./chart-skeleton";
import { compactFormatter, type ValueFormatter } from "./palette";

export interface BreakdownBarsProps {
  title?: React.ReactNode;
  items: { label: string; value: number; displayValue?: string; meta?: string }[];
  total?: number;
  max?: number;
  direction?: "in" | "out";
  ticks?: number;
  valueFormatter?: ValueFormatter;
  totalLabel?: string;
  loading?: boolean;
  className?: string;
}

function BreakdownBars({
  title,
  items,
  total,
  max,
  direction = "in",
  ticks = 48,
  valueFormatter = compactFormatter,
  totalLabel,
  loading = false,
  className,
}: BreakdownBarsProps) {
  const isPercentMode = max !== undefined || items.some((item) => item.displayValue !== undefined);
  const sum = total ?? items.reduce((acc, item) => acc + item.value, 0);
  const denominator = max ?? (isPercentMode ? 100 : sum);
  const tone = direction === "in" ? "text-v2-positive" : "text-v2-negative";
  const filled = direction === "in" ? "bg-v2-positive" : "bg-v2-negative";
  const showHeader = Boolean(title || totalLabel);

  return (
    <div className={cn("font-v2", className)}>
      {showHeader && (
        <div className="mb-6 flex items-baseline justify-between gap-4">
          {title ? <h3 className="text-v2-lg font-semibold text-v2-ink">{title}</h3> : <span />}
          {loading ? (
            <span className="h-3.5 w-24 animate-pulse rounded-full bg-v2-surface-active" />
          ) : totalLabel ? (
            <span className={cn("text-v2-sm font-semibold tabular-nums", tone)}>
              {totalLabel}: {valueFormatter(sum)}
            </span>
          ) : null}
        </div>
      )}
      {loading ? (
        <ChartSkeleton variant="ticks" rows={Math.max(items.length, 3)} />
      ) : (
        <div className="flex flex-col gap-5">
          {items.map((item) => {
            const ratio = denominator ? Math.min(1, Math.max(0, item.value / denominator)) : 0;
            const lit = ratio > 0 ? Math.max(1, Math.round(ratio * ticks)) : 0;
            return (
              <div key={item.label}>
                <div className="mb-2 flex items-baseline justify-between gap-3 text-v2-sm">
                  <span className="truncate font-medium text-v2-ink">{item.label}</span>
                  <span className="shrink-0 tabular-nums">
                    {item.displayValue !== undefined ? (
                      <>
                        <span className="font-semibold text-v2-ink">{item.displayValue}</span>
                        {item.meta && (
                          <span className="ml-1.5 text-v2-xs text-v2-ink-tertiary">
                            ({item.meta})
                          </span>
                        )}
                      </>
                    ) : (
                      <>
                        <span className="font-semibold text-v2-ink">
                          {(ratio * 100).toFixed(ratio > 0 && ratio < 0.01 ? 2 : 1)}%
                        </span>
                        <span className="ml-1.5 text-v2-ink-tertiary">
                          ({valueFormatter(item.value)})
                        </span>
                      </>
                    )}
                  </span>
                </div>
                <div
                  role="meter"
                  aria-label={item.label}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-valuenow={Math.round(ratio * 100)}
                  className="flex h-5 gap-[3px]"
                >
                  {Array.from({ length: ticks }, (_, index) => (
                    <span
                      key={index}
                      className={cn(
                        "flex-1 rounded-[2px] transition-colors duration-v2-slow",
                        index < lit ? filled : "bg-v2-field",
                      )}
                      style={
                        index < lit
                          ? { transitionDelay: `${index * 6}ms` }
                          : undefined
                      }
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export { BreakdownBars };
