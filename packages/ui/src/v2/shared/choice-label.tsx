import * as React from "react";

import { cn } from "@attendance/utils";

export interface ChoiceLabelProps {
  htmlFor: string;
  label?: React.ReactNode;
  description?: React.ReactNode;
  disabled?: boolean;
  reverse?: boolean;
  className?: string;
  children: React.ReactNode;
}

function ChoiceLabel({ htmlFor, label, description, disabled, reverse, className, children }: ChoiceLabelProps) {
  if (!label && !description) return <>{children}</>;
  return (
    <div
      className={cn(
        "font-v2 flex gap-2.5",
        description && !reverse ? "items-start" : "items-center",
        reverse && "flex-row-reverse justify-between gap-6",
        disabled && "opacity-50",
        className,
      )}
    >
      <span className={cn("flex", description && !reverse && "pt-0.5")}>{children}</span>
      <label htmlFor={htmlFor} className={cn("select-none", !disabled && "cursor-pointer")}>
        {label && (
          <span className="block text-v2-ui font-medium leading-[20px] text-v2-ink">{label}</span>
        )}
        {description && (
          <span className="block text-v2-meta leading-[18px] text-v2-ink-tertiary">
            {description}
          </span>
        )}
      </label>
    </div>
  );
}

export { ChoiceLabel };
