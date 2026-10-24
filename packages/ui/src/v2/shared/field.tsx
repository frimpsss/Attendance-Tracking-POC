import * as React from "react";
import * as LabelPrimitive from "@radix-ui/react-label";

import { cn } from "@attendance/utils";

export interface FieldProps {
  id?: string;
  label?: React.ReactNode;
  hint?: React.ReactNode;
  error?: React.ReactNode;
  required?: boolean;
  optional?: boolean;
  className?: string;
  children: React.ReactNode;
}

export interface FieldControlProps {
  label?: React.ReactNode;
  hint?: React.ReactNode;
  error?: React.ReactNode;
  optional?: boolean;
  containerClassName?: string;
}

function Field({ id, label, hint, error, required, optional, className, children }: FieldProps) {
  if (!label && !hint && !error) return className ? <div className={className}>{children}</div> : <>{children}</>;
  return (
    <div className={cn("font-v2 flex flex-col gap-2", className)}>
      {label && (
        <LabelPrimitive.Root
          htmlFor={id}
          className="inline-flex items-center gap-1 text-v2-sm font-medium leading-[20px] text-v2-ink"
        >
          {label}
          {required && <span aria-hidden className="text-v2-danger">*</span>}
          {optional && <span className="font-normal text-v2-ink-tertiary">(optional)</span>}
        </LabelPrimitive.Root>
      )}
      {children}
      {(error || hint) && (
        <p
          id={id ? `${id}-description` : undefined}
          className={cn(
            "text-v2-sm leading-[18px]",
            error ? "text-v2-danger" : "text-v2-ink-tertiary",
          )}
        >
          {error || hint}
        </p>
      )}
    </div>
  );
}

export { Field };
