export const seriesColors = ["hsl(var(--v2-chart-1))", "hsl(var(--v2-chart-2))", "hsl(var(--v2-chart-3))"] as const;

export const chartColor = (token: string, alpha?: number) =>
  alpha === undefined ? `hsl(var(--v2-${token}))` : `hsl(var(--v2-${token}) / ${alpha})`;

export const chartTheme = {
  grid: "hsl(var(--v2-chart-grid))",
  axis: "hsl(var(--v2-chart-axis))",
  cursor: "hsl(var(--v2-chart-cursor))",
  surface: "hsl(var(--v2-canvas))",
  hover: "hsl(var(--v2-chart-hover))",
  muted: "hsl(var(--v2-chart-muted))",
  fontSize: 12,
} as const;

export interface ChartSeries {
  key: string;
  label: string;
}

export type ValueFormatter = (value: number) => string;

export const defaultFormatter: ValueFormatter = (value) => value.toLocaleString();

export const compactFormatter: ValueFormatter = (value) =>
  Intl.NumberFormat(undefined, { notation: "compact", maximumFractionDigits: 1 }).format(value);
