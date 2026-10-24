import * as React from "react";
import * as PopoverPrimitive from "@radix-ui/react-popover";
import { ChevronDown } from "lucide-react";

import { cn } from "@attendance/utils";
import { OptionList } from "../shared/option-list";
import { floatingSurface, focusRing } from "../shared/styles";

export interface TableFilter {
  key: string;
  label: string;
  options: { value: string; label: string; description?: string }[];
  value: string[];
  onChange: (value: string[]) => void;
}

function FilterButton({ filter }: { filter: TableFilter }) {
  const [query, setQuery] = React.useState("");
  const selected = filter.options.filter((option) => filter.value.includes(option.value));
  const needle = query.trim().toLowerCase();
  const visible = needle ? filter.options.filter((option) => option.label.toLowerCase().includes(needle)) : filter.options;
  const summary =
    selected.length === 0 ? null : selected.length === 1 ? selected[0].label : `${selected.length} selected`;

  return (
    <PopoverPrimitive.Root onOpenChange={(open) => !open && setQuery("")}>
      <PopoverPrimitive.Trigger
        data-v2
        data-press
        className={cn(
          "inline-flex h-v2-control-sm shrink-0 items-center gap-1.5 rounded-v2-sm px-3 text-v2-base font-medium transition-colors duration-v2-fast",
          summary
            ? "bg-v2-primary-soft text-v2-primary hover:bg-v2-primary-soft-hover"
            : "bg-v2-field text-v2-ink-secondary hover:bg-v2-field-hover hover:text-v2-ink",
          focusRing,
        )}
      >
        {filter.label}
        {summary && (
          <>
            <span className="h-3.5 w-px bg-v2-primary/25" />
            <span className="max-w-[140px] truncate font-semibold">{summary}</span>
          </>
        )}
        <ChevronDown className="size-3.5 opacity-70" />
      </PopoverPrimitive.Trigger>
      <PopoverPrimitive.Portal>
        <PopoverPrimitive.Content align="start" sideOffset={6} className={cn(floatingSurface, "w-64")}>
          <OptionList
            multiple
            options={visible}
            selected={filter.value}
            query={query}
            onQueryChange={setQuery}
            searchPlaceholder={`Filter ${filter.label.toLowerCase()}…`}
            onToggle={(option) =>
              filter.onChange(
                filter.value.includes(option.value)
                  ? filter.value.filter((value) => value !== option.value)
                  : [...filter.value, option.value],
              )
            }
          />
        </PopoverPrimitive.Content>
      </PopoverPrimitive.Portal>
    </PopoverPrimitive.Root>
  );
}

export { FilterButton };
