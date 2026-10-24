import * as React from "react";
import { Bar, BarChart as RechartsBarChart, CartesianGrid, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import { cn } from "@attendance/utils";
import { ChartLegend } from "./chart-legend";
import { ChartSkeleton } from "./chart-skeleton";
import { ChartTooltip } from "./chart-tooltip";
import { chartTheme, compactFormatter, defaultFormatter, seriesColors, type ChartSeries, type ValueFormatter } from "./palette";

const ZERO_BASED: [(min: number) => number, (max: number) => number] = [(min) => Math.min(0, min), (max) => Math.max(0, max)];

interface SoftBarProps {
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  value?: number | number[];
  gradientId: string;
  color: string;
  horizontal?: boolean;
}

function SoftBar({ x = 0, y = 0, width = 0, height = 0, value, gradientId, color, horizontal = false }: SoftBarProps) {
  const numeric = Array.isArray(value) ? value[1] - value[0] : (value ?? 0);
  const negative = numeric < 0;
  if (horizontal) {
    const left = width >= 0 ? x : x + width;
    const size = Math.abs(width);
    if (!size || !height) return null;
    return (
      <g>
        <rect x={left} y={y} width={size} height={height} fill={`url(#${gradientId}-${negative ? "left" : "right"})`} />
        <rect x={negative ? left : left + size - 2} y={y} width={2} height={height} fill={color} />
      </g>
    );
  }
  const top = height >= 0 ? y : y + height;
  const size = Math.abs(height);
  if (!size || !width) return null;
  return (
    <g>
      <rect x={x} y={top} width={width} height={size} fill={`url(#${gradientId}-${negative ? "down" : "up"})`} />
      <rect x={x} y={negative ? top + size - 2 : top} width={width} height={2} fill={color} />
    </g>
  );
}

const softDirections = {
  up: { x1: 0, y1: 0, x2: 0, y2: 1 },
  down: { x1: 0, y1: 1, x2: 0, y2: 0 },
  right: { x1: 1, y1: 0, x2: 0, y2: 0 },
  left: { x1: 0, y1: 0, x2: 1, y2: 0 },
};

function SoftBarGradients({ id, color }: { id: string; color: string }) {
  return (
    <>
      {Object.entries(softDirections).map(([direction, vector]) => (
        <linearGradient key={direction} id={`${id}-${direction}`} {...vector}>
          <stop offset="0%" stopColor={color} stopOpacity={0.34} />
          <stop offset="100%" stopColor={color} stopOpacity={0.04} />
        </linearGradient>
      ))}
    </>
  );
}

const TICK_CHARS = 8;
const fitTick = (label: string) => (label.length > TICK_CHARS ? `${label.slice(0, TICK_CHARS - 1)}…` : label);

export interface BarChartProps {
  data: Record<string, unknown>[];
  xKey: string;
  series: ChartSeries[];
  stacked?: boolean;
  layout?: "vertical" | "horizontal";
  height?: number;
  valueFormatter?: ValueFormatter;
  axisFormatter?: ValueFormatter;
  loading?: boolean;
  appearance?: "solid" | "soft";
  legend?: "auto" | "always";
  showAllTicks?: boolean;
  xTickFormatter?: (value: string) => string;
  colors?: string[];
  className?: string;
}

function BarChart({
  data,
  xKey,
  series,
  stacked = false,
  layout = "vertical",
  height = 260,
  valueFormatter = defaultFormatter,
  axisFormatter = compactFormatter,
  loading = false,
  appearance = "soft",
  legend = "auto",
  showAllTicks = false,
  xTickFormatter,
  colors,
  className,
}: BarChartProps) {
  const palette = colors ?? seriesColors;
  const visible = series.slice(0, palette.length);
  const horizontal = layout === "horizontal";
  const colorOf = (key: string) => palette[Math.max(0, visible.findIndex((s) => s.key === key))];
  const labelOf = (key: string) => visible.find((s) => s.key === key)?.label ?? key;
  const axisTick = { fill: chartTheme.axis, fontSize: chartTheme.fontSize };
  const gradientBase = `v2-soft-${React.useId().replace(/:/g, "")}`;
  const crowded = showAllTicks && data.length > 6;
  const tickFormatter = crowded ? (value: string) => fitTick(xTickFormatter ? xTickFormatter(value) : String(value)) : xTickFormatter;

  const radiusFor = (index: number): [number, number, number, number] => {
    const isEnd = !stacked || index === visible.length - 1;
    if (!isEnd) return [0, 0, 0, 0];
    return horizontal ? [0, 4, 4, 0] : [4, 4, 0, 0];
  };

  if (loading) return <ChartSkeleton variant="bars" height={height} className={className} />;

  return (
    <div className={cn("font-v2", className)}>
      <ChartLegend
        className="mb-4"
        always={legend === "always"}
        items={visible.map((s, index) => ({ label: s.label, color: palette[index] }))}
      />
      <ResponsiveContainer width="100%" height={height}>
        <RechartsBarChart
          data={data}
          layout={horizontal ? "vertical" : "horizontal"}
          margin={{ top: 4, right: 4, bottom: 0, left: 0 }}
          barCategoryGap="28%"
          barGap={2}
        >
          {appearance === "soft" && (
            <defs>
              {visible.map((s, index) => (
                <SoftBarGradients key={s.key} id={`${gradientBase}-${index}`} color={palette[index]} />
              ))}
            </defs>
          )}
          <CartesianGrid stroke={chartTheme.grid} vertical={horizontal} horizontal={!horizontal} />
          {data.some((row) => visible.some((s) => Number(row[s.key]) < 0)) && <ReferenceLine y={0} stroke={chartTheme.cursor} />}
          {horizontal ? (
            <>
              <XAxis type="number" domain={ZERO_BASED} tickLine={false} axisLine={false} tick={axisTick} tickFormatter={axisFormatter} />
              <YAxis type="category" dataKey={xKey} tickLine={false} axisLine={false} tick={axisTick} width={96} />
            </>
          ) : (
            <>
              <XAxis dataKey={xKey} tickLine={false} axisLine={false} tick={axisTick} tickMargin={10} interval={showAllTicks ? 0 : undefined} tickFormatter={tickFormatter} />
              <YAxis domain={ZERO_BASED} tickLine={false} axisLine={false} tick={axisTick} tickFormatter={axisFormatter} width={44} />
            </>
          )}
          <Tooltip
            cursor={{ fill: chartTheme.hover }}
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
            <Bar
              key={s.key}
              dataKey={s.key}
              fill={palette[index]}
              stackId={stacked ? "stack" : undefined}
              radius={appearance === "soft" ? 0 : radiusFor(index)}
              stroke={stacked && appearance === "solid" ? chartTheme.surface : undefined}
              strokeWidth={stacked && appearance === "solid" ? 2 : 0}
              shape={
                appearance === "soft"
                  ? (props: unknown) => <SoftBar {...(props as SoftBarProps)} gradientId={`${gradientBase}-${index}`} color={palette[index]} horizontal={horizontal} />
                  : undefined
              }
              maxBarSize={40}
              isAnimationActive={false}
            />
          ))}
        </RechartsBarChart>
      </ResponsiveContainer>
    </div>
  );
}

export { BarChart, SoftBar, SoftBarGradients };
export type { SoftBarProps };
