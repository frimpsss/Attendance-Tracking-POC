import * as React from "react";

import { cn } from "@attendance/utils";
import { Skeleton } from "./skeleton";

export interface StatCardProps {
  label: React.ReactNode;
  value: React.ReactNode;
  currency?: string;
  masked?: boolean;
  compact?: boolean;
  caption?: React.ReactNode;
  loading?: boolean;
  className?: string;
}

function StatCard({ label, value, caption, loading, className }: StatCardProps) {
  return (
    <div className={cn("font-v2 flex min-w-0 flex-col py-2", className)}>
      <p className="text-v2-2xs font-medium uppercase leading-[16px] tracking-[0.08em] text-v2-ink-tertiary">
        {label}
      </p>
      {loading ? (
        <Skeleton className="mt-4 h-9 w-2/3" />
      ) : (
        <p className="mt-4 whitespace-nowrap text-v2-4xl font-semibold leading-[32px] text-v2-ink tabular-nums md:text-v2-6xl md:leading-[36px] xl:text-v2-8xl xl:leading-[44px]">
          {value}
        </p>
      )}
      {caption && !loading && <p className="mt-1 text-v2-meta leading-[18px] text-v2-ink-tertiary">{caption}</p>}
      {caption && loading && <Skeleton className="mt-2 h-3 w-24" />}
    </div>
  );
}

export interface StatCardsProps {
  items: Omit<StatCardProps, "loading" | "className">[];
  columns?: number;
  loading?: boolean;
  className?: string;
}

const columnClass: Record<number, string> = {
  1: "sm:grid-cols-1",
  2: "sm:grid-cols-2",
  3: "sm:grid-cols-3",
  4: "sm:grid-cols-2 lg:grid-cols-4",
  5: "sm:grid-cols-3 lg:grid-cols-5",
  6: "sm:grid-cols-3 lg:grid-cols-6",
};

function StatCards({ items, columns, loading, className }: StatCardsProps) {
  const count = columns ?? Math.min(items.length, 6);
  return (
    <div
      className={cn(
        "grid grid-cols-1 gap-x-10 gap-y-6",
        columnClass[Math.min(count, 6)],
        className,
      )}
    >
      {items.map((item, index) => (
        <StatCard key={index} {...item} loading={loading} />
      ))}
    </div>
  );
}

export { StatCard, StatCards };
