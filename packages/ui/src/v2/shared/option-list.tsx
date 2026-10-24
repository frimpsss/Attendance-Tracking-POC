import * as React from "react";
import { Check, Search } from "lucide-react";

import { cn } from "@attendance/utils";
import { Spinner } from "../spinner";

export interface ListOption {
  value: string;
  label: string;
  description?: string;
  icon?: React.ReactNode;
  disabled?: boolean;
}

export interface ListCta {
  label: string;
  icon?: React.ReactNode;
  onClick: (query: string) => void;
}

export interface OptionListProps {
  options: ListOption[];
  selected: string[];
  onToggle: (option: ListOption) => void;
  multiple?: boolean;
  searchPlaceholder?: string;
  query: string;
  onQueryChange: (query: string) => void;
  loading?: boolean;
  emptyText?: string;
  cta?: ListCta;
}

function OptionList({
  options,
  selected,
  onToggle,
  multiple = false,
  searchPlaceholder = "Search…",
  query,
  onQueryChange,
  loading,
  emptyText = "No results",
  cta,
}: OptionListProps) {
  const [active, setActive] = React.useState(0);
  const listRef = React.useRef<HTMLDivElement>(null);
  const listId = React.useId();

  React.useEffect(() => setActive(0), [query, options.length]);

  React.useEffect(() => {
    listRef.current?.querySelector(`[data-index="${active}"]`)?.scrollIntoView({ block: "nearest" });
  }, [active]);

  const enabled = options.filter((option) => !option.disabled);

  const onKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActive((index) => Math.min(index + 1, enabled.length - 1));
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActive((index) => Math.max(index - 1, 0));
    } else if (event.key === "Enter") {
      event.preventDefault();
      const option = enabled[active];
      if (option) onToggle(option);
    }
  };

  return (
    <div className="flex flex-col">
      <div className="flex items-center gap-2.5 border-b border-v2-line px-3.5">
        <Search className="size-4 shrink-0 text-v2-ink-tertiary" />
        <input
          autoFocus
          value={query}
          onChange={(event) => onQueryChange(event.target.value)}
          onKeyDown={onKeyDown}
          placeholder={searchPlaceholder}
          role="combobox"
          aria-expanded
          aria-controls={listId}
          aria-activedescendant={enabled[active] ? `${listId}-${enabled[active].value}` : undefined}
          className="h-11 w-full bg-transparent text-v2-base text-v2-ink outline-none placeholder:text-v2-ink-tertiary"
        />
        {loading && <Spinner size="sm" className="text-v2-ink-tertiary" />}
      </div>
      <div ref={listRef} id={listId} role="listbox" aria-multiselectable={multiple} className="max-h-64 overflow-y-auto p-1.5">
        {options.length === 0 && !loading && (
          <p className="px-3 py-6 text-center text-v2-ui text-v2-ink-tertiary">{emptyText}</p>
        )}
        {options.map((option) => {
          const isSelected = selected.includes(option.value);
          const index = enabled.indexOf(option);
          return (
            <div
              key={option.value}
              id={`${listId}-${option.value}`}
              role="option"
              data-v2
              data-index={index}
              aria-selected={isSelected}
              aria-disabled={option.disabled || undefined}
              onMouseMove={() => index >= 0 && setActive(index)}
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => !option.disabled && onToggle(option)}
              className={cn(
                "flex cursor-pointer select-none items-center gap-3 rounded-v2-xs px-2.5 py-2 text-v2-base text-v2-ink",
                index === active && "bg-v2-surface-hover",
                option.disabled && "pointer-events-none text-v2-ink-disabled",
              )}
            >
              {multiple && (
                <span
                  className={cn(
                    "flex size-4 shrink-0 items-center justify-center rounded-v2-xs border transition-colors",
                    isSelected ? "border-v2-primary bg-v2-primary text-v2-on-primary" : "border-v2-line-strong bg-v2-canvas",
                  )}
                >
                  {isSelected && <Check className="size-3" strokeWidth={3} />}
                </span>
              )}
              {option.icon && (
                <span className="flex shrink-0 text-v2-ink-tertiary [&_svg]:size-4">{option.icon}</span>
              )}
              <span className="min-w-0 flex-1">
                <span className="block truncate">{option.label}</span>
                {option.description && (
                  <span className="block truncate text-v2-meta leading-[18px] text-v2-ink-tertiary">
                    {option.description}
                  </span>
                )}
              </span>
              {!multiple && isSelected && <Check className="size-4 shrink-0 text-v2-primary" />}
            </div>
          );
        })}
      </div>
      {cta && (
        <button
          type="button"
          data-v2
          onClick={() => cta.onClick(query)}
          className="flex h-11 items-center gap-2 border-t border-v2-line bg-transparent px-4 text-left text-v2-base font-semibold text-v2-primary transition-colors duration-v2-fast hover:bg-v2-primary-soft [&_svg]:size-4"
        >
          {cta.icon}
          <span className="truncate">
            {cta.label}
            {query && <span className="font-normal text-v2-ink-secondary"> “{query}”</span>}
          </span>
        </button>
      )}
    </div>
  );
}

export { OptionList };
