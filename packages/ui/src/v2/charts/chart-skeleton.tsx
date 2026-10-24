import { cn } from "@attendance/utils";

const barHeights = [38, 62, 45, 78, 52, 88, 47, 64, 80, 36, 92, 55, 70, 42, 84, 58, 46, 74, 40, 66, 90, 44, 60, 76, 50, 68, 38, 82, 54, 46];

export type ChartSkeletonVariant = "bars" | "daily" | "line" | "ring" | "location" | "ticks";

export interface ChartSkeletonProps {
  variant: ChartSkeletonVariant;
  height?: number;
  rows?: number;
  className?: string;
}

function ChartSkeleton({ variant, height = 260, rows = 4, className }: ChartSkeletonProps) {
  if (variant === "ring") {
    return (
      <div aria-busy aria-label="Loading chart" className={cn("flex flex-col items-center gap-5", className)}>
        <div className="animate-pulse rounded-full border-[14px] border-v2-surface-active" style={{ width: height, height }} />
        <div className="flex gap-4">
          {[64, 52, 72].map((width) => (
            <span key={width} className="h-3 animate-pulse rounded-full bg-v2-surface-active" style={{ width }} />
          ))}
        </div>
      </div>
    );
  }

  if (variant === "ticks") {
    return (
      <div aria-busy aria-label="Loading chart" className={cn("flex flex-col gap-5", className)}>
        {Array.from({ length: rows }, (_, row) => (
          <div key={row}>
            <div className="mb-2 flex justify-between">
              <span className="h-3 w-28 animate-pulse rounded-full bg-v2-surface-active" />
              <span className="h-3 w-16 animate-pulse rounded-full bg-v2-surface-active" />
            </div>
            <div className="flex h-6 gap-[3px]">
              {Array.from({ length: 40 }, (_, index) => (
                <span
                  key={index}
                  className="flex-1 animate-pulse rounded-[2px] bg-v2-surface-active"
                  style={{ animationDelay: `${(index * 30) % 600}ms` }}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (variant === "line") {
    return (
      <div aria-busy aria-label="Loading chart" className={cn("relative animate-pulse", className)} style={{ height }}>
        {[0, 1, 2, 3].map((line) => (
          <span key={line} className="absolute inset-x-0 h-px bg-v2-line" style={{ top: `${12 + line * 26}%` }} />
        ))}
        <svg viewBox="0 0 400 100" preserveAspectRatio="none" className="absolute inset-0 size-full">
          <path
            d="M0 70 C 40 60, 60 40, 100 48 S 160 72, 200 52 S 260 20, 300 34 S 360 50, 400 26"
            fill="none"
            stroke="hsl(var(--v2-surface-active))"
            strokeWidth="3"
            vectorEffect="non-scaling-stroke"
          />
        </svg>
      </div>
    );
  }

  const count = variant === "daily" ? 30 : variant === "location" ? 5 : 8;
  return (
    <div aria-busy aria-label="Loading chart" className={cn("flex items-end", variant === "location" ? "gap-[2px]" : "gap-1.5", className)} style={{ height }}>
      {Array.from({ length: count }, (_, index) => (
        <span
          key={index}
          className={cn(
            "flex-1 animate-pulse bg-v2-surface-active",
            variant === "location" ? "border-t-[3px] border-v2-line-strong" : "rounded-t-[2px]",
          )}
          style={{
            height: `${variant === "location" ? 100 - index * 17 : barHeights[index % barHeights.length]}%`,
            animationDelay: `${(index * 40) % 600}ms`,
          }}
        />
      ))}
    </div>
  );
}

export { ChartSkeleton };
