import * as React from "react";

import { Pagination } from "../pagination";
import { Select } from "../select";

export interface TablePagination {
  page: number;
  pageCount: number;
  onPageChange: (page: number) => void;
  pageSize: number;
  pageSizeOptions?: number[];
  onPageSizeChange: (size: number) => void;
  total?: number;
}

function TableFooter({ pagination, loading = false, noun }: { pagination: TablePagination; loading?: boolean; noun?: [singular: string, plural: string] }) {
  const { page, pageCount, onPageChange, pageSize, pageSizeOptions = [10, 20, 50, 100], onPageSizeChange, total } =
    pagination;

  const sizes = React.useMemo(
    () => (pageSizeOptions.includes(pageSize) ? pageSizeOptions : [...pageSizeOptions, pageSize].sort((a, b) => a - b)),
    [pageSizeOptions, pageSize],
  );
  const lastPage = Math.max(1, pageCount);
  const current = Math.min(Math.max(1, page), lastPage);

  React.useEffect(() => {
    if (!loading && page !== current) onPageChange(current);
  }, [loading, page, current, onPageChange]);

  const summary = React.useMemo(() => {
    if (loading || total === undefined) return null;
    if (total === 0) return "No results";
    if (lastPage === 1) return `${total.toLocaleString()} ${total === 1 ? (noun?.[0] ?? "result") : (noun?.[1] ?? "results")}`;
    const start = Math.min((current - 1) * pageSize + 1, total);
    const end = Math.min(current * pageSize, total);
    return `${start}–${end} of ${total.toLocaleString()}`;
  }, [loading, current, pageSize, total, lastPage, noun]);

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-v2-line pt-3">
      <div className="flex items-center gap-4 text-v2-sm text-v2-ink-tertiary">
        <div className="flex items-center gap-2">
          <span>Rows per page</span>
          <Select
            size="sm"
            value={String(pageSize)}
            onValueChange={(value) => onPageSizeChange(Number(value))}
            options={sizes.map((size) => ({ value: String(size), label: String(size) }))}
            className="w-[76px]"
          />
        </div>
        {summary && <span className="tabular-nums">{summary}</span>}
      </div>
      <Pagination page={current} pageCount={lastPage} onPageChange={onPageChange} />
    </div>
  );
}

export { TableFooter };
