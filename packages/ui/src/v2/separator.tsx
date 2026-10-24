import * as React from "react";
import * as SeparatorPrimitive from "@radix-ui/react-separator";

import { cn } from "@attendance/utils";

export interface SeparatorProps
  extends React.ComponentPropsWithoutRef<typeof SeparatorPrimitive.Root> {
  label?: React.ReactNode;
}

const Separator = React.forwardRef<
  React.ElementRef<typeof SeparatorPrimitive.Root>,
  SeparatorProps
>(({ className, orientation = "horizontal", decorative = true, label, ...props }, ref) => {
  if (label && orientation === "horizontal") {
    return (
      <div className={cn("font-v2 flex items-center gap-3", className)}>
        <span className="h-px flex-1 bg-v2-line" />
        <span className="text-v2-xs text-v2-ink-tertiary">{label}</span>
        <span className="h-px flex-1 bg-v2-line" />
      </div>
    );
  }
  return (
    <SeparatorPrimitive.Root
      ref={ref}
      decorative={decorative}
      orientation={orientation}
      className={cn(
        "shrink-0 bg-v2-line",
        orientation === "horizontal" ? "h-px w-full" : "h-full w-px",
        className,
      )}
      {...props}
    />
  );
});
Separator.displayName = "Separator";

export { Separator };
