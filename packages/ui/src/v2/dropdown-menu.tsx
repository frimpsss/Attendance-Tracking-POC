import * as React from "react";
import * as DropdownPrimitive from "@radix-ui/react-dropdown-menu";
import { Check } from "lucide-react";

import { cn } from "@attendance/utils";
import { floatingItem, floatingSurface } from "./shared/styles";

export type DropdownMenuItem =
  | {
      type?: "item";
      label: React.ReactNode;
      icon?: React.ReactNode;
      shortcut?: string;
      tone?: "default" | "danger";
      disabled?: boolean;
      onSelect?: () => void;
    }
  | {
      type: "checkbox";
      label: React.ReactNode;
      checked: boolean;
      disabled?: boolean;
      onCheckedChange: (checked: boolean) => void;
    }
  | { type: "label"; label: React.ReactNode }
  | { type: "separator" };

export interface DropdownMenuProps {
  trigger: React.ReactNode;
  items: DropdownMenuItem[];
  align?: "start" | "center" | "end";
  side?: "top" | "right" | "bottom" | "left";
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  className?: string;
}

function DropdownMenu({ trigger, items, align = "start", side = "bottom", open, onOpenChange, className }: DropdownMenuProps) {
  return (
    <DropdownPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DropdownPrimitive.Trigger asChild>{trigger}</DropdownPrimitive.Trigger>
      <DropdownPrimitive.Portal>
        <DropdownPrimitive.Content
          align={align}
          side={side}
          sideOffset={4}
          className={cn(floatingSurface, "min-w-[200px] p-1", className)}
        >
          {items.map((item, index) => {
            if (item.type === "separator") {
              return <DropdownPrimitive.Separator key={index} className="-mx-1 my-1 h-px bg-v2-line" />;
            }
            if (item.type === "label") {
              return (
                <DropdownPrimitive.Label
                  key={index}
                  className="px-2 pb-1 pt-2 text-v2-2xs font-semibold uppercase tracking-[0.08em] text-v2-ink-tertiary"
                >
                  {item.label}
                </DropdownPrimitive.Label>
              );
            }
            if (item.type === "checkbox") {
              return (
                <DropdownPrimitive.CheckboxItem
                  data-v2
                  key={index}
                  checked={item.checked}
                  disabled={item.disabled}
                  onCheckedChange={item.onCheckedChange}
                  onSelect={(event) => event.preventDefault()}
                  className={cn(floatingItem, "pl-8")}
                >
                  <span className="absolute left-2 flex items-center">
                    <DropdownPrimitive.ItemIndicator>
                      <Check className="!text-v2-primary" />
                    </DropdownPrimitive.ItemIndicator>
                  </span>
                  {item.label}
                </DropdownPrimitive.CheckboxItem>
              );
            }
            return (
              <DropdownPrimitive.Item
                data-v2
                key={index}
                disabled={item.disabled}
                onSelect={item.onSelect}
                className={cn(
                  floatingItem,
                  item.tone === "danger" &&
                    "text-v2-danger data-[highlighted]:bg-v2-danger-soft [&_svg]:text-v2-danger",
                )}
              >
                {item.icon}
                <span className="flex-1">{item.label}</span>
                {item.shortcut && (
                  <span className="ml-4 text-v2-2xs tracking-wide text-v2-ink-tertiary">{item.shortcut}</span>
                )}
              </DropdownPrimitive.Item>
            );
          })}
        </DropdownPrimitive.Content>
      </DropdownPrimitive.Portal>
    </DropdownPrimitive.Root>
  );
}

export { DropdownMenu };
