import * as React from "react";
import * as DropdownPrimitive from "@radix-ui/react-dropdown-menu";
import { HelpCircle } from "lucide-react";

import { cn } from "@attendance/utils";
import { Button } from "../button";
import { floatingSurface } from "../shared/styles";
import { SidebarAction } from "./sidebar-action";

export interface HelpMenuItem {
  label: string;
  description?: string;
  icon: React.ReactNode;
  href?: string;
  badge?: string;
  shortcut?: string;
  onSelect?: () => void;
}

export interface HelpMenuProps {
  items: HelpMenuItem[];
  footer?: React.ReactNode;
  variant?: "icon" | "sidebar";
}

function HelpMenu({ items, footer, variant = "icon" }: HelpMenuProps) {
  const inSidebar = variant === "sidebar";

  return (
    <DropdownPrimitive.Root>
      <DropdownPrimitive.Trigger asChild>
        {inSidebar ? (
          <SidebarAction icon={<HelpCircle />} label="Help & support" />
        ) : (
          <Button variant="ghost" size="icon-sm" aria-label="Help">
            <HelpCircle />
          </Button>
        )}
      </DropdownPrimitive.Trigger>
      <DropdownPrimitive.Portal>
        <DropdownPrimitive.Content align="end" side={inSidebar ? "right" : "bottom"} sideOffset={inSidebar ? 12 : 8} className={cn(floatingSurface, "w-80 p-1.5")}>
          <p className="px-2.5 pb-1.5 pt-2 text-v2-md font-semibold text-v2-ink">Help & support</p>
          {items.map((item) => {
            const content = (
              <>
                <span className="flex size-9 shrink-0 items-center justify-center rounded-v2-sm bg-v2-field text-v2-ink-secondary [&_svg]:size-4">
                  {item.icon}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex items-center gap-2 text-v2-ui font-medium text-v2-ink">
                    {item.label}
                    {item.badge && (
                      <span className="rounded-v2-xs bg-v2-primary-soft px-1.5 text-v2-2xs font-semibold text-v2-primary">{item.badge}</span>
                    )}
                  </span>
                  {item.description && <span className="block truncate text-v2-meta text-v2-ink-tertiary">{item.description}</span>}
                </span>
                {item.shortcut && <span className="text-v2-2xs text-v2-ink-tertiary">{item.shortcut}</span>}
              </>
            );
            return (
              <DropdownPrimitive.Item
                key={item.label}
                data-v2
                asChild={Boolean(item.href)}
                onSelect={item.onSelect}
                className="flex cursor-pointer select-none items-center gap-3 rounded-v2-sm px-2.5 py-2 outline-none transition-colors duration-v2-fast data-[highlighted]:bg-v2-surface-hover"
              >
                {item.href ? (
                  <a href={item.href} target={item.href.startsWith("http") ? "_blank" : undefined} rel="noreferrer">
                    {content}
                  </a>
                ) : (
                  content
                )}
              </DropdownPrimitive.Item>
            );
          })}
          {footer && (
            <>
              <DropdownPrimitive.Separator className="-mx-1.5 my-1 h-px bg-v2-line" />
              <div className="px-2.5 py-2 text-v2-xs text-v2-ink-tertiary">{footer}</div>
            </>
          )}
        </DropdownPrimitive.Content>
      </DropdownPrimitive.Portal>
    </DropdownPrimitive.Root>
  );
}

export { HelpMenu };
