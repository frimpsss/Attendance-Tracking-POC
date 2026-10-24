import * as React from "react";
import * as RadioGroupPrimitive from "@radix-ui/react-radio-group";

import { cn } from "@attendance/utils";
import { ChoiceLabel } from "./shared/choice-label";
import { Field, type FieldControlProps } from "./shared/field";
import { focusRing } from "./shared/styles";

export interface RadioOption {
  value: string;
  label: React.ReactNode;
  description?: React.ReactNode;
  disabled?: boolean;
}

export interface RadioGroupProps
  extends Omit<React.ComponentPropsWithoutRef<typeof RadioGroupPrimitive.Root>, "children">,
    FieldControlProps {
  options: RadioOption[];
  variant?: "default" | "card";
}

const RadioGroup = React.forwardRef<
  React.ElementRef<typeof RadioGroupPrimitive.Root>,
  RadioGroupProps
>(
  (
    {
      options,
      variant = "default",
      orientation = "vertical",
      label,
      hint,
      error,
      optional,
      required,
      containerClassName,
      className,
      ...props
    },
    ref,
  ) => {
    const baseId = React.useId();
    return (
      <Field
        label={label}
        hint={hint}
        error={error}
        required={required}
        optional={optional}
        className={containerClassName}
      >
        <RadioGroupPrimitive.Root
          ref={ref}
          orientation={orientation}
          required={required}
          className={cn(
            "flex gap-2.5",
            orientation === "vertical" ? "flex-col" : "flex-row flex-wrap gap-x-5",
            variant === "card" && "gap-2",
            className,
          )}
          {...props}
        >
          {options.map((option) => {
            const itemId = `${baseId}-${option.value}`;
            return (
              <ChoiceLabel
                key={option.value}
                htmlFor={itemId}
                label={option.label}
                description={option.description}
                disabled={option.disabled}
                className={cn(
                  variant === "card" &&
                    "rounded-v2-md border border-transparent bg-v2-field px-4 py-3.5 transition-colors has-[[data-state=checked]]:border-v2-primary has-[[data-state=checked]]:bg-v2-canvas",
                )}
              >
                <RadioGroupPrimitive.Item
                  id={itemId}
                  value={option.value}
                  disabled={option.disabled}
                  data-v2
                  data-press="sm"
                  className={cn(
                    "peer inline-flex size-4 shrink-0 items-center justify-center !rounded-full border border-v2-line-strong bg-v2-canvas transition-colors hover:border-v2-ink-disabled disabled:cursor-not-allowed data-[state=checked]:border-v2-primary",
                    focusRing,
                  )}
                >
                  <RadioGroupPrimitive.Indicator className="size-2 rounded-full bg-v2-primary" />
                </RadioGroupPrimitive.Item>
              </ChoiceLabel>
            );
          })}
        </RadioGroupPrimitive.Root>
      </Field>
    );
  },
);
RadioGroup.displayName = "RadioGroup";

export { RadioGroup };
