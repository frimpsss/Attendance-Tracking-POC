import * as React from "react";
import * as PopoverPrimitive from "@radix-ui/react-popover";
import { format as formatDate } from "date-fns";
import type { DateRange } from "react-day-picker";
import { Calendar as CalendarIcon } from "lucide-react";

import { cn } from "@attendance/utils";
import { Field, type FieldControlProps } from "../shared/field";
import { DATE_FORMAT } from "../shared/format";
import { fieldBase, floatingSurface, inlineTrigger } from "../shared/styles";
import { Calendar } from "./calendar";

export interface DateRangePickerProps extends FieldControlProps {
  value?: DateRange;
  onChange?: (range: DateRange | undefined) => void;
  placeholder?: string;
  displayFormat?: string;
  variant?: "filled" | "inline";
  size?: "sm" | "md";
  required?: boolean;
  disabled?: boolean;
  id?: string;
  className?: string;
}

function DateRangePicker({
  value,
  onChange,
  placeholder = "Pick a date range",
  displayFormat = DATE_FORMAT,
  variant = "filled",
  size = "md",
  required,
  disabled,
  id,
  label,
  hint,
  error,
  optional,
  containerClassName,
  className,
}: DateRangePickerProps) {
  const generatedId = React.useId();
  const triggerId = id ?? generatedId;
  const [open, setOpen] = React.useState(false);
  const [draft, setDraft] = React.useState<DateRange | undefined>(value);

  const handleOpenChange = (next: boolean) => {
    if (next) setDraft(value);
    setOpen(next);
  };

  const handleDayClick = (day: Date) => {
    if (!draft?.from || draft.to) {
      setDraft({ from: day, to: undefined });
      return;
    }
    const range =
      day < draft.from ? { from: day, to: draft.from } : { from: draft.from, to: day };
    setDraft(range);
    onChange?.(range);
    setOpen(false);
  };

  const text = value?.from
    ? value.to
      ? `${formatDate(value.from, displayFormat)} – ${formatDate(value.to, displayFormat)}`
      : formatDate(value.from, displayFormat)
    : placeholder;

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
      <PopoverPrimitive.Root open={open} onOpenChange={handleOpenChange}>
        <PopoverPrimitive.Trigger
          id={triggerId}
          disabled={disabled}
          data-v2
          aria-invalid={error ? true : undefined}
          className={cn(
            variant === "inline"
              ? inlineTrigger
              : cn(
                  fieldBase,
                  "flex items-center gap-2.5 px-4 text-left",
                  size === "sm" ? "h-v2-control-sm text-v2-base" : "h-v2-control-md",
                ),
            className,
          )}
        >
          <span className="flex shrink-0 text-v2-ink-tertiary">
            <CalendarIcon className={variant === "inline" ? "size-4" : "size-[18px]"} />
          </span>
          <span className={cn("truncate", !value?.from && "text-v2-ink-tertiary")}>{text}</span>
        </PopoverPrimitive.Trigger>
        <PopoverPrimitive.Portal>
          <PopoverPrimitive.Content align="start" sideOffset={6} className={floatingSurface}>
            <Calendar
              mode="range"
              numberOfMonths={2}
              selected={draft}
              defaultMonth={value?.from}
              onSelect={(_, day) => handleDayClick(day)}
            />
          </PopoverPrimitive.Content>
        </PopoverPrimitive.Portal>
      </PopoverPrimitive.Root>
    </Field>
  );
}

export { DateRangePicker };
