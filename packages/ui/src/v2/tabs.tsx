import * as React from "react";
import * as TabsPrimitive from "@radix-ui/react-tabs";

import { cn } from "@attendance/utils";
import { focusRing } from "./shared/styles";

export interface TabItem {
  value: string;
  label: React.ReactNode;
  icon?: React.ReactNode;
  count?: number;
  content?: React.ReactNode;
  disabled?: boolean;
}

export interface TabsProps
  extends Omit<React.ComponentPropsWithoutRef<typeof TabsPrimitive.Root>, "children"> {
  items: TabItem[];
  variant?: "underline" | "segmented";
  listClassName?: string;
  contentClassName?: string;
  actions?: React.ReactNode;
}

function Tabs({
  items,
  variant = "underline",
  defaultValue,
  listClassName,
  contentClassName,
  actions,
  className,
  ...props
}: TabsProps) {
  return (
    <TabsPrimitive.Root
      defaultValue={defaultValue ?? (props.value === undefined ? items[0]?.value : undefined)}
      className={cn("font-v2", className)}
      {...props}
    >
      <TabsPrimitive.List
        className={cn(
          "inline-flex items-center",
          variant === "underline" && "w-full gap-5 border-b border-v2-line",
          variant === "segmented" && "gap-0.5 rounded-v2-md bg-v2-field p-1",
          listClassName,
        )}
      >
        {items.map((item) => (
          <TabsPrimitive.Trigger
            key={item.value}
            value={item.value}
            disabled={item.disabled}
            data-v2
            data-press
            className={cn(
              "group inline-flex items-center justify-center gap-1.5 whitespace-nowrap bg-transparent text-v2-base font-medium text-v2-ink-tertiary transition-colors hover:text-v2-ink disabled:pointer-events-none disabled:opacity-v2-disabled [&_svg]:size-4",
              focusRing,
              variant === "underline" &&
                "relative -mb-px h-10 border-b-2 border-transparent data-[state=active]:border-v2-primary data-[state=active]:text-v2-ink",
              variant === "segmented" &&
                "h-v2-control-sm rounded-v2-sm px-3.5 data-[state=active]:bg-v2-canvas data-[state=active]:text-v2-ink",
            )}
          >
            {item.icon}
            {item.label}
            {item.count !== undefined && (
              <span className="rounded-v2-xs bg-v2-surface-hover px-1.5 text-v2-2xs tabular-nums text-v2-ink-secondary group-data-[state=active]:bg-v2-primary-soft group-data-[state=active]:text-v2-primary">
                {item.count}
              </span>
            )}
          </TabsPrimitive.Trigger>
        ))}
        {actions && <div className="ml-auto flex items-center gap-2 pb-1.5">{actions}</div>}
      </TabsPrimitive.List>
      {items.map(
        (item) =>
          item.content !== undefined && (
            <TabsPrimitive.Content
              key={item.value}
              value={item.value}
              className={cn("mt-4 outline-none", contentClassName)}
            >
              {item.content}
            </TabsPrimitive.Content>
          ),
      )}
    </TabsPrimitive.Root>
  );
}

export { Tabs };
