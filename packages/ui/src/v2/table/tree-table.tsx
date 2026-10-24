import * as React from "react";
import { ChevronRight } from "lucide-react";

import { cn } from "@attendance/utils";
import { DropdownMenu, type DropdownMenuItem } from "../dropdown-menu";
import { focusRing } from "../shared/styles";
import { Skeleton } from "../skeleton";

export interface TreeTableColumn<T> {
  key: string;
  header: React.ReactNode;
  cell: (row: T, depth: number) => React.ReactNode;
  align?: "left" | "right";
  width?: number;
  hideBelow?: "sm" | "md" | "lg";
  className?: string;
}

export interface TreeTableProps<T> {
  data: T[];
  columns: TreeTableColumn<T>[];
  rowKey: (row: T) => string;
  getChildren: (row: T) => T[] | undefined;
  expanded: Set<string>;
  onExpandedChange: (expanded: Set<string>) => void;
  forceExpanded?: boolean;
  onRowClick?: (row: T) => void;
  rowState?: (row: T) => "muted" | undefined;
  loading?: boolean;
  refreshing?: boolean;
  loadingRows?: number;
  empty?: React.ReactNode;
  maxHeight?: number | string;
  indent?: number;
  rowActions?: (row: T) => DropdownMenuItem[];
  className?: string;
}

const hideClass = { sm: "max-sm:hidden", md: "max-md:hidden", lg: "max-lg:hidden" } as const;

interface FlatRow<T> {
  row: T;
  key: string;
  depth: number;
  hasChildren: boolean;
  open: boolean;
}

function TreeTable<T>({
  data,
  columns,
  rowKey,
  getChildren,
  expanded,
  onExpandedChange,
  forceExpanded = false,
  onRowClick,
  rowState,
  loading = false,
  refreshing = false,
  loadingRows = 8,
  empty,
  maxHeight,
  indent = 20,
  rowActions,
  className,
}: TreeTableProps<T>) {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const busy = loading || refreshing;
  const [menu, setMenu] = React.useState<{ row: T; key: string; x: number; y: number } | null>(null);

  const openMenu = (event: React.MouseEvent<HTMLTableRowElement>, row: T, key: string) => {
    const container = containerRef.current;
    if (!container) return;
    const bounds = container.getBoundingClientRect();
    const rowBounds = event.currentTarget.getBoundingClientRect();
    setMenu({
      row,
      key,
      x: event.clientX - bounds.left + container.scrollLeft,
      y: rowBounds.bottom - bounds.top + container.scrollTop,
    });
  };
  const rows = React.useMemo(() => {
    const flat: FlatRow<T>[] = [];
    const walk = (nodes: T[], depth: number) =>
      nodes.forEach((row) => {
        const key = rowKey(row);
        const children = getChildren(row) ?? [];
        const open = children.length > 0 && (forceExpanded || expanded.has(key));
        flat.push({ row, key, depth, hasChildren: children.length > 0, open });
        if (open) walk(children, depth + 1);
      });
    walk(data, 0);
    return flat;
  }, [data, expanded, forceExpanded, getChildren, rowKey]);

  const toggle = (key: string) => {
    const next = new Set(expanded);
    if (next.has(key)) next.delete(key);
    else next.add(key);
    onExpandedChange(next);
  };

  const cellClass = (column: TreeTableColumn<T>) =>
    cn("px-4", column.align === "right" ? "text-right" : "text-left", column.hideBelow && hideClass[column.hideBelow], column.className);

  return (
    <div
      ref={containerRef}
      className={cn("font-v2 relative w-full overflow-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden", className)}
      style={{ maxHeight }}
    >
      <table role="treegrid" className="w-full border-separate border-spacing-0 text-v2-base">
        <thead>
          <tr className="[&>th]:sticky [&>th]:top-0 [&>th]:z-[2] [&>th]:h-11 [&>th]:bg-v2-canvas [&>th]:[box-shadow:inset_0_1px_0_hsl(var(--v2-line)),inset_0_-1px_0_hsl(var(--v2-line))]">
            {columns.map((column) => (
              <th
                key={column.key}
                style={{ width: column.width }}
                className={cn(cellClass(column), "whitespace-nowrap text-v2-meta font-medium text-v2-ink-tertiary")}
              >
                {column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="[&>tr>td]:border-b [&>tr>td]:border-v2-line">
          {busy &&
            Array.from({ length: loading ? loadingRows : Math.min(Math.max(rows.length, 1), 50) }).map((_, index) => (
              <tr key={index}>
                {columns.map((column, position) => (
                  <td key={column.key} className={cn(cellClass(column), "h-12")}>
                    <Skeleton
                      className={cn("h-3.5", column.align === "right" ? "ml-auto w-20" : "w-3/4")}
                      style={position === 0 ? { marginLeft: ((index * 7) % 3) * indent, width: `${35 + ((index * 23) % 40)}%` } : undefined}
                    />
                  </td>
                ))}
              </tr>
            ))}
          {!busy && rows.length === 0 && (
            <tr>
              <td colSpan={columns.length}>
                {empty ?? <p className="py-12 text-center text-v2-base text-v2-ink-tertiary">No records found</p>}
              </td>
            </tr>
          )}
          {!busy &&
            rows.map(({ row, key, depth, hasChildren, open }) => {
              const state = rowState?.(row);
              return (
                <tr
                  key={key}
                  data-v2
                  aria-level={depth + 1}
                  aria-expanded={hasChildren ? open : undefined}
                  aria-haspopup={rowActions ? "menu" : undefined}
                  onClick={(event) => {
                    if (rowActions) openMenu(event, row, key);
                    else onRowClick?.(row);
                  }}
                  className={cn(
                    "group/row transition-colors duration-v2-fast hover:bg-v2-surface",
                    (onRowClick || rowActions) && "cursor-pointer",
                    menu?.key === key && "bg-v2-surface",
                    state && "[&_*]:!text-v2-ink-tertiary",
                  )}
                >
                  {columns.map((column, position) => (
                    <td key={column.key} className={cn(cellClass(column), "h-12 text-v2-ink")}>
                      {position === 0 ? (
                        <span className="flex min-w-0 items-center gap-1.5" style={{ paddingLeft: depth * indent }}>
                          {hasChildren ? (
                            <button
                              type="button"
                              data-v2
                              aria-label={open ? "Collapse" : "Expand"}
                              disabled={forceExpanded}
                              onClick={(event) => {
                                event.stopPropagation();
                                toggle(key);
                              }}
                              className={cn(
                                "-ml-1 flex size-6 shrink-0 items-center justify-center rounded-v2-xs bg-transparent text-v2-ink-tertiary transition-colors hover:bg-v2-surface-hover hover:text-v2-ink disabled:cursor-default",
                                focusRing,
                              )}
                            >
                              <ChevronRight className={cn("size-4 transition-transform duration-v2-base", open && "rotate-90")} />
                            </button>
                          ) : (
                            <span aria-hidden className="-ml-1 size-6 shrink-0" />
                          )}
                          <span className="min-w-0 flex-1">{column.cell(row, depth)}</span>
                        </span>
                      ) : (
                        column.cell(row, depth)
                      )}
                    </td>
                  ))}
                </tr>
              );
            })}
        </tbody>
      </table>
      {rowActions && menu && (
        <DropdownMenu
          open
          onOpenChange={(open) => !open && setMenu(null)}
          items={rowActions(menu.row)}
          trigger={<span aria-hidden className="pointer-events-none absolute size-px" style={{ left: menu.x, top: menu.y }} />}
        />
      )}
    </div>
  );
}

export { TreeTable };
