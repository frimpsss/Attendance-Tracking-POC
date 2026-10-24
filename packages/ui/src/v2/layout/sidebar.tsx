import * as React from "react";
import { ChevronDown, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";

import { cn } from "@attendance/utils";
import { focusRing } from "../shared/styles";
import { Tooltip } from "../tooltip";

export interface SidebarItem {
  label: string;
  icon?: React.ReactNode;
  href?: string;
  active?: boolean;
  badge?: React.ReactNode;
  onClick?: () => void;
  children?: SidebarItem[];
}

export interface SidebarSection {
  label?: string;
  items: SidebarItem[];
}

export interface SidebarProps {
  logo?: React.ReactNode;
  collapsedLogo?: React.ReactNode;
  sections: SidebarSection[];
  footer?: React.ReactNode;
  collapsed?: boolean;
  onCollapsedChange?: (collapsed: boolean) => void;
  onNavigate?: (href: string) => void;
  className?: string;
}

type Navigate = SidebarProps["onNavigate"];

function linkClick(href: string | undefined, onClick: (() => void) | undefined, onNavigate: Navigate) {
  return (event: React.MouseEvent<HTMLAnchorElement>) => {
    onClick?.();
    if (!href || !onNavigate || event.defaultPrevented || event.button !== 0) return;
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    onNavigate(href);
  };
}

function Badge({ children, active }: { children: React.ReactNode; active?: boolean }) {
  return (
    <span
      className={cn(
        "inline-flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-v2-2xs font-semibold leading-none tabular-nums transition-colors duration-v2-base",
        active ? "bg-v2-primary text-v2-on-primary" : "bg-v2-surface-active text-v2-ink-secondary group-hover:bg-v2-primary-soft group-hover:text-v2-primary",
      )}
    >
      {children}
    </span>
  );
}

function NavItem({ item, collapsed, onNavigate }: { item: SidebarItem; collapsed: boolean; onNavigate?: Navigate }) {
  const hasChildren = Boolean(item.children?.length);
  const childActive = item.children?.some((child) => child.active) ?? false;
  const [open, setOpen] = React.useState(childActive);
  const highlighted = item.active || childActive;

  const className = cn(
    "group relative flex w-full items-center gap-3 rounded-v2-sm py-2.5 text-left text-v2-base transition-colors duration-v2-base",
    collapsed ? "justify-center px-2" : "px-3",
    highlighted ? "font-semibold text-v2-primary" : "font-medium text-v2-ink-tertiary hover:text-v2-primary",
    focusRing,
  );

  const content = (
    <>
      {item.icon && (
        <span
          className={cn(
            "flex size-5 shrink-0 items-center justify-center transition-colors duration-v2-base [&_svg]:size-[19px]",
            highlighted ? "text-v2-primary" : "text-v2-ink-tertiary/80 group-hover:text-v2-primary",
          )}
        >
          {item.icon}
        </span>
      )}
      {!collapsed && (
        <>
          <span className="min-w-0 flex-1 truncate">{item.label}</span>
          {item.badge !== undefined && <Badge active={item.active}>{item.badge}</Badge>}
          {hasChildren &&
            (open ? <ChevronDown className="size-4 shrink-0" /> : <ChevronRight className="size-4 shrink-0" />)}
        </>
      )}
    </>
  );

  const trigger =
    item.href && !hasChildren ? (
      <a href={item.href} data-v2 aria-current={item.active ? "page" : undefined} onClick={linkClick(item.href, item.onClick, onNavigate)} className={className}>
        {content}
      </a>
    ) : (
      <button
        type="button"
        data-v2
        aria-expanded={hasChildren ? open : undefined}
        onClick={() => {
          if (hasChildren) setOpen((value) => !value);
          item.onClick?.();
        }}
        className={className}
      >
        {content}
      </button>
    );

  return (
    <li>
      {collapsed ? (
        <Tooltip content={item.label} side="right">
          {trigger}
        </Tooltip>
      ) : (
        trigger
      )}
      {hasChildren && open && !collapsed && (
        <ul className="relative ml-9 animate-in fade-in-0 slide-in-from-top-1 duration-v2-base">
          <span aria-hidden className="absolute -left-3 top-0 h-full w-0.5 rounded-full bg-v2-line" />
          {item.children?.map((child) => (
            <li key={child.label}>
              <a
                href={child.href}
                data-v2
                aria-current={child.active ? "page" : undefined}
                onClick={linkClick(child.href, child.onClick, onNavigate)}
                className={cn(
                  "group relative flex w-full items-center gap-3 rounded-v2-sm px-3 py-2 text-v2-base transition-colors duration-v2-base",
                  child.active ? "font-semibold text-v2-primary" : "text-v2-ink-tertiary hover:text-v2-primary",
                  focusRing,
                )}
              >
                <span
                  aria-hidden
                  className={cn(
                    "absolute -left-3 top-0 h-full rounded-full transition-all duration-v2-base",
                    child.active ? "w-0.5 bg-v2-primary" : "w-0 group-hover:w-0.5 group-hover:bg-v2-primary/25",
                  )}
                />
                <span className="flex-1 truncate">{child.label}</span>
                {child.badge !== undefined && <Badge active={child.active}>{child.badge}</Badge>}
              </a>
            </li>
          ))}
        </ul>
      )}
    </li>
  );
}

function Sidebar({ logo, collapsedLogo, sections, footer, collapsed = false, onCollapsedChange, onNavigate, className }: SidebarProps) {
  const [logoHovered, setLogoHovered] = React.useState(false);

  return (
    <aside
      data-v2
      data-collapsed={collapsed || undefined}
      className={cn(
        "font-v2 group/sidebar flex h-full flex-col bg-v2-surface transition-[width] duration-v2-slow ease-out",
        collapsed ? "w-v2-sidebar-collapsed" : "w-v2-sidebar",
        className,
      )}
    >
      <div className={cn("flex h-16 shrink-0 items-center", collapsed ? "justify-center px-2" : "justify-between px-4")}>
        {collapsed ? (
          onCollapsedChange ? (
            <button
              type="button"
              data-v2
              title="Expand sidebar"
              aria-label="Expand sidebar"
              onClick={() => onCollapsedChange(false)}
              onMouseEnter={() => setLogoHovered(true)}
              onMouseLeave={() => setLogoHovered(false)}
              className={cn(
                "flex size-10 items-center justify-center rounded-v2-sm bg-transparent transition-colors duration-v2-base",
                logoHovered && "bg-v2-primary-soft",
                focusRing,
              )}
            >
              {logoHovered ? <ChevronsRight className="size-5 text-v2-primary" /> : (collapsedLogo ?? logo)}
            </button>
          ) : (
            <span className="flex size-10 items-center justify-center">{collapsedLogo ?? logo}</span>
          )
        ) : (
          <>
            <div className="min-w-0">{logo}</div>
            {onCollapsedChange && (
              <button
                type="button"
                data-v2
                title="Collapse sidebar"
                aria-label="Collapse sidebar"
                onClick={() => onCollapsedChange(true)}
                className={cn(
                  "flex size-8 items-center justify-center rounded-v2-sm bg-transparent text-v2-ink-tertiary opacity-0 transition-[opacity,color,background-color] duration-v2-base hover:bg-v2-surface-hover hover:text-v2-ink focus-visible:opacity-100 group-hover/sidebar:opacity-100",
                  focusRing,
                )}
              >
                <ChevronsLeft className="size-[18px]" />
              </button>
            )}
          </>
        )}
      </div>
      <nav className="flex-1 overflow-y-auto p-2">
        {sections.map((section, index) => (
          <div key={section.label ?? index} className={cn(index > 0 && "mt-4")}>
            {section.label && !collapsed && (
              <p className="mb-1 px-3 text-v2-xs font-medium text-v2-ink-tertiary/80">{section.label}</p>
            )}
            <ul className="flex flex-col gap-1">
              {section.items.map((item) => (
                <NavItem key={item.label} item={item} collapsed={collapsed} onNavigate={onNavigate} />
              ))}
            </ul>
          </div>
        ))}
      </nav>
      {footer && <div className={cn("shrink-0", collapsed ? "p-2" : "p-4")}>{footer}</div>}
    </aside>
  );
}

export { Sidebar };
