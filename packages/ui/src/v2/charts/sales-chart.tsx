import * as React from "react";
import { Bar, BarChart, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { ArrowDownRight, ArrowUpRight } from "lucide-react";

import { cn } from "@attendance/utils";
import { focusRing } from "../shared/styles";
import { ChartSkeleton } from "./chart-skeleton";
import { chartColor, chartTheme, type ValueFormatter } from "./palette";

const formatFullDate = (iso: string) => {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return new Intl.DateTimeFormat("en-US", {
    weekday: "short",
    month: "short",
    day: "2-digit",
    year: "numeric",
  }).format(d);
};

const formatMonthYear = (iso: string) => {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    year: "numeric",
  }).format(d);
};

const formatShortMonth = (iso: string) => {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
  }).format(d);
};

export interface SalesPoint {
  date: string;
  value: number;
}

type Preset = "1M" | "3M" | "6M";

const presetDays: Record<Preset, number> = { "1M": 30, "3M": 90, "6M": 180 };

export interface SalesChartProps {
  data: SalesPoint[];
  title?: React.ReactNode;
  headline?: React.ReactNode;
  presets?: Preset[];
  height?: number;
  valueFormatter?: ValueFormatter;
  loading?: boolean;
  showTotal?: boolean;
  presetStyle?: "segmented" | "buttons";
  fill?: boolean;
  className?: string;
}

const monthKey = (date: string) => date.slice(0, 7);
const rampColor = (index: number, count: number) => {
  const opacity = count <= 1 ? 1 : 0.25 + 0.75 * (index / (count - 1));
  return chartColor("chart-1", Number(opacity.toFixed(3)));
};

function SalesTooltip({
  active,
  point,
  previous,
  formatter,
}: {
  active?: boolean;
  point?: SalesPoint;
  previous?: SalesPoint;
  formatter: ValueFormatter;
}) {
  if (!active || !point) return null;
  const change =
    previous && previous.value > 0
      ? ((point.value - previous.value) / previous.value) * 100
      : null;
  const up = change !== null && change >= 0;
  return (
    <div className="font-v2 min-w-[220px] rounded-v2-md border border-v2-line bg-v2-canvas px-4 py-3">
      <div className="flex items-center justify-between gap-6 text-v2-meta">
        <span className="font-medium text-v2-ink-secondary">Sales</span>
        <span className="text-v2-ink-tertiary">
          {formatFullDate(point.date)}
        </span>
      </div>
      <p className="mt-1.5 text-v2-3xl font-semibold leading-[30px] tabular-nums text-v2-ink">
        {formatter(point.value)}
      </p>
      <p
        className={cn(
          "mt-0.5 flex items-center gap-1 text-v2-meta font-medium",
          change === null
            ? "text-v2-ink-tertiary"
            : up
              ? "text-v2-primary"
              : "text-v2-ink-secondary",
        )}
      >
        {change === null ? (
          "No sales the day before"
        ) : (
          <>
            {up ? (
              <ArrowUpRight className="size-3.5" />
            ) : (
              <ArrowDownRight className="size-3.5" />
            )}
            {Math.abs(change).toFixed(1)}% vs previous day
          </>
        )}
      </p>
    </div>
  );
}

function SalesChart({
  data,
  title,
  headline,
  presets = ["1M", "3M", "6M"],
  showTotal = true,
  presetStyle = "segmented",
  height = 260,
  valueFormatter = (value) => value.toLocaleString(),
  loading = false,
  fill = false,
  className,
}: SalesChartProps) {
  const sorted = React.useMemo(
    () => [...data].sort((a, b) => a.date.localeCompare(b.date)),
    [data],
  );
  const months = React.useMemo(() => {
    const seen: { key: string; start: number }[] = [];
    sorted.forEach((point, index) => {
      const key = monthKey(point.date);
      if (!seen.some((month) => month.key === key))
        seen.push({ key, start: index });
    });
    return seen;
  }, [sorted]);

  const [preset, setPreset] = React.useState<Preset | null>(null);
  const [dragging, setDragging] = React.useState(false);
  const trackRef = React.useRef<HTMLDivElement>(null);
  const [selectedMonth, setSelectedMonth] = React.useState<string | undefined>(
    months[months.length - 1]?.key,
  );

  React.useEffect(() => {
    if (!months.some((month) => month.key === selectedMonth))
      setSelectedMonth(months[months.length - 1]?.key);
  }, [months, selectedMonth]);

  const visible = preset ? sorted.slice(-presetDays[preset]) : sorted;
  const highlighted = preset
    ? visible
    : visible.filter((point) => monthKey(point.date) === selectedMonth);
  const firstHighlighted = visible.indexOf(highlighted[0]);
  const visibleMonths = months.filter((month) =>
    visible.some((point) => monthKey(point.date) === month.key),
  );

  const colorFor = (index: number) => {
    if (preset) return rampColor(index, visible.length);
    const offset = index - firstHighlighted;
    return offset >= 0 && offset < highlighted.length
      ? rampColor(offset, highlighted.length)
      : chartTheme.muted;
  };

  const selectAt = (clientX: number) => {
    const track = trackRef.current;
    if (!track || visible.length === 0) return;
    const rect = track.getBoundingClientRect();
    const index = Math.min(
      visible.length - 1,
      Math.max(
        0,
        Math.floor(((clientX - rect.left) / rect.width) * visible.length),
      ),
    );
    const key = monthKey(visible[index].date);
    setPreset(null);
    if (key !== selectedMonth) setSelectedMonth(key);
  };

  const step = (index: number) => {
    setPreset(null);
    setSelectedMonth(months[index].key);
  };

  const periodTotal = highlighted.reduce((sum, point) => sum + point.value, 0);

  return (
    <div className={cn("font-v2", fill && "flex h-full flex-col", className)}>
      <div className="mb-5 flex flex-wrap items-start justify-between gap-4">
        {showTotal ? (
          <div>
            <p className="text-v2-base font-medium text-v2-ink-secondary">
              {title ?? "Total sales"}
            </p>
            {loading ? (
              <span className="mt-2 block h-8 w-48 animate-pulse rounded-v2-sm bg-v2-surface-active" />
            ) : (
              <p className="mt-1 text-v2-6xl font-semibold leading-[36px] text-v2-ink tabular-nums">
                {headline ?? valueFormatter(periodTotal)}
              </p>
            )}
          </div>
        ) : (
          <h3 className="text-v2-lg font-semibold text-v2-ink">{title ?? "Sales"}</h3>
        )}
        {presets.length > 0 && presetStyle === "buttons" && (
          <div className="flex gap-2">
            {presets.map((option) => (
              <button
                key={option}
                type="button"
                data-v2
                data-press
                aria-pressed={preset === option}
                onClick={() => setPreset((current) => (current === option ? null : option))}
                className={cn(
                  "rounded-v2-xs px-3 py-1 text-v2-sm font-medium transition-colors duration-v2-fast",
                  preset === option ? "bg-v2-primary text-v2-on-primary" : "bg-v2-surface-hover text-v2-ink-tertiary hover:bg-v2-surface-active",
                  focusRing,
                )}
              >
                {option}
              </button>
            ))}
          </div>
        )}
        {presets.length > 0 && presetStyle === "segmented" && (
          <div className="flex gap-0.5 rounded-v2-md bg-v2-field p-1">
            {presets.map((option) => (
              <button
                key={option}
                type="button"
                data-v2
                data-press
                aria-pressed={preset === option}
                onClick={() =>
                  setPreset((current) => (current === option ? null : option))
                }
                className={cn(
                  "h-8 rounded-v2-sm px-3 text-v2-sm font-semibold transition-colors duration-v2-fast",
                  preset === option
                    ? "bg-v2-primary text-v2-on-primary"
                    : "bg-transparent text-v2-ink-tertiary hover:text-v2-ink",
                  focusRing,
                )}
              >
                {option}
              </button>
            ))}
          </div>
        )}
      </div>
      <div className={cn(fill && "min-h-0 flex-1")} style={fill ? { minHeight: height } : undefined}>
      {loading ? (
        <ChartSkeleton variant="daily" height={height} />
      ) : (
        <ResponsiveContainer width="100%" height={fill ? "100%" : height}>
          <BarChart
            data={visible}
            barCategoryGap="12%"
            margin={{ top: 4, right: 0, bottom: 0, left: 0 }}
          >
            <Tooltip
              cursor={{ fill: chartTheme.hover }}
              content={(props) => {
                const point = props.payload?.[0]?.payload as
                  SalesPoint | undefined;
                const index = point ? visible.indexOf(point) : -1;
                return (
                  <SalesTooltip
                    active={props.active}
                    point={point}
                    previous={visible[index - 1]}
                    formatter={valueFormatter}
                  />
                );
              }}
            />
            <Bar
              dataKey="value"
              radius={[2, 2, 0, 0]}
              isAnimationActive={false}
            >
              {visible.map((point, index) => (
                <Cell key={point.date} fill={colorFor(index)} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      )}
      </div>
      <div
        ref={trackRef}
        data-v2
        role="slider"
        tabIndex={0}
        aria-label="Selected month"
        aria-valuemin={0}
        aria-valuemax={Math.max(0, months.length - 1)}
        aria-valuenow={Math.max(
          0,
          months.findIndex((month) => month.key === selectedMonth),
        )}
        aria-valuetext={
          selectedMonth
            ? formatMonthYear(`${selectedMonth}-01`)
            : undefined
        }
        onPointerDown={(event) => {
          event.currentTarget.setPointerCapture(event.pointerId);
          setDragging(true);
          selectAt(event.clientX);
        }}
        onPointerMove={(event) => dragging && selectAt(event.clientX)}
        onPointerUp={() => setDragging(false)}
        onPointerCancel={() => setDragging(false)}
        onKeyDown={(event) => {
          const index = months.findIndex(
            (month) => month.key === selectedMonth,
          );
          if (event.key === "ArrowLeft" && index > 0) step(index - 1);
          if (event.key === "ArrowRight" && index < months.length - 1)
            step(index + 1);
        }}
        className={cn(
          "relative mt-3 h-9 touch-none select-none outline-none",
          dragging ? "cursor-grabbing" : "cursor-grab",
          focusRing,
        )}
      >
        <div className="absolute inset-x-0 top-px h-1 rounded-full bg-v2-field" />
        {!preset && firstHighlighted >= 0 && (
          <div
            className={cn(
              "absolute top-0 h-1.5 rounded-full bg-v2-primary",
              !dragging && "transition-[left,width] duration-v2-base ease-out",
            )}
            style={{
              left: `${(firstHighlighted / visible.length) * 100}%`,
              width: `${(highlighted.length / visible.length) * 100}%`,
            }}
          />
        )}
        {visibleMonths.map((month) => {
          const start = Math.max(
            0,
            visible.findIndex((point) => monthKey(point.date) === month.key),
          );
          const span = visible.filter(
            (point) => monthKey(point.date) === month.key,
          ).length;
          if (span / visible.length < 0.06) return null;
          const active = !preset && month.key === selectedMonth;
          return (
            <span
              key={month.key}
              className={cn(
                "pointer-events-none absolute top-3.5 px-1 text-v2-xs transition-colors duration-v2-fast",
                active
                  ? "font-semibold text-v2-primary"
                  : "text-v2-ink-tertiary",
              )}
              style={{ left: `${(start / visible.length) * 100}%` }}
            >
              {formatShortMonth(`${month.key}-01`)}
            </span>
          );
        })}
      </div>
    </div>
  );
}

export { SalesChart };
