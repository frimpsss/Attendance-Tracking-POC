import * as React from "react";
import * as SelectPrimitive from "@radix-ui/react-select";
import { Check, ChevronDown } from "lucide-react";

import { cn } from "@attendance/utils";
import { Field, type FieldControlProps } from "./shared/field";
import { fieldBase, floatingItem, floatingSurface, inlineTrigger } from "./shared/styles";

export interface SelectOption {
  value: string;
  label: React.ReactNode;
  disabled?: boolean;
}

export interface SelectOptionGroup {
  label: React.ReactNode;
  options: SelectOption[];
}

const sizes = {
  sm: "h-v2-control-sm text-v2-base",
  md: "h-v2-control-md",
  lg: "h-v2-control-lg",
} as const;

export interface SelectProps extends FieldControlProps {
  options: (SelectOption | SelectOptionGroup)[];
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  placeholder?: string;
  size?: keyof typeof sizes;
  variant?: "filled" | "inline";
  required?: boolean;
  disabled?: boolean;
  name?: string;
  id?: string;
  className?: string;
}

const isGroup = (entry: SelectOption | SelectOptionGroup): entry is SelectOptionGroup =>
  "options" in entry;

function SelectItem({ option }: { option: SelectOption }) {
  return (
    <SelectPrimitive.Item
      data-v2
      value={option.value}
      disabled={option.disabled}
      className={cn(floatingItem, "pr-8")}
    >
      <SelectPrimitive.ItemText>{option.label}</SelectPrimitive.ItemText>
      <span className="absolute right-2 flex items-center">
        <SelectPrimitive.ItemIndicator>
          <Check className="!text-v2-primary" />
        </SelectPrimitive.ItemIndicator>
      </span>
    </SelectPrimitive.Item>
  );
}

function Select({
  options,
  value,
  defaultValue,
  onValueChange,
  placeholder = "Select…",
  size = "md",
  variant = "filled",
  required,
  disabled,
  name,
  id,
  label,
  hint,
  error,
  optional,
  containerClassName,
  className,
}: SelectProps) {
  const generatedId = React.useId();
  const triggerId = id ?? generatedId;
  return (
    <Field
      id={triggerId}
      label={label}
      hint={hint}
      error={error}
      required={required}
      optional={optional}
      className={containerClassName}
    >
      <SelectPrimitive.Root
        value={value}
        defaultValue={defaultValue}
        onValueChange={onValueChange}
        required={required}
        disabled={disabled}
        name={name}
      >
        <SelectPrimitive.Trigger
          id={triggerId}
          data-v2
          aria-invalid={error ? true : undefined}
          aria-describedby={error || hint ? `${triggerId}-description` : undefined}
          className={cn(
            variant === "inline"
              ? cn(inlineTrigger, "justify-between")
              : cn(fieldBase, sizes[size], "flex items-center justify-between gap-2 px-4 text-left"),
            "data-[placeholder]:text-v2-ink-tertiary [&>span]:truncate",
            className,
          )}
        >
          <SelectPrimitive.Value placeholder={placeholder} />
          <SelectPrimitive.Icon asChild>
            <ChevronDown className="size-4 shrink-0 text-v2-ink-tertiary" />
          </SelectPrimitive.Icon>
        </SelectPrimitive.Trigger>
        <SelectPrimitive.Portal>
          <SelectPrimitive.Content
            position="popper"
            sideOffset={4}
            className={cn(
              floatingSurface,
              "relative max-h-72 w-full min-w-[var(--radix-select-trigger-width)]",
            )}
          >
            <SelectPrimitive.Viewport className="p-1">
              {options.map((entry, index) =>
                isGroup(entry) ? (
                  <SelectPrimitive.Group key={index}>
                    {index > 0 && <SelectPrimitive.Separator className="-mx-1 my-1 h-px bg-v2-line" />}
                    <SelectPrimitive.Label className="px-2 pb-1 pt-2 text-v2-2xs font-semibold uppercase tracking-[0.08em] text-v2-ink-tertiary">
                      {entry.label}
                    </SelectPrimitive.Label>
                    {entry.options.map((option) => (
                      <SelectItem key={option.value} option={option} />
                    ))}
                  </SelectPrimitive.Group>
                ) : (
                  <SelectItem key={entry.value} option={entry} />
                ),
              )}
            </SelectPrimitive.Viewport>
          </SelectPrimitive.Content>
        </SelectPrimitive.Portal>
      </SelectPrimitive.Root>
    </Field>
  );
}

export { Select };
