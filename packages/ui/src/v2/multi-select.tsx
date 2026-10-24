import * as React from "react";
import * as PopoverPrimitive from "@radix-ui/react-popover";
import { ChevronDown, X } from "lucide-react";

import { cn } from "@attendance/utils";
import { Field, type FieldControlProps } from "./shared/field";
import { OptionList, type ListCta, type ListOption } from "./shared/option-list";
import { fieldBase, floatingSurface, inlineTrigger } from "./shared/styles";

export interface MultiSelectProps extends FieldControlProps {
  options: ListOption[];
  value: string[];
  onValueChange: (value: string[]) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  maxVisible?: number;
  emptyText?: string;
  cta?: ListCta;
  selectAll?: boolean;
  variant?: "filled" | "inline";
  required?: boolean;
  disabled?: boolean;
  id?: string;
  className?: string;
}

function MultiSelect({
  options,
  value,
  onValueChange,
  placeholder = "Select…",
  searchPlaceholder,
  maxVisible = 2,
  emptyText,
  cta,
  selectAll = false,
  variant = "filled",
  required,
  disabled,
  id,
  label,
  hint,
  error,
  optional,
  containerClassName,
  className,
}: MultiSelectProps) {
  const generatedId = React.useId();
  const triggerId = id ?? generatedId;
  const [query, setQuery] = React.useState("");
  const [open, setOpen] = React.useState(false);
  const selected = options.filter((option) => value.includes(option.value));
  const needle = query.trim().toLowerCase();
  const visible = needle
    ? options.filter((option) => `${option.label} ${option.description ?? ""}`.toLowerCase().includes(needle))
    : options;

  const toggle = (option: ListOption) =>
    onValueChange(value.includes(option.value) ? value.filter((v) => v !== option.value) : [...value, option.value]);

  return (
    <Field id={triggerId} label={label} hint={hint} error={error} required={required} optional={optional} className={containerClassName}>
      <PopoverPrimitive.Root
        modal
        open={open}
        onOpenChange={(next) => {
          setOpen(next);
          if (!next) setQuery("");
        }}
      >
        <PopoverPrimitive.Trigger
          id={triggerId}
          disabled={disabled}
          data-v2
          aria-invalid={error ? true : undefined}
          className={cn(variant === "inline" ? cn(inlineTrigger, "h-auto min-h-v2-control-sm justify-between py-1") : cn(fieldBase, "flex min-h-v2-control-md items-center justify-between gap-2 py-1.5 pl-2 pr-4 text-left"), className)}
        >
          <span className="flex min-w-0 flex-1 flex-wrap items-center gap-1.5">
            {selected.length === 0 && <span className={cn("text-v2-ink-tertiary", variant === "filled" && "pl-2")}>{placeholder}</span>}
            {selected.slice(0, maxVisible).map((option) => (
              <span
                key={option.value}
                className={cn("inline-flex items-center gap-1 rounded-v2-xs pl-2.5 pr-1 font-medium text-v2-ink", variant === "inline" ? "h-6 bg-v2-field text-v2-meta" : "h-7 bg-v2-canvas text-v2-sm")}
              >
                {option.label}
                <span
                  role="button"
                  tabIndex={-1}
                  aria-label={`Remove ${option.label}`}
                  onPointerDown={(event) => {
                    event.preventDefault();
                    event.stopPropagation();
                    toggle(option);
                  }}
                  className="flex size-5 items-center justify-center rounded-v2-xs text-v2-ink-tertiary hover:bg-v2-surface-hover hover:text-v2-ink"
                >
                  <X className="size-3" />
                </span>
              </span>
            ))}
            {selected.length > maxVisible && (
              <span className="text-v2-sm font-medium text-v2-ink-secondary">+{selected.length - maxVisible}</span>
            )}
          </span>
          <ChevronDown className="size-4 shrink-0 text-v2-ink-tertiary" />
        </PopoverPrimitive.Trigger>
        <PopoverPrimitive.Portal>
          <PopoverPrimitive.Content
            align="start"
            sideOffset={6}
            className={cn(floatingSurface, "w-[var(--radix-popover-trigger-width)] min-w-[280px]")}
          >
            <OptionList
              multiple
              options={visible}
              selected={value}
              onToggle={toggle}
              searchPlaceholder={searchPlaceholder}
              query={query}
              onQueryChange={setQuery}
              emptyText={emptyText}
              cta={
                cta && {
                  ...cta,
                  onClick: (text) => {
                    setOpen(false);
                    setQuery("");
                    cta.onClick(text);
                  },
                }
              }
            />
            {(value.length > 0 || selectAll) && (
              <div className="flex items-center justify-between border-t border-v2-line px-4 py-2.5 text-v2-sm">
                <span className="text-v2-ink-tertiary">{value.length} selected</span>
                <span className="flex items-center gap-1">
                  {selectAll && value.length < options.length && (
                    <button
                      type="button"
                      data-v2
                      onClick={() => onValueChange(options.filter((option) => !option.disabled).map((option) => option.value))}
                      className="rounded-v2-xs bg-transparent px-1.5 py-0.5 font-semibold text-v2-primary hover:text-v2-primary-hover"
                    >
                      Select all
                    </button>
                  )}
                  {value.length > 0 && (
                    <button
                      type="button"
                      data-v2
                      onClick={() => onValueChange([])}
                      className="rounded-v2-xs bg-transparent px-1.5 py-0.5 font-semibold text-v2-ink-secondary hover:text-v2-ink"
                    >
                      Clear
                    </button>
                  )}
                </span>
              </div>
            )}
          </PopoverPrimitive.Content>
        </PopoverPrimitive.Portal>
      </PopoverPrimitive.Root>
    </Field>
  );
}

export { MultiSelect };
