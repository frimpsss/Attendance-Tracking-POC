import type { ValueFormatter } from "./palette";

interface TooltipEntry {
  dataKey?: string | number;
  name?: string | number;
  value?: number | string;
  color?: string;
  payload?: Record<string, unknown>;
}

export interface ChartTooltipProps {
  active?: boolean;
  label?: string | number;
  payload?: TooltipEntry[];
  formatter: ValueFormatter;
  colorFor: (entry: TooltipEntry) => string;
  labelFor: (entry: TooltipEntry) => string;
  title?: string;
}

function ChartTooltip({ active, label, payload, formatter, colorFor, labelFor, title }: ChartTooltipProps) {
  if (!active || !payload?.length) return null;
  return (
    <div className="font-v2 min-w-[140px] rounded-v2-md border border-v2-line bg-v2-canvas px-3 py-2">
      {(title ?? label) !== undefined && (
        <p className="mb-1.5 text-v2-xs font-medium text-v2-ink-secondary">{title ?? label}</p>
      )}
      <div className="flex flex-col gap-1">
        {payload.map((entry) => (
          <div key={String(entry.dataKey ?? entry.name)} className="flex items-center gap-2 text-v2-meta">
            <span className="size-2 shrink-0 rounded-[2px]" style={{ backgroundColor: colorFor(entry) }} />
            <span className="flex-1 text-v2-ink-secondary">{labelFor(entry)}</span>
            <span className="font-medium tabular-nums text-v2-ink">{formatter(Number(entry.value ?? 0))}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export { ChartTooltip };
