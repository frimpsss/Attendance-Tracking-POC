import * as React from "react";
import { Info } from "lucide-react";

import { cn } from "@attendance/utils";
import { Button } from "../button";
import { Tooltip } from "../tooltip";
import { defaultFormatter, type ValueFormatter } from "./palette";

export interface RangeBarsItem {
  label: string;
  value: number;
  href?: string;
}

export interface RangeBarsProps {
  items: RangeBarsItem[];
  title?: React.ReactNode;
  info?: React.ReactNode;
  total?: number;
  limit?: number;
  sort?: boolean;
  valueFormatter?: ValueFormatter;
  loading?: boolean;
  className?: string;
}

const percentLabel = (share: number) => (share > 0 && share < 0.01 ? "<1%" : `${Math.round(share * 100)}%`);

function RangeBars({
  items,
  title,
  info,
  total,
  limit,
  sort = true,
  valueFormatter = defaultFormatter,
  loading = false,
  className,
}: RangeBarsProps) {
  const [expanded, setExpanded] = React.useState(false);
  const rows = React.useMemo(() => (sort ? [...items].sort((a, b) => b.value - a.value) : items), [items, sort]);
  const sum = total ?? rows.reduce((acc, item) => acc + item.value, 0);
  const max = Math.max(0, ...rows.map((row) => row.value));
  const visible = limit && !expanded ? rows.slice(0, limit) : rows;

  return (
    <div className={cn("font-v2", className)}>
      {title && (
        <div className="mb-3 flex items-center gap-1.5">
          <p className="text-v2-md text-v2-ink-secondary">{title}</p>
          {info && (
            <Tooltip content={info}>
              <span data-v2 tabIndex={0} className="flex text-v2-ink-tertiary outline-none hover:text-v2-ink">
                <Info className="size-4" />
              </span>
            </Tooltip>
          )}
        </div>
      )}
      <ul className="flex flex-col">
        {loading
          ? Array.from({ length: limit ?? 4 }, (_, index) => (
              <li key={index} className="py-3.5">
                <div className="flex justify-between">
                  <span className="h-3.5 w-40 animate-pulse rounded-full bg-v2-surface-active" />
                  <span className="h-3.5 w-24 animate-pulse rounded-full bg-v2-surface-active" />
                </div>
                <span className="mt-3 block h-1 animate-pulse rounded-full bg-v2-surface-active" />
              </li>
            ))
          : visible.map((row) => {
              const share = sum ? row.value / sum : 0;
              const width = max ? (row.value / max) * 100 : 0;
              const content = (
                <>
                  <div className="flex items-baseline gap-4">
                    <span className="min-w-0 flex-1 truncate text-v2-lg text-v2-ink">{row.label}</span>
                    <span className="shrink-0 text-v2-lg font-medium tabular-nums text-v2-ink">{valueFormatter(row.value)}</span>
                    <span className="w-9 shrink-0 text-right text-v2-sm tabular-nums text-v2-ink-tertiary">{percentLabel(share)}</span>
                  </div>
                  <div className="mt-3 h-1 overflow-hidden rounded-full bg-v2-field">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-v2-primary/20 to-v2-primary/55 transition-[width] duration-v2-slow ease-v2-out group-hover:to-v2-primary/80"
                      style={{ width: `${Math.max(width, row.value > 0 ? 0.6 : 0)}%` }}
                    />
                  </div>
                </>
              );
              return (
                <li key={row.label}>
                  {row.href ? (
                    <a
                      href={row.href}
                      data-v2
                      className="group block rounded-v2-xs py-3.5 outline-none focus-visible:ring-v2 focus-visible:ring-v2-focus"
                    >
                      {content}
                    </a>
                  ) : (
                    <div className="py-3.5">{content}</div>
                  )}
                </li>
              );
            })}
      </ul>
      {limit && rows.length > limit && !loading && (
        <Button variant="link" className="mt-2 text-v2-sm" onClick={() => setExpanded((value) => !value)}>
          {expanded ? "Show less" : `Show all ${rows.length}`}
        </Button>
      )}
    </div>
  );
}

export { RangeBars };
