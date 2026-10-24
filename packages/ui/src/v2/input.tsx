import * as React from "react";

import { cn } from "@attendance/utils";
import { Field, type FieldControlProps } from "./shared/field";
import { fieldShell, inlineShell } from "./shared/styles";

const sizes = {
  sm: "h-v2-control-sm text-v2-base",
  md: "h-v2-control-md",
  lg: "h-v2-control-lg",
} as const;

export interface InputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "size" | "prefix">,
    FieldControlProps {
  size?: keyof typeof sizes;
  variant?: "filled" | "inline";
  prefix?: React.ReactNode;
  suffix?: React.ReactNode;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    {
      id,
      label,
      hint,
      error,
      optional,
      required,
      containerClassName,
      className,
      size = "md",
      variant = "filled",
      prefix,
      suffix,
      type = "text",
      ...props
    },
    ref,
  ) => {
    const generatedId = React.useId();
    const inputId = id ?? generatedId;
    const inputRef = React.useRef<HTMLInputElement>(null);
    React.useImperativeHandle(ref, () => inputRef.current as HTMLInputElement);

    return (
      <Field
        id={inputId}
        label={label}
        hint={hint}
        error={error}
        required={required}
        optional={optional}
        className={containerClassName}
      >
        <div
          onMouseDown={(event) => {
            if (event.target !== inputRef.current) {
              event.preventDefault();
              inputRef.current?.focus();
            }
          }}
          className={cn(variant === "inline" ? cn(inlineShell, "h-v2-control-sm") : cn(fieldShell, sizes[size]), className)}
        >
          {prefix && (
            <span className="flex shrink-0 select-none items-center whitespace-nowrap text-v2-ink-tertiary [&_svg]:size-[18px]">
              {prefix}
            </span>
          )}
          <input
            ref={inputRef}
            id={inputId}
            type={type}
            required={required}
            aria-invalid={error ? true : undefined}
            aria-describedby={error || hint ? `${inputId}-description` : undefined}
            className="h-full w-full min-w-0 flex-1 bg-transparent outline-none placeholder:text-v2-ink-tertiary disabled:cursor-not-allowed file:border-0 file:bg-transparent file:text-v2-sm file:font-medium"
            {...props}
          />
          {suffix && (
            <span className="flex shrink-0 select-none items-center whitespace-nowrap text-v2-ink-tertiary [&_svg]:size-[18px]">
              {suffix}
            </span>
          )}
        </div>
      </Field>
    );
  },
);
Input.displayName = "Input";

export { Input };
