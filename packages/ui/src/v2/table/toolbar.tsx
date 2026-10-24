import * as React from "react";
import { RotateCw } from "lucide-react";

import { cn } from "@attendance/utils";
import { Button } from "../button";
import { SearchInput } from "../search-input";
import { Tooltip } from "../tooltip";
import { FilterButton, type TableFilter } from "./filter-button";

export interface TableSearch {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export interface TableToolbarProps {
  search?: TableSearch;
  filters?: TableFilter[];
  onRefresh?: () => void;
  refreshing?: boolean;
  actions?: React.ReactNode;
}

function RefreshButton({ onRefresh, refreshing }: { onRefresh: () => void; refreshing?: boolean }) {
  return (
    <Tooltip content="Refresh">
      <Button variant="secondary" size="icon-sm" aria-label="Refresh" onClick={onRefresh} disabled={refreshing}>
        <RotateCw className={cn(refreshing && "animate-spin")} />
      </Button>
    </Tooltip>
  );
}

function TableToolbar({ search, filters, onRefresh, refreshing, actions }: TableToolbarProps) {
  const activeFilters = filters?.filter((filter) => filter.value.length > 0) ?? [];
  return (
    <div className="flex flex-wrap items-center gap-2.5 pb-4">
      {search && (
        <SearchInput
          size="sm"
          value={search.value}
          onValueChange={search.onChange}
          placeholder={search.placeholder ?? "Search"}
          containerClassName="w-full sm:w-72"
        />
      )}
      {filters?.map((filter) => <FilterButton key={filter.key} filter={filter} />)}
      {activeFilters.length > 0 && (
        <Button variant="ghost" size="sm" onClick={() => activeFilters.forEach((filter) => filter.onChange([]))}>
          Clear
        </Button>
      )}
      <div className="ml-auto flex items-center gap-2">
        {actions}
        {onRefresh && <RefreshButton onRefresh={onRefresh} refreshing={refreshing} />}
      </div>
    </div>
  );
}

export { RefreshButton, TableToolbar };
