import * as React from "react";
import * as SwitchPrimitive from "@radix-ui/react-switch";

import { cn } from "@attendance/utils";
import { ChoiceLabel } from "./shared/choice-label";
import { focusRing } from "./shared/styles";

const sizes = {
  sm: { root: "h-4 w-7", thumb: "size-3 data-[state=checked]:translate-x-3" },
  md: { root: "h-5 w-9", thumb: "size-4 data-[state=checked]:translate-x-4" },
} as const;

export interface SwitchProps
  extends React.ComponentPropsWithoutRef<typeof SwitchPrimitive.Root> {
  size?: keyof typeof sizes;
  label?: React.ReactNode;
  description?: React.ReactNode;
  labelPosition?: "right" | "left";
  containerClassName?: string;
}

const Switch = React.forwardRef<
  React.ElementRef<typeof SwitchPrimitive.Root>,
  SwitchProps
>(
  (
    { id, size = "md", label, description, labelPosition = "left", containerClassName, className, ...props },
    ref,
  ) => {
    const generatedId = React.useId();
    const switchId = id ?? generatedId;
    return (
      <ChoiceLabel
        htmlFor={switchId}
        label={label}
        description={description}
        disabled={props.disabled}
        reverse={labelPosition === "left"}
        className={containerClassName}
      >
        <SwitchPrimitive.Root
          ref={ref}
          id={switchId}
          data-v2
          data-press="sm"
          className={cn(
            "peer inline-flex shrink-0 cursor-pointer items-center !rounded-full p-0.5 transition-colors duration-v2-base disabled:cursor-not-allowed data-[state=checked]:bg-v2-primary data-[state=unchecked]:bg-v2-line-strong",
            sizes[size].root,
            focusRing,
            className,
          )}
          {...props}
        >
          <SwitchPrimitive.Thumb
            className={cn(
              "pointer-events-none block !rounded-full bg-white transition-transform duration-v2-base data-[state=unchecked]:translate-x-0",
              sizes[size].thumb,
            )}
          />
        </SwitchPrimitive.Root>
      </ChoiceLabel>
    );
  },
);
Switch.displayName = "Switch";

export { Switch };
