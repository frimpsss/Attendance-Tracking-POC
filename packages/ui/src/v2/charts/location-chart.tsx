import * as React from "react";

import { cn } from "@attendance/utils";
import { Tooltip } from "../tooltip";
import { ChartSkeleton } from "./chart-skeleton";
import { compactFormatter, type ValueFormatter } from "./palette";

export interface LocationChartProps {
  data: { label: string; value: number }[];
  height?: number;
  sort?: boolean;
  valueFormatter?: ValueFormatter;
  tooltipFormatter?: ValueFormatter;
  emptyText?: string;
  loading?: boolean;
  className?: string;
}

function LocationChart({
  data,
  height = 200,
  sort = true,
  valueFormatter = compactFormatter,
  tooltipFormatter = (value) => value.toLocaleString(),
  emptyText = "No location data",
  loading = false,
  className,
}: LocationChartProps) {
  const rows = React.useMemo(() => (sort ? [...data].sort((a, b) => b.value - a.value) : data), [data, sort]);
  const max = Math.max(0, ...rows.map((row) => row.value));

  if (loading) return <ChartSkeleton variant="location" height={height} className={className} />;

  if (rows.length === 0) {
    return <p className={cn("font-v2 py-10 text-center text-v2-ui text-v2-ink-tertiary", className)}>{emptyText}</p>;
  }

  return (
    <div className={cn("font-v2", className)}>
      <div className="flex items-end gap-[2px]" style={{ height }}>
        {rows.map((row) => {
          const share = max ? row.value / max : 0;
          return (
            <Tooltip key={row.label} content={`${row.label} · ${tooltipFormatter(row.value)}`}>
              <div
                tabIndex={0}
                data-v2
                className="group flex h-full min-w-0 flex-1 flex-col justify-end outline-none"
                aria-label={`${row.label}: ${tooltipFormatter(row.value)}`}
              >
                <div
                  className="flex min-h-[36px] justify-center border-t-[3px] border-v2-primary bg-v2-field pt-2 transition-colors duration-v2-fast group-hover:bg-v2-field-hover group-focus-visible:bg-v2-primary-soft"
                  style={{ height: `${Math.max(share * 100, 12)}%` }}
                >
                  <span className="truncate px-1 text-v2-sm font-semibold tabular-nums text-v2-primary">
                    {valueFormatter(row.value)}
                  </span>
                </div>
              </div>
            </Tooltip>
          );
        })}
      </div>
      <div className="mt-2 flex gap-[2px]">
        {rows.map((row) => (
          <p key={row.label} className="line-clamp-2 min-w-0 flex-1 break-words px-0.5 text-center text-v2-xs leading-[16px] text-v2-ink-secondary" title={row.label}>
            {row.label}
          </p>
        ))}
      </div>
    </div>
  );
}

export { LocationChart };
