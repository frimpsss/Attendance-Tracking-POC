import * as React from "react";
import { Search, X } from "lucide-react";

import { cn } from "@attendance/utils";
import { Button } from "./button";
import { fieldBase } from "./shared/styles";

const sizes = {
  sm: "h-v2-control-sm text-v2-base",
  md: "h-v2-control-md",
  lg: "h-v2-control-lg",
} as const;

export interface SearchInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "size" | "onChange" | "value" | "onSubmit"> {
  value: string;
  onValueChange: (value: string) => void;
  onSubmit?: (value: string) => void;
  actionLabel?: string;
  size?: keyof typeof sizes;
  containerClassName?: string;
}

const SearchInput = React.forwardRef<HTMLInputElement, SearchInputProps>(
  (
    { value, onValueChange, onSubmit, actionLabel, size = "md", placeholder = "Search", containerClassName, className, ...props },
    ref,
  ) => (
    <form
      role="search"
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit?.(value);
      }}
      className={cn("font-v2 flex w-full items-center gap-2", containerClassName)}
    >
      <div className="relative w-full">
        <Search className="pointer-events-none absolute left-4 top-1/2 size-[18px] -translate-y-1/2 text-v2-ink-tertiary" />
        <input
          ref={ref}
          type="search"
          value={value}
          onChange={(event) => onValueChange(event.target.value)}
          placeholder={placeholder}
          className={cn(fieldBase, sizes[size], "pl-11 pr-10 [&::-webkit-search-cancel-button]:hidden", className)}
          {...props}
        />
        {value && (
          <button
            type="button"
            data-v2
            aria-label="Clear search"
            onClick={() => onValueChange("")}
            className="absolute inset-y-0 right-2.5 my-auto flex size-6 items-center justify-center rounded-v2-xs bg-transparent text-v2-ink-tertiary hover:bg-v2-field-hover hover:text-v2-ink"
          >
            <X className="size-3.5" />
          </button>
        )}
      </div>
      {actionLabel && (
        <Button type="submit" size={size}>
          {actionLabel}
        </Button>
      )}
    </form>
  ),
);
SearchInput.displayName = "SearchInput";

export { SearchInput };
