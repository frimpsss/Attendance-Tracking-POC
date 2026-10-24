import * as React from "react";
import * as PopoverPrimitive from "@radix-ui/react-popover";
import { format as formatDate } from "date-fns";
import { Calendar as CalendarIcon } from "lucide-react";

import { cn } from "@attendance/utils";
import { Field, type FieldControlProps } from "../shared/field";
import { DATE_FORMAT } from "../shared/format";
import { fieldBase, floatingSurface, inlineTrigger } from "../shared/styles";
import { Calendar } from "./calendar";

export interface DatePickerProps extends FieldControlProps {
  value?: Date;
  onChange?: (date: Date | undefined) => void;
  placeholder?: string;
  displayFormat?: string;
  variant?: "filled" | "inline";
  size?: "sm" | "md";
  minDate?: Date;
  maxDate?: Date;
  required?: boolean;
  disabled?: boolean;
  id?: string;
  className?: string;
}

function DatePicker({
  value,
  onChange,
  placeholder = "Pick a date",
  displayFormat = DATE_FORMAT,
  variant = "filled",
  size = "md",
  minDate,
  maxDate,
  required,
  disabled,
  id,
  label,
  hint,
  error,
  optional,
  containerClassName,
  className,
}: DatePickerProps) {
  const generatedId = React.useId();
  const triggerId = id ?? generatedId;
  const [open, setOpen] = React.useState(false);

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
      <PopoverPrimitive.Root open={open} onOpenChange={setOpen}>
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
          <span className={cn("truncate", !value && "text-v2-ink-tertiary")}>
            {value ? formatDate(value, displayFormat) : placeholder}
          </span>
        </PopoverPrimitive.Trigger>
        <PopoverPrimitive.Portal>
          <PopoverPrimitive.Content align="start" sideOffset={6} className={floatingSurface}>
            <Calendar
              mode="single"
              selected={value}
              defaultMonth={value}
              onSelect={(date) => {
                onChange?.(date);
                setOpen(false);
              }}
              disabled={[
                ...(minDate ? [{ before: minDate }] : []),
                ...(maxDate ? [{ after: maxDate }] : []),
              ]}
            />
          </PopoverPrimitive.Content>
        </PopoverPrimitive.Portal>
      </PopoverPrimitive.Root>
    </Field>
  );
}

export { DatePicker };
