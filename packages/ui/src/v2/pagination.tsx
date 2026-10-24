import { ChevronLeft, ChevronRight } from "lucide-react";

import { cn } from "@attendance/utils";
import { focusRing } from "./shared/styles";

export interface PaginationProps {
  page: number;
  pageCount: number;
  onPageChange: (page: number) => void;
  className?: string;
}

const pageWindow = (page: number, pageCount: number): (number | "gap")[] => {
  if (pageCount <= 7) return Array.from({ length: pageCount }, (_, i) => i + 1);
  if (page <= 4) return [1, 2, 3, 4, 5, "gap", pageCount];
  if (page >= pageCount - 3)
    return [1, "gap", ...Array.from({ length: 5 }, (_, i) => pageCount - 4 + i)];
  return [1, "gap", page - 1, page, page + 1, "gap", pageCount];
};

const pageButton = cn(
  "inline-flex h-v2-control-sm min-w-v2-control-sm items-center justify-center rounded-v2-sm bg-transparent px-2.5 text-v2-base font-medium tabular-nums text-v2-ink-secondary transition-colors hover:bg-v2-surface-hover hover:text-v2-ink disabled:pointer-events-none disabled:text-v2-ink-disabled",
  focusRing,
);

function Pagination({ page, pageCount, onPageChange, className }: PaginationProps) {
  return (
    <nav aria-label="Pagination" className={cn("font-v2 flex items-center gap-1", className)}>
      <button
        type="button"
        data-v2
        data-press
        className={pageButton}
        disabled={page <= 1}
        onClick={() => onPageChange(page - 1)}
        aria-label="Previous page"
      >
        <ChevronLeft className="size-4" />
      </button>
      {pageWindow(page, pageCount).map((entry, index) =>
        entry === "gap" ? (
          <span key={`gap-${index}`} className="px-1 text-v2-sm text-v2-ink-tertiary">
            …
          </span>
        ) : (
          <button
            key={entry}
            type="button"
            data-v2
            data-press
            aria-current={entry === page ? "page" : undefined}
            onClick={() => onPageChange(entry)}
            className={cn(
              pageButton,
              entry === page &&
                "bg-v2-primary-soft text-v2-primary hover:bg-v2-primary-soft hover:text-v2-primary",
            )}
          >
            {entry}
          </button>
        ),
      )}
      <button
        type="button"
        data-v2
        data-press
        className={pageButton}
        disabled={page >= pageCount}
        onClick={() => onPageChange(page + 1)}
        aria-label="Next page"
      >
        <ChevronRight className="size-4" />
      </button>
    </nav>
  );
}

export { Pagination };
