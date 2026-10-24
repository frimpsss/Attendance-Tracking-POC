import * as React from "react";
import * as PopoverPrimitive from "@radix-ui/react-popover";
import { ChevronDown } from "lucide-react";

import { cn } from "@attendance/utils";
import { Field, type FieldControlProps } from "./shared/field";
import { OptionList, type ListCta, type ListOption } from "./shared/option-list";
import { fieldBase, floatingSurface, inlineTrigger } from "./shared/styles";

export interface ComboboxProps extends FieldControlProps {
  options: ListOption[];
  value?: string;
  onValueChange?: (value: string, option: ListOption) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  onSearch?: (query: string) => void;
  loading?: boolean;
  emptyText?: string;
  cta?: ListCta;
  variant?: "filled" | "inline";
  required?: boolean;
  disabled?: boolean;
  id?: string;
  className?: string;
}

const matches = (option: ListOption, query: string) => {
  const needle = query.trim().toLowerCase();
  if (!needle) return true;
  return `${option.label} ${option.description ?? ""}`.toLowerCase().includes(needle);
};

function Combobox({
  options,
  value,
  onValueChange,
  placeholder = "Select…",
  searchPlaceholder,
  onSearch,
  loading,
  emptyText,
  cta,
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
}: ComboboxProps) {
  const generatedId = React.useId();
  const triggerId = id ?? generatedId;
  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState("");
  const selected = options.find((option) => option.value === value);
  const visible = onSearch ? options : options.filter((option) => matches(option, query));

  const changeQuery = (next: string) => {
    setQuery(next);
    onSearch?.(next);
  };

  return (
    <Field id={triggerId} label={label} hint={hint} error={error} required={required} optional={optional} className={containerClassName}>
      <PopoverPrimitive.Root
        modal
        open={open}
        onOpenChange={(next) => {
          setOpen(next);
          if (!next) changeQuery("");
        }}
      >
        <PopoverPrimitive.Trigger
          id={triggerId}
          disabled={disabled}
          data-v2
          aria-invalid={error ? true : undefined}
          className={cn(variant === "inline" ? cn(inlineTrigger, "justify-between") : cn(fieldBase, "flex h-v2-control-md items-center justify-between gap-2 px-4 text-left"), className)}
        >
          <span className={cn("min-w-0 truncate", !selected && "text-v2-ink-tertiary")}>
            {selected?.label ?? placeholder}
          </span>
          <ChevronDown className="size-4 shrink-0 text-v2-ink-tertiary" />
        </PopoverPrimitive.Trigger>
        <PopoverPrimitive.Portal>
          <PopoverPrimitive.Content
            align="start"
            sideOffset={6}
            className={cn(floatingSurface, "w-[var(--radix-popover-trigger-width)] min-w-[300px]")}
          >
            <OptionList
              options={visible}
              selected={value ? [value] : []}
              onToggle={(option) => {
                onValueChange?.(option.value, option);
                setOpen(false);
                changeQuery("");
              }}
              searchPlaceholder={searchPlaceholder}
              query={query}
              onQueryChange={changeQuery}
              loading={loading}
              emptyText={emptyText}
              cta={
                cta && {
                  ...cta,
                  onClick: (text) => {
                    setOpen(false);
                    cta.onClick(text);
                  },
                }
              }
            />
          </PopoverPrimitive.Content>
        </PopoverPrimitive.Portal>
      </PopoverPrimitive.Root>
    </Field>
  );
}

export { Combobox };
