import * as React from "react";

import { cn } from "@attendance/utils";

const variants = {
  plain: "bg-v2-canvas",
  filled: "bg-v2-surface",
  outline: "bg-v2-surface",
} as const;

const paddings = {
  none: "",
  sm: "p-4",
  md: "p-5",
  lg: "p-6",
} as const;

export interface CardProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "title"> {
  variant?: keyof typeof variants;
  padding?: keyof typeof paddings;
  title?: React.ReactNode;
  description?: React.ReactNode;
  actions?: React.ReactNode;
  footer?: React.ReactNode;
  bodyClassName?: string;
}

const Card = React.forwardRef<HTMLDivElement, CardProps>(
  (
    { variant = "plain", padding = "md", title, description, actions, footer, bodyClassName, className, children, ...props },
    ref,
  ) => {
    const hasHeader = title || description || actions;
    const isPlain = variant === "plain";
    return (
      <div
        ref={ref}
        className={cn("font-v2 flex flex-col rounded-v2-md text-v2-ink", variants[variant], className)}
        {...props}
      >
        {hasHeader && (
          <div
            className={cn(
              "flex items-start justify-between gap-4",
              isPlain
                ? cn(children ? "pb-5" : "pb-0")
                : padding === "none"
                  ? cn(paddings.md, children && "pb-4")
                  : cn(paddings[padding], children && "pb-0"),
            )}
          >
            <div className="min-w-0">
              {title && (
                <h3 className="text-v2-lg font-semibold leading-[24px] text-v2-ink">{title}</h3>
              )}
              {description && (
                <p className="mt-1 text-v2-sm leading-[20px] text-v2-ink-secondary">{description}</p>
              )}
            </div>
            {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
          </div>
        )}
        {children && (
          <div className={cn("flex-1", !isPlain && paddings[padding], bodyClassName)}>
            {children}
          </div>
        )}
        {footer && (
          <div className={cn("flex items-center justify-end gap-2 border-t border-v2-line pt-4", !isPlain && "px-5 pb-4")}>
            {footer}
          </div>
        )}
      </div>
    );
  },
);
Card.displayName = "Card";

export { Card };
