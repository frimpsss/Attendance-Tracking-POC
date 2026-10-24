import * as React from "react";
import * as CheckboxPrimitive from "@radix-ui/react-checkbox";
import { Check, Minus } from "lucide-react";

import { cn } from "@attendance/utils";
import { ChoiceLabel } from "./shared/choice-label";
import { focusRing } from "./shared/styles";

export interface CheckboxProps
  extends React.ComponentPropsWithoutRef<typeof CheckboxPrimitive.Root> {
  label?: React.ReactNode;
  description?: React.ReactNode;
  containerClassName?: string;
}

const Checkbox = React.forwardRef<
  React.ElementRef<typeof CheckboxPrimitive.Root>,
  CheckboxProps
>(({ id, label, description, containerClassName, className, ...props }, ref) => {
  const generatedId = React.useId();
  const checkboxId = id ?? generatedId;
  return (
    <ChoiceLabel
      htmlFor={checkboxId}
      label={label}
      description={description}
      disabled={props.disabled}
      className={containerClassName}
    >
      <CheckboxPrimitive.Root
        ref={ref}
        id={checkboxId}
        data-v2
        data-press="sm"
        className={cn(
          "peer inline-flex size-4 shrink-0 items-center justify-center rounded-v2-xs border border-v2-line-strong bg-v2-canvas text-v2-on-primary transition-colors hover:border-v2-ink-disabled disabled:cursor-not-allowed data-[state=checked]:border-v2-primary data-[state=indeterminate]:border-v2-primary data-[state=checked]:bg-v2-primary data-[state=indeterminate]:bg-v2-primary",
          focusRing,
          className,
        )}
        {...props}
      >
        <CheckboxPrimitive.Indicator className="flex items-center justify-center">
          {props.checked === "indeterminate" ? (
            <Minus className="size-3" strokeWidth={3} />
          ) : (
            <Check className="size-3" strokeWidth={3} />
          )}
        </CheckboxPrimitive.Indicator>
      </CheckboxPrimitive.Root>
    </ChoiceLabel>
  );
});
Checkbox.displayName = "Checkbox";

export { Checkbox };
