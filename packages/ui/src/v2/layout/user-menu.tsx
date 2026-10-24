import * as React from "react";
import * as DropdownPrimitive from "@radix-ui/react-dropdown-menu";
import { Check, ChevronsUpDown, LogOut } from "lucide-react";

import { cn } from "@attendance/utils";
import { Avatar } from "../avatar";
import { floatingItem, floatingSurface, focusRing } from "../shared/styles";

export interface UserMenuUser {
  name: string;
  email: string;
  role?: string;
  avatar?: string;
}

export interface UserMenuItem {
  label: string;
  icon?: React.ReactNode;
  href?: string;
  shortcut?: string;
  onSelect?: () => void;
}

export interface UserMenuProps {
  user: UserMenuUser;
  organizations?: { id: string; name: string }[];
  currentOrganization?: string;
  onOrganizationChange?: (id: string) => void;
  items?: UserMenuItem[][];
  onSignOut?: () => void;
  variant?: "card" | "avatar";
  align?: "start" | "end";
  side?: "top" | "bottom" | "right";
}

function MenuItem({ item }: { item: UserMenuItem }) {
  const content = (
    <>
      {item.icon}
      <span className="flex-1">{item.label}</span>
      {item.shortcut && <span className="text-v2-2xs text-v2-ink-tertiary">{item.shortcut}</span>}
    </>
  );
  return (
    <DropdownPrimitive.Item data-v2 asChild={Boolean(item.href)} onSelect={item.onSelect} className={floatingItem}>
      {item.href ? <a href={item.href}>{content}</a> : content}
    </DropdownPrimitive.Item>
  );
}

function UserMenu({
  user,
  organizations,
  currentOrganization,
  onOrganizationChange,
  items = [],
  onSignOut,
  variant = "avatar",
  align = "end",
  side = "bottom",
}: UserMenuProps) {
  const organization = organizations?.find((org) => org.id === currentOrganization);

  return (
    <DropdownPrimitive.Root>
      <DropdownPrimitive.Trigger
        data-v2
        data-press={variant === "avatar" ? "sm" : undefined}
        aria-label="Account menu"
        className={cn(
          "font-v2 outline-none transition-colors duration-v2-fast",
          variant === "card"
            ? "flex w-full items-center gap-3 rounded-v2-sm bg-transparent px-3 py-2.5 text-left hover:bg-v2-surface-hover data-[state=open]:bg-v2-surface-hover group-data-[collapsed]/sidebar:justify-center group-data-[collapsed]/sidebar:px-0"
            : "rounded-full",
          focusRing,
        )}
      >
        <Avatar name={user.name} src={user.avatar} size={variant === "card" ? "md" : "sm"} shape={variant === "card" ? "square" : "circle"} />
        {variant === "card" && (
          <>
            <span className="min-w-0 flex-1 group-data-[collapsed]/sidebar:hidden">
              <span className="block truncate text-v2-ui font-semibold text-v2-ink">{user.name}</span>
              <span className="block truncate text-v2-xs text-v2-ink-tertiary">
                {[organization?.name, user.role].filter(Boolean).join(" · ") || user.email}
              </span>
            </span>
            <ChevronsUpDown className="size-4 shrink-0 text-v2-ink-tertiary group-data-[collapsed]/sidebar:hidden" />
          </>
        )}
      </DropdownPrimitive.Trigger>
      <DropdownPrimitive.Portal>
        <DropdownPrimitive.Content align={align} side={side} sideOffset={8} className={cn(floatingSurface, "w-72 p-1.5")}>
          <div className="flex items-center gap-3 px-2.5 pb-3 pt-2">
            <Avatar name={user.name} src={user.avatar} size="lg" />
            <div className="min-w-0">
              <p className="truncate text-v2-base font-semibold text-v2-ink">{user.name}</p>
              <p className="truncate text-v2-meta text-v2-ink-tertiary">{user.email}</p>
            </div>
          </div>
          {organizations && organizations.length > 0 && (
            <>
              <DropdownPrimitive.Separator className="-mx-1.5 my-1 h-px bg-v2-line" />
              <DropdownPrimitive.Label className="px-2.5 pb-1 pt-2 text-v2-2xs font-semibold uppercase tracking-[0.08em] text-v2-ink-tertiary">
                Organizations
              </DropdownPrimitive.Label>
              <div className="max-h-64 overflow-y-auto">
                {organizations.map((org) => (
                  <DropdownPrimitive.Item
                    key={org.id}
                    data-v2
                    onSelect={() => onOrganizationChange?.(org.id)}
                    className={floatingItem}
                  >
                    <Avatar name={org.name} size="xs" shape="square" />
                    <span className="flex-1 truncate">{org.name}</span>
                    {org.id === currentOrganization && <Check className="!text-v2-primary" />}
                  </DropdownPrimitive.Item>
                ))}
              </div>
            </>
          )}
          {items.map((group, index) => (
            <React.Fragment key={index}>
              <DropdownPrimitive.Separator className="-mx-1.5 my-1 h-px bg-v2-line" />
              {group.map((item) => (
                <MenuItem key={item.label} item={item} />
              ))}
            </React.Fragment>
          ))}
          {onSignOut && (
            <>
              <DropdownPrimitive.Separator className="-mx-1.5 my-1 h-px bg-v2-line" />
              <DropdownPrimitive.Item
                data-v2
                onSelect={onSignOut}
                className={cn(floatingItem, "text-v2-danger data-[highlighted]:bg-v2-danger-soft [&_svg]:!text-v2-danger")}
              >
                <LogOut />
                Sign out
              </DropdownPrimitive.Item>
            </>
          )}
        </DropdownPrimitive.Content>
      </DropdownPrimitive.Portal>
    </DropdownPrimitive.Root>
  );
}

export { UserMenu };
