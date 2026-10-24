import * as React from "react";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";

import { cn } from "@attendance/utils";
import { ChartLegend } from "./chart-legend";
import { ChartSkeleton } from "./chart-skeleton";
import { ChartTooltip } from "./chart-tooltip";
import { chartTheme, defaultFormatter, seriesColors, type ValueFormatter } from "./palette";

export interface DonutChartProps {
  data: { label: string; value: number }[];
  centerLabel?: React.ReactNode;
  centerValue?: React.ReactNode;
  size?: number;
  valueFormatter?: ValueFormatter;
  otherLabel?: string;
  legend?: "auto" | "always";
  stacked?: boolean;
  loading?: boolean;
  colors?: string[];
  sort?: boolean;
  className?: string;
}

function DonutChart({
  data,
  centerLabel,
  centerValue,
  size = 180,
  valueFormatter = defaultFormatter,
  otherLabel = "Other",
  legend = "auto",
  stacked = false,
  loading = false,
  colors,
  sort = true,
  className,
}: DonutChartProps) {
  const palette = colors ?? seriesColors;
  const slices = React.useMemo(() => {
    const sorted = sort ? [...data].sort((a, b) => b.value - a.value) : data;
    if (sorted.length <= palette.length) return sorted;
    const head = sorted.slice(0, palette.length - 1);
    const rest = sorted.slice(palette.length - 1).reduce((sum, item) => sum + item.value, 0);
    return [...head, { label: otherLabel, value: rest }];
  }, [data, otherLabel, palette.length, sort]);

  const total = slices.reduce((sum, item) => sum + item.value, 0);
  const percent = (value: number) => (total ? `${Math.round((value / total) * 100)}%` : "0%");

  if (loading) return <ChartSkeleton variant="ring" height={size} className={className} />;

  return (
    <div className={cn("font-v2 flex flex-col items-center gap-5", !stacked && "sm:flex-row sm:gap-8", stacked && "gap-6", className)}>
      <div className="relative shrink-0" style={{ width: size, height: size }}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={slices}
              dataKey="value"
              nameKey="label"
              innerRadius="72%"
              outerRadius="100%"
              paddingAngle={slices.length > 1 ? 1.5 : 0}
              cornerRadius={3}
              stroke={chartTheme.surface}
              strokeWidth={slices.length > 1 ? 2 : 0}
              isAnimationActive={false}
            >
              {slices.map((slice, index) => (
                <Cell key={slice.label} fill={palette[index]} />
              ))}
            </Pie>
            <Tooltip
              content={(props) => (
                <ChartTooltip
                  active={props.active}
                  payload={props.payload as never}
                  formatter={valueFormatter}
                  colorFor={(entry) => palette[slices.findIndex((s) => s.label === entry.name)] ?? palette[0]}
                  labelFor={(entry) => String(entry.name)}
                />
              )}
            />
          </PieChart>
        </ResponsiveContainer>
        {(centerValue || centerLabel) && (
          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
            {centerValue && (
              <span className="text-v2-2xl font-semibold leading-[28px] text-v2-ink tabular-nums">
                {centerValue}
              </span>
            )}
            {centerLabel && <span className="text-v2-xs text-v2-ink-tertiary">{centerLabel}</span>}
          </div>
        )}
      </div>
      <ChartLegend
        always={legend === "always"}
        className={stacked ? "justify-center" : "flex-col items-start gap-y-2.5"}
        items={slices.map((slice, index) => ({
          label: slice.label,
          color: palette[index],
          value: `${valueFormatter(slice.value)} · ${percent(slice.value)}`,
        }))}
      />
    </div>
  );
}

export { DonutChart };
