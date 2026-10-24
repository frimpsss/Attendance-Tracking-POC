import { Area, AreaChart, CartesianGrid, ReferenceArea, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import { cn } from "@attendance/utils";
import { ChartLegend } from "./chart-legend";
import { ChartSkeleton } from "./chart-skeleton";
import { ChartTooltip } from "./chart-tooltip";
import { chartTheme, compactFormatter, defaultFormatter, seriesColors, type ChartSeries, type ValueFormatter } from "./palette";

export interface LineChartProps {
  data: Record<string, unknown>[];
  xKey: string;
  series: ChartSeries[];
  variant?: "line" | "area";
  dots?: boolean;
  dashedGrid?: boolean;
  curve?: "monotone" | "linear";
  loading?: boolean;
  legend?: "auto" | "always";
  highlightLast?: boolean;
  yDomain?: "zero" | "auto";
  height?: number;
  valueFormatter?: ValueFormatter;
  axisFormatter?: ValueFormatter;
  className?: string;
}

function LineChart({
  data,
  xKey,
  series,
  variant = "area",
  dots = false,
  dashedGrid = false,
  curve = "monotone",
  loading = false,
  legend = "auto",
  highlightLast = false,
  yDomain = "zero",
  height = 260,
  valueFormatter = defaultFormatter,
  axisFormatter = compactFormatter,
  className,
}: LineChartProps) {
  const visible = series.slice(0, seriesColors.length);
  const colorOf = (key: string) => seriesColors[Math.max(0, visible.findIndex((s) => s.key === key))];
  const labelOf = (key: string) => visible.find((s) => s.key === key)?.label ?? key;

  if (loading) return <ChartSkeleton variant="line" height={height} className={className} />;

  return (
    <div className={cn("font-v2", className)}>
      <ChartLegend
        className="mb-4"
        always={legend === "always"}
        items={visible.map((s, index) => ({ label: s.label, color: seriesColors[index] }))}
      />
      <ResponsiveContainer width="100%" height={height}>
        <AreaChart data={data} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
          <defs>
            {visible.map((s, index) => (
              <linearGradient key={s.key} id={`v2-area-${s.key}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={seriesColors[index]} stopOpacity={index === 0 ? 0.14 : 0.08} />
                <stop offset="100%" stopColor={seriesColors[index]} stopOpacity={0} />
              </linearGradient>
            ))}
          </defs>
          <CartesianGrid stroke={chartTheme.grid} vertical={false} strokeDasharray={dashedGrid ? "4 4" : undefined} />
          {highlightLast && data.length > 1 && (
            <ReferenceArea
              x1={String(data[data.length - 2][xKey])}
              x2={String(data[data.length - 1][xKey])}
              fill={chartTheme.hover}
              fillOpacity={1}
              ifOverflow="extendDomain"
            />
          )}
          {data.some((row) => visible.some((s) => Number(row[s.key]) < 0)) && (
            <ReferenceLine y={0} stroke={chartTheme.cursor} strokeWidth={1} />
          )}
          <XAxis
            dataKey={xKey}
            tickLine={false}
            axisLine={false}
            tick={{ fill: chartTheme.axis, fontSize: chartTheme.fontSize }}
            tickMargin={10}
            minTickGap={24}
          />
          <YAxis
            tickLine={false}
            axisLine={false}
            tick={{ fill: chartTheme.axis, fontSize: chartTheme.fontSize }}
            tickFormatter={axisFormatter}
            width={44}
            domain={yDomain === "auto" ? ["auto", "auto"] : undefined}
          />
          <Tooltip
            cursor={{ stroke: chartTheme.cursor, strokeWidth: 1 }}
            content={(props) => (
              <ChartTooltip
                active={props.active}
                label={props.label as string}
                payload={props.payload as never}
                formatter={valueFormatter}
                colorFor={(entry) => colorOf(String(entry.dataKey))}
                labelFor={(entry) => labelOf(String(entry.dataKey))}
              />
            )}
          />
          {visible.map((s, index) => (
            <Area
              key={s.key}
              type={curve}
              dataKey={s.key}
              stroke={seriesColors[index]}
              strokeWidth={2}
              fill={variant === "area" ? `url(#v2-area-${s.key})` : "transparent"}
              dot={dots ? { r: 3.5, strokeWidth: 2, stroke: seriesColors[index], fill: chartTheme.surface } : false}
              activeDot={{ r: 5, strokeWidth: 2, stroke: chartTheme.surface, fill: seriesColors[index] }}
              isAnimationActive={false}
            />
          ))}
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

export { LineChart };
