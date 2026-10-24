import * as React from "react";
import { ArrowRight } from "lucide-react";

import { cn } from "@attendance/utils";
import { Tooltip } from "../tooltip";
import { ChartSkeleton } from "./chart-skeleton";
import { chartColor, defaultFormatter, seriesColors, type ValueFormatter } from "./palette";

const ringColors = [...seriesColors.slice(0, 2), chartColor("chart-4"), seriesColors[2]];

export interface RingChartProps {
  data: { label: string; value: number }[];
  centerValue?: React.ReactNode;
  centerLabel?: React.ReactNode;
  size?: number;
  thickness?: number;
  valueFormatter?: ValueFormatter;
  action?: { label: string; href?: string; onClick?: () => void };
  loading?: boolean;
  className?: string;
}

function RingChart({
  data,
  centerValue,
  centerLabel,
  size = 240,
  thickness = 14,
  valueFormatter = defaultFormatter,
  action,
  loading = false,
  className,
}: RingChartProps) {
  const total = data.reduce((sum, item) => sum + item.value, 0);
  const radius = 50 - thickness / 2 / (size / 100);
  const circumference = 2 * Math.PI * radius;
  const gap = data.length > 1 ? 1.2 : 0.8;
  const stroke = (thickness / size) * 100;

  let offset = 0;
  const segments = data.map((item, index) => {
    const share = total ? item.value / total : 0;
    const length = Math.max(share * circumference - gap, 0);
    const segment = { ...item, share, length, offset, color: ringColors[index] ?? ringColors[ringColors.length - 1] };
    offset += share * circumference;
    return segment;
  });

  if (loading) return <ChartSkeleton variant="ring" height={size} className={className} />;

  return (
    <div className={cn("font-v2 flex flex-col items-center", className)}>
      <div className="relative" style={{ width: size, height: size }}>
        <svg viewBox="0 0 100 100" className="size-full -rotate-90">
          <circle cx="50" cy="50" r={radius} fill="none" stroke="hsl(var(--v2-field))" strokeWidth={stroke} />
          {segments.map((segment) => (
            <Tooltip key={segment.label} content={`${segment.label} · ${valueFormatter(segment.value)}`}>
              <circle
                data-v2
                cx="50"
                cy="50"
                r={radius}
                fill="none"
                stroke={segment.color}
                strokeWidth={stroke}
                strokeLinecap="butt"
                strokeDasharray={`${segment.length} ${circumference - segment.length}`}
                strokeDashoffset={-segment.offset - gap / 2}
                className="transition-opacity duration-v2-fast hover:opacity-80"
              />
            </Tooltip>
          ))}
        </svg>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
          {centerValue && <span className="text-v2-5xl font-semibold leading-[34px] tabular-nums text-v2-ink">{centerValue}</span>}
          {centerLabel && <span className="mt-0.5 text-v2-sm text-v2-ink-tertiary">{centerLabel}</span>}
        </div>
      </div>
      {action &&
        (action.href ? (
          <a data-v2 href={action.href} className="mt-6 inline-flex items-center gap-1.5 text-v2-base font-semibold text-v2-primary hover:underline">
            {action.label}
            <ArrowRight className="size-4" />
          </a>
        ) : (
          <button
            type="button"
            data-v2
            onClick={action.onClick}
            className="mt-6 inline-flex items-center gap-1.5 rounded-v2-xs bg-transparent text-v2-base font-semibold text-v2-primary hover:underline"
          >
            {action.label}
            <ArrowRight className="size-4" />
          </button>
        ))}
      <ul className="mt-4 flex flex-wrap justify-center gap-x-5 gap-y-2">
        {segments.map((segment) => (
          <li key={segment.label} className="flex items-center gap-2 text-v2-sm text-v2-ink-secondary">
            <span className="size-2 rounded-full" style={{ backgroundColor: segment.color }} />
            {segment.label}
            <span className="font-semibold tabular-nums text-v2-ink">{(segment.share * 100).toFixed(1)}%</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export { RingChart };
