import * as React from "react";
import * as TooltipPrimitive from "@radix-ui/react-tooltip";

import { cn } from "@attendance/utils";

export interface TooltipProps {
  content: React.ReactNode;
  side?: "top" | "right" | "bottom" | "left";
  align?: "start" | "center" | "end";
  delay?: number;
  className?: string;
  children: React.ReactElement;
}

function Tooltip({ content, side = "top", align = "center", delay = 200, className, children }: TooltipProps) {
  return (
    <TooltipPrimitive.Provider delayDuration={delay}>
      <TooltipPrimitive.Root>
        <TooltipPrimitive.Trigger asChild>{children}</TooltipPrimitive.Trigger>
        <TooltipPrimitive.Portal>
          <TooltipPrimitive.Content
            side={side}
            align={align}
            sideOffset={6}
            className={cn(
              "font-v2 z-v2-tooltip max-w-xs rounded-v2-sm bg-v2-ink px-2 py-1 text-v2-xs font-medium leading-[16px] text-v2-canvas animate-in fade-in-0 zoom-in-[0.98] data-[state=closed]:animate-out data-[state=closed]:fade-out-0",
              className,
            )}
          >
            {content}
          </TooltipPrimitive.Content>
        </TooltipPrimitive.Portal>
      </TooltipPrimitive.Root>
    </TooltipPrimitive.Provider>
  );
}

export { Tooltip };
