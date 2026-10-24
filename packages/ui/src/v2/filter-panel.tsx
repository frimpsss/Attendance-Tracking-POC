import * as React from "react";
import * as PopoverPrimitive from "@radix-ui/react-popover";
import { Check, ChevronRight, ListFilter, Search } from "lucide-react";

import { cn } from "@attendance/utils";
import { Button } from "./button";
import { floatingSurface, focusRing } from "./shared/styles";

export interface FilterPanelGroup {
  key: string;
  label: string;
  icon?: React.ReactNode;
  multiple?: boolean;
  options: { value: string; label: string }[];
  value: string[];
  onChange: (value: string[]) => void;
}

export interface FilterPanelProps {
  groups: FilterPanelGroup[];
  label?: string;
  align?: "start" | "end";
}

function FilterPanel({ groups, label = "Filters", align = "start" }: FilterPanelProps) {
  const [activeKey, setActiveKey] = React.useState(groups[0]?.key);
  const [query, setQuery] = React.useState("");
  const active = groups.find((group) => group.key === activeKey) ?? groups[0];
  const activeCount = groups.reduce((sum, group) => sum + (group.value.length > 0 ? 1 : 0), 0);
  const needle = query.trim().toLowerCase();
  const options = active ? active.options.filter((option) => option.label.toLowerCase().includes(needle)) : [];

  const choose = (value: string | null) => {
    if (!active) return;
    if (value === null) return active.onChange([]);
    if (!active.multiple) return active.onChange([value]);
    active.onChange(active.value.includes(value) ? active.value.filter((item) => item !== value) : [...active.value, value]);
  };

  return (
    <PopoverPrimitive.Root onOpenChange={(open) => !open && setQuery("")}>
      <PopoverPrimitive.Trigger asChild>
        <Button variant="secondary" size="sm" leadingIcon={<ListFilter />}>
          {label}
          {activeCount > 0 && (
            <span className="ml-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-v2-primary px-1.5 text-v2-2xs font-semibold text-v2-on-primary">
              {activeCount}
            </span>
          )}
        </Button>
      </PopoverPrimitive.Trigger>
      <PopoverPrimitive.Portal>
        <PopoverPrimitive.Content align={align} sideOffset={6} className={cn(floatingSurface, "flex w-[600px] max-w-[calc(100vw-2rem)]")}>
          <ul className="flex w-52 shrink-0 flex-col gap-0.5 border-r border-v2-line p-2">
            {groups.map((group) => (
              <li key={group.key}>
                <button
                  type="button"
                  data-v2
                  onClick={() => {
                    setActiveKey(group.key);
                    setQuery("");
                  }}
                  className={cn(
                    "flex h-v2-control-sm w-full items-center gap-2.5 rounded-v2-xs px-3 text-left text-v2-ui transition-colors duration-v2-fast [&_svg]:size-4",
                    group.key === active?.key ? "bg-v2-surface-hover font-medium text-v2-ink" : "bg-transparent text-v2-ink-secondary hover:bg-v2-surface-hover",
                    focusRing,
                  )}
                >
                  {group.icon}
                  <span className="flex-1 truncate">{group.label}</span>
                  {group.value.length > 0 && <span className="size-1.5 rounded-full bg-v2-primary" />}
                  <ChevronRight className="text-v2-ink-tertiary" />
                </button>
              </li>
            ))}
          </ul>
          {active && (
            <div className="flex min-w-0 flex-1 flex-col p-3">
              <div className="flex h-v2-control-sm items-center gap-2 rounded-v2-sm bg-v2-field px-3">
                <Search className="size-4 text-v2-ink-tertiary" />
                <input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Search"
                  className="min-w-0 flex-1 bg-transparent text-v2-ui text-v2-ink outline-none placeholder:text-v2-ink-tertiary"
                />
              </div>
              <p className="mb-1 mt-3 px-1 text-v2-xs font-medium text-v2-ink-tertiary">{active.label}</p>
              <div role={active.multiple ? "group" : "radiogroup"} className="flex max-h-72 flex-col overflow-y-auto">
                {!active.multiple && (
                  <FilterOption label="No filter" selected={active.value.length === 0} multiple={false} onSelect={() => choose(null)} />
                )}
                {options.map((option) => (
                  <FilterOption
                    key={option.value}
                    label={option.label}
                    multiple={Boolean(active.multiple)}
                    selected={active.value.includes(option.value)}
                    onSelect={() => choose(option.value)}
                  />
                ))}
                {options.length === 0 && <p className="px-1 py-4 text-v2-sm text-v2-ink-tertiary">No matches</p>}
              </div>
              {active.value.length > 0 && (
                <Button variant="link" className="mt-2 self-start text-v2-sm" onClick={() => active.onChange([])}>
                  Clear {active.label.toLowerCase()}
                </Button>
              )}
            </div>
          )}
        </PopoverPrimitive.Content>
      </PopoverPrimitive.Portal>
    </PopoverPrimitive.Root>
  );
}

function FilterOption({ label, selected, multiple, onSelect }: { label: string; selected: boolean; multiple: boolean; onSelect: () => void }) {
  return (
    <button
      type="button"
      data-v2
      role={multiple ? "checkbox" : "radio"}
      aria-checked={selected}
      onClick={onSelect}
      className={cn(
        "flex h-v2-control-sm items-center gap-3 rounded-v2-xs bg-transparent px-1 text-left text-v2-base text-v2-ink transition-colors duration-v2-fast hover:bg-v2-surface-hover",
        focusRing,
      )}
    >
      <span
        className={cn(
          "flex size-[18px] shrink-0 items-center justify-center border transition-colors duration-v2-fast",
          multiple ? "rounded-v2-xs" : "rounded-full",
          selected ? "border-v2-primary bg-v2-primary text-v2-on-primary" : "border-v2-line-strong bg-v2-canvas",
        )}
      >
        {selected && (multiple ? <Check className="size-3" strokeWidth={3} /> : <span className="size-1.5 rounded-full bg-v2-on-primary" />)}
      </span>
      {label}
    </button>
  );
}

export interface FilterBarProps {
  search?: {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
  };
  filters?: FilterPanelGroup[];
  onReset?: () => void;
  className?: string;
}

function FilterBar({ search, filters = [], onReset, className }: FilterBarProps) {
  const hasActive =
    Boolean(search?.value?.trim()) ||
    filters.some((group) => group.value.length > 0);

  return (
    <div className={cn("flex flex-wrap items-center gap-2", className)}>
      {search && (
        <div className="flex h-v2-control-sm min-w-[200px] flex-1 items-center gap-2 rounded-v2-sm bg-v2-field px-3">
          <Search className="size-4 text-v2-ink-tertiary" />
          <input
            value={search.value}
            onChange={(event) => search.onChange(event.target.value)}
            placeholder={search.placeholder ?? "Search…"}
            className="min-w-0 flex-1 bg-transparent text-v2-ui text-v2-ink outline-none placeholder:text-v2-ink-tertiary"
          />
        </div>
      )}
      {filters.length > 0 && <FilterPanel groups={filters} />}
      {onReset && hasActive && (
        <Button variant="ghost" size="sm" onClick={onReset}>
          Reset
        </Button>
      )}
    </div>
  );
}

export { FilterPanel, FilterBar };
