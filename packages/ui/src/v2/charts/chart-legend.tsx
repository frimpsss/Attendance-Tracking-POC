import { cn } from "@attendance/utils";

export interface ChartLegendItem {
  label: string;
  color: string;
  value?: string;
}

function ChartLegend({ items, className, always = false }: { items: ChartLegendItem[]; className?: string; always?: boolean }) {
  if (items.length < (always ? 1 : 2)) return null;
  return (
    <ul className={cn("flex flex-wrap items-center gap-x-5 gap-y-1.5", className)}>
      {items.map((item) => (
        <li key={item.label} className="flex items-center gap-2 text-v2-meta text-v2-ink-secondary">
          <span className="size-2 shrink-0 rounded-[2px]" style={{ backgroundColor: item.color }} />
          {item.label}
          {item.value && <span className="font-medium tabular-nums text-v2-ink">{item.value}</span>}
        </li>
      ))}
    </ul>
  );
}

export { ChartLegend };
