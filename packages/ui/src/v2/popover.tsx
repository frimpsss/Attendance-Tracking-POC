import * as React from "react";
import * as PopoverPrimitive from "@radix-ui/react-popover";

import { cn } from "@attendance/utils";
import { floatingSurface } from "./shared/styles";

export interface PopoverProps {
  trigger: React.ReactNode;
  content: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  align?: "start" | "center" | "end";
  side?: "top" | "right" | "bottom" | "left";
  className?: string;
}

function Popover({ trigger, content, open, onOpenChange, align = "center", side = "bottom", className }: PopoverProps) {
  return (
    <PopoverPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <PopoverPrimitive.Trigger asChild>{trigger}</PopoverPrimitive.Trigger>
      <PopoverPrimitive.Portal>
        <PopoverPrimitive.Content
          align={align}
          side={side}
          sideOffset={6}
          className={cn(floatingSurface, "w-72 p-4 text-v2-ui outline-none", className)}
        >
          {content}
        </PopoverPrimitive.Content>
      </PopoverPrimitive.Portal>
    </PopoverPrimitive.Root>
  );
}

export { Popover };
