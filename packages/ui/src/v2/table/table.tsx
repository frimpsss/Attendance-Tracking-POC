import * as React from "react";
import { ArrowDown, ArrowUp, ChevronsUpDown } from "lucide-react";

import { cn } from "@attendance/utils";
import { Checkbox } from "../checkbox";
import { focusRing } from "../shared/styles";
import { Skeleton } from "../skeleton";
import { FloatingActions, type FloatingAction } from "./floating-actions";
import { TableFooter, type TablePagination } from "./footer";
import { TableToolbar, type TableToolbarProps } from "./toolbar";

export interface TableColumn<T> {
  key: string;
  header: React.ReactNode;
  cell?: (row: T, index: number) => React.ReactNode;
  align?: "left" | "center" | "right";
  width?: number;
  minWidth?: number;
  sticky?: "left" | "right";
  hideBelow?: "sm" | "md" | "lg";
  mobile?: "title" | "field" | "hidden";
  mobileLabel?: string;
  className?: string;
  strikeWhenCancelled?: boolean;
  sortable?: boolean;
  sortValue?: (row: T) => string | number | Date | null | undefined;
}

export interface TableSort {
  key: string;
  direction: "asc" | "desc";
}

export interface TableBulkAction {
  label: string;
  icon?: React.ReactNode;
  tone?: "default" | "danger";
  onClick: (keys: string[]) => void;
}

export interface TableProps<T> extends TableToolbarProps {
  columns: TableColumn<T>[];
  data: T[];
  rowKey: (row: T, index: number) => string;
  loading?: boolean;
  loadingRows?: number;
  empty?: React.ReactNode;
  onRowClick?: (row: T) => void;
  selectedKeys?: string[];
  onSelectionChange?: (keys: string[]) => void;
  bulkActions?: TableBulkAction[] | ((keys: string[]) => TableBulkAction[]);
  bulkNoun?: [singular: string, plural: string];
  pagination?: TablePagination;
  density?: "compact" | "comfortable";
  rowState?: (row: T) => "cancelled" | "muted" | undefined;
  stickyHeader?: boolean;
  maxHeight?: number | string;
  mobileLayout?: "scroll" | "cards";
  sort?: TableSort | null;
  defaultSort?: TableSort | null;
  onSortChange?: (sort: TableSort | null) => void;
  className?: string;
}

const SELECT_WIDTH = 48;
const DEFAULT_STICKY_WIDTH = 160;

const alignClass = {
  left: "text-left",
  center: "text-center",
  right: "text-right",
} as const;

const hideClass = {
  sm: "max-sm:hidden",
  md: "max-md:hidden",
  lg: "max-lg:hidden",
} as const;

function useScrollEdges(ref: React.RefObject<HTMLDivElement>) {
  const [edges, setEdges] = React.useState({ left: false, right: false });
  React.useEffect(() => {
    const element = ref.current;
    if (!element) return;
    const update = () => {
      const left = element.scrollLeft > 0;
      const right = element.scrollLeft + element.clientWidth < element.scrollWidth - 1;
      setEdges((current) => (current.left === left && current.right === right ? current : { left, right }));
    };
    update();
    element.addEventListener("scroll", update, { passive: true });
    const observer = new ResizeObserver(update);
    observer.observe(element);
    if (element.firstElementChild) observer.observe(element.firstElementChild);
    return () => {
      element.removeEventListener("scroll", update);
      observer.disconnect();
    };
  }, [ref]);
  return edges;
}

function Table<T>({
  columns,
  data,
  rowKey,
  loading = false,
  loadingRows = 5,
  empty,
  onRowClick,
  selectedKeys,
  onSelectionChange,
  bulkActions,
  bulkNoun,
  pagination,
  density = "comfortable",
  rowState,
  stickyHeader = false,
  maxHeight,
  mobileLayout = "scroll",
  sort: controlledSort,
  defaultSort = null,
  onSortChange,
  search,
  filters,
  onRefresh,
  refreshing,
  actions,
  className,
}: TableProps<T>) {
  const scrollRef = React.useRef<HTMLDivElement>(null);
  const edges = useScrollEdges(scrollRef);
  const [internalSort, setInternalSort] = React.useState<TableSort | null>(defaultSort);
  const sort = controlledSort !== undefined ? controlledSort : internalSort;

  const rows = React.useMemo(() => {
    if (!sort || onSortChange) return data;
    const column = columns.find((entry) => entry.key === sort.key);
    if (!column) return data;
    const read = column.sortValue ?? ((row: T) => (row as Record<string, unknown>)[column.key] as string | number | undefined);
    const direction = sort.direction === "asc" ? 1 : -1;
    return [...data].sort((a, b) => {
      const left = read(a);
      const right = read(b);
      if (left === right) return 0;
      if (left === null || left === undefined) return 1;
      if (right === null || right === undefined) return -1;
      const l = left instanceof Date ? left.getTime() : left;
      const r = right instanceof Date ? right.getTime() : right;
      if (typeof l === "number" && typeof r === "number") return (l - r) * direction;
      return String(l).localeCompare(String(r), undefined, { numeric: true, sensitivity: "base" }) * direction;
    });
  }, [data, sort, columns, onSortChange]);

  const cycleSort = (key: string) => {
    const next: TableSort | null =
      sort?.key !== key ? { key, direction: "asc" } : sort.direction === "asc" ? { key, direction: "desc" } : null;
    if (controlledSort === undefined) setInternalSort(next);
    onSortChange?.(next);
  };

  const selectable = Boolean(onSelectionChange);
  const selected = new Set(selectedKeys ?? []);
  const keys = rows.map(rowKey);
  const allSelected = keys.length > 0 && keys.every((key) => selected.has(key));
  const someSelected = !allSelected && keys.some((key) => selected.has(key));
  const cellHeight = density === "compact" ? "h-11" : "h-14";
  const colSpan = columns.length + (selectable ? 1 : 0);
  const hasToolbar = search || filters?.length || onRefresh || actions;
  const hasLeftSticky = columns.some((column) => column.sticky === "left");
  const busy = loading || Boolean(refreshing);
  const skeletonRows = loading ? loadingRows : Math.min(Math.max(rows.length, 1), 50);

  const offsets = React.useMemo(() => {
    const map = new Map<string, { side: "left" | "right"; offset: number; edge: boolean }>();
    let left = selectable && hasLeftSticky ? SELECT_WIDTH : 0;
    const leftColumns = columns.filter((column) => column.sticky === "left");
    leftColumns.forEach((column, index) => {
      map.set(column.key, { side: "left", offset: left, edge: index === leftColumns.length - 1 });
      left += column.width ?? DEFAULT_STICKY_WIDTH;
    });
    let right = 0;
    const rightColumns = columns.filter((column) => column.sticky === "right").reverse();
    rightColumns.forEach((column, index) => {
      map.set(column.key, { side: "right", offset: right, edge: index === rightColumns.length - 1 });
      right += column.width ?? DEFAULT_STICKY_WIDTH;
    });
    return map;
  }, [columns, selectable, hasLeftSticky]);

  const toggleAll = () => onSelectionChange?.(allSelected ? [] : keys);
  const toggleRow = (key: string) => {
    const next = new Set(selected);
    if (next.has(key)) next.delete(key);
    else next.add(key);
    onSelectionChange?.([...next]);
  };

  const stickyStyle = (column: TableColumn<T>): React.CSSProperties | undefined => {
    const sticky = offsets.get(column.key);
    const sizing = { width: column.width, minWidth: column.minWidth ?? column.width };
    return sticky ? { ...sizing, [sticky.side]: sticky.offset } : sizing;
  };

  const stickyClass = (column: TableColumn<T> | "select", header = false) => {
    const sticky = column === "select" ? (hasLeftSticky ? { side: "left" as const, edge: false } : undefined) : offsets.get(column.key);
    if (!sticky) return header && stickyHeader ? "sticky top-0 z-[2] bg-v2-canvas" : undefined;
    const showEdge = sticky.edge && (sticky.side === "left" ? edges.left : edges.right);
    return cn(
      "sticky",
      header ? cn("bg-v2-canvas", stickyHeader ? "top-0 z-[3]" : "z-[2]") : "z-[1] bg-v2-canvas group-hover/row:bg-v2-surface group-data-[state=selected]/row:bg-v2-primary-soft",
      column === "select" && "left-0",
      showEdge &&
        cn(
          "after:pointer-events-none after:absolute after:inset-y-0 after:w-px after:bg-v2-line",
          sticky.side === "left" ? "after:-right-px" : "after:-left-px",
        ),
    );
  };

  const cellClass = (column: TableColumn<T>) =>
    cn(
      "px-3 align-middle first:pl-4 last:pr-4",
      alignClass[column.align ?? "left"],
      column.hideBelow && hideClass[column.hideBelow],
      column.className,
    );

  const floatingActions: FloatingAction[] =
    (typeof bulkActions === "function" ? bulkActions([...selected]) : (bulkActions ?? [])).map((action) => ({
      ...action,
      onClick: () => action.onClick([...selected]),
    }));

  const headerBorder = stickyHeader
    ? "[box-shadow:inset_0_1px_0_hsl(var(--v2-line)),inset_0_-1px_0_hsl(var(--v2-line))]"
    : undefined;

  const titleColumn = columns.find((column) => column.mobile === "title") ?? columns[0];
  const fieldColumns = columns.filter((column) => column !== titleColumn && column.mobile !== "hidden");

  const renderCell = (column: TableColumn<T>, row: T, index: number) =>
    column.cell ? column.cell(row, index) : ((row as Record<string, React.ReactNode>)[column.key] ?? null);

  return (
    <div className={cn("font-v2 w-full", className)}>
      {hasToolbar && (
        <TableToolbar search={search} filters={filters} onRefresh={onRefresh} refreshing={refreshing} actions={actions} />
      )}
      <div
        ref={scrollRef}
        data-v2
        className={cn("relative w-full overflow-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden", mobileLayout === "cards" && "max-sm:hidden")}
        style={{ maxHeight }}
      >
        <table className={cn("w-full border-separate border-spacing-0 text-v2-base", !stickyHeader && "[&>thead>tr>th]:border-b [&>thead>tr>th]:border-v2-line")}>
          <thead>
            <tr>
              {selectable && (
                <th
                  style={{ width: SELECT_WIDTH, minWidth: SELECT_WIDTH }}
                  className={cn("h-11 pl-4 text-left leading-[0]", headerBorder, stickyClass("select", true))}
                >
                  <Checkbox
                    aria-label="Select all rows"
                    checked={allSelected ? true : someSelected ? "indeterminate" : false}
                    onCheckedChange={toggleAll}
                  />
                </th>
              )}
              {columns.map((column) => (
                <th
                  key={column.key}
                  style={stickyStyle(column)}
                  aria-sort={sort?.key === column.key ? (sort.direction === "asc" ? "ascending" : "descending") : column.sortable ? "none" : undefined}
                  className={cn(
                    cellClass(column),
                    "h-11 whitespace-nowrap text-v2-meta font-medium text-v2-ink-tertiary",
                    headerBorder,
                    stickyClass(column, true),
                  )}
                >
                  {column.sortable ? (
                    <button
                      type="button"
                      data-v2
                      onClick={() => cycleSort(column.key)}
                      className={cn(
                        "group/sort -mx-1.5 inline-flex items-center gap-1 rounded-v2-xs bg-transparent px-1.5 py-1 transition-colors duration-v2-fast hover:text-v2-ink",
                        column.align === "right" && "flex-row-reverse",
                        sort?.key === column.key && "text-v2-ink",
                        focusRing,
                      )}
                    >
                      {column.header}
                      {sort?.key === column.key ? (
                        sort.direction === "asc" ? (
                          <ArrowUp className="size-3.5 text-v2-primary" />
                        ) : (
                          <ArrowDown className="size-3.5 text-v2-primary" />
                        )
                      ) : (
                        <ChevronsUpDown className="size-3.5 opacity-0 transition-opacity duration-v2-fast group-hover/sort:opacity-60 group-focus-visible/sort:opacity-60" />
                      )}
                    </button>
                  ) : (
                    column.header
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="[&>tr>td]:border-b [&>tr>td]:border-v2-line [&>tr:last-child>td]:border-b-0">
            {busy &&
              Array.from({ length: skeletonRows }, (_, index) => (
                <tr key={`loading-${index}`} className="group/row">
                  {selectable && <td className={cn("pl-4 leading-[0]", stickyClass("select"))} style={{ width: SELECT_WIDTH }} />}
                  {columns.map((column) => (
                    <td key={column.key} style={stickyStyle(column)} className={cn(cellClass(column), cellHeight, stickyClass(column))}>
                      <Skeleton className="h-3.5 w-3/4" />
                    </td>
                  ))}
                </tr>
              ))}
            {!busy && rows.length === 0 && (
              <tr>
                <td colSpan={colSpan}>
                  {empty ?? <p className="py-12 text-center text-v2-base text-v2-ink-tertiary">No records found</p>}
                </td>
              </tr>
            )}
            {!busy &&
              rows.map((row, index) => {
                const key = keys[index];
                const isSelected = selected.has(key);
                const state = rowState?.(row);
                return (
                  <tr
                    key={key}
                    data-v2
                    data-state={isSelected ? "selected" : undefined}
                    data-row-state={state}
                    onClick={onRowClick ? () => onRowClick(row) : undefined}
                    className={cn(
                      "group/row transition-colors duration-v2-fast hover:bg-v2-surface data-[state=selected]:bg-v2-primary-soft [&>td:first-child]:rounded-l-v2-sm [&>td:last-child]:rounded-r-v2-sm",
                      onRowClick && "cursor-pointer",
                    )}
                  >
                    {selectable && (
                      <td
                        style={{ width: SELECT_WIDTH }}
                        className={cn("pl-4 leading-[0]", stickyClass("select"))}
                        onClick={(event) => event.stopPropagation()}
                      >
                        <Checkbox aria-label="Select row" checked={isSelected} onCheckedChange={() => toggleRow(key)} />
                      </td>
                    )}
                    {columns.map((column) => (
                      <td
                        key={column.key}
                        style={stickyStyle(column)}
                        className={cn(
                          cellClass(column),
                          cellHeight,
                          "text-v2-ink",
                          stickyClass(column),
                          state && "text-v2-ink-tertiary [&_*]:!text-v2-ink-tertiary",
                          state === "cancelled" &&
                            column.strikeWhenCancelled !== false &&
                            "line-through decoration-v2-ink-tertiary/70 [&_*]:line-through",
                        )}
                      >
                        {renderCell(column, row, index)}
                      </td>
                    ))}
                  </tr>
                );
              })}
          </tbody>
        </table>
      </div>

      {mobileLayout === "cards" && (
        <ul className="flex flex-col gap-2 sm:hidden">
          {busy &&
            Array.from({ length: Math.min(skeletonRows, 3) }, (_, index) => (
              <li key={index} className="flex flex-col gap-3 rounded-v2-md bg-v2-surface p-4">
                <Skeleton className="h-4 w-1/2" />
                <Skeleton className="h-3 w-3/4" />
                <Skeleton className="h-3 w-2/3" />
              </li>
            ))}
          {!busy && rows.length === 0 && (
            <li>{empty ?? <p className="py-12 text-center text-v2-base text-v2-ink-tertiary">No records found</p>}</li>
          )}
          {!busy &&
            rows.map((row, index) => {
              const key = keys[index];
              const isSelected = selected.has(key);
              const state = rowState?.(row);
              return (
                <li
                  key={key}
                  data-v2
                  onClick={onRowClick ? () => onRowClick(row) : undefined}
                  className={cn(
                    "rounded-v2-md p-4 transition-colors duration-v2-fast",
                    isSelected ? "bg-v2-primary-soft" : "bg-v2-surface",
                    onRowClick && "cursor-pointer active:bg-v2-surface-hover",
                    state && "text-v2-ink-tertiary",
                    state === "cancelled" && "[&_*]:line-through",
                  )}
                >
                  <div className="flex items-start gap-3">
                    {selectable && (
                      <span className="pt-0.5 leading-[0]" onClick={(event) => event.stopPropagation()}>
                        <Checkbox aria-label="Select row" checked={isSelected} onCheckedChange={() => toggleRow(key)} />
                      </span>
                    )}
                    <div className="min-w-0 flex-1 text-v2-md font-semibold text-v2-ink">{renderCell(titleColumn, row, index)}</div>
                  </div>
                  {fieldColumns.length > 0 && (
                    <dl className={cn("mt-3 grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-v2-sm", selectable && "pl-7")}>
                      {fieldColumns.map((column) => (
                        <React.Fragment key={column.key}>
                          <dt className="text-v2-ink-tertiary">{column.mobileLabel ?? (typeof column.header === "string" ? column.header : column.key)}</dt>
                          <dd className="min-w-0 text-right text-v2-ink">{renderCell(column, row, index)}</dd>
                        </React.Fragment>
                      ))}
                    </dl>
                  )}
                </li>
              );
            })}
        </ul>
      )}

      {pagination && <TableFooter pagination={pagination} loading={loading} noun={bulkNoun} />}
      {bulkActions && (
        <FloatingActions count={selected.size} actions={floatingActions} noun={bulkNoun} onClear={() => onSelectionChange?.([])} />
      )}
    </div>
  );
}

export { Table };
