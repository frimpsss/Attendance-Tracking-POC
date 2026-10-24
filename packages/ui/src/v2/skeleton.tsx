import * as React from "react";

import { cn } from "@attendance/utils";

function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      aria-hidden
      className={cn("animate-pulse rounded-v2-sm bg-v2-surface-active", className)}
      {...props}
    />
  );
}

export { Skeleton };
