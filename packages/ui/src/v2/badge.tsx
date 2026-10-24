import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@attendance/utils";

const badgeVariants = cva(
  "font-v2 inline-flex items-center gap-1.5 whitespace-nowrap rounded-v2-xs font-medium [&_svg]:size-3",
  {
    variants: {
      tone: {
        neutral: "bg-v2-surface-hover text-v2-ink-secondary",
        primary: "bg-v2-primary-soft text-v2-primary",
        info: "bg-v2-primary-soft text-v2-primary",
        success: "bg-v2-success-soft text-v2-success",
        warning: "bg-v2-warning-soft text-v2-warning",
        danger: "bg-v2-danger-soft text-v2-danger",
        solid: "bg-v2-primary text-v2-on-primary",
        outline: "border border-v2-line-strong text-v2-ink-secondary",
      },
      size: {
        sm: "h-5 px-1.5 text-v2-2xs",
        md: "h-6 px-2 text-v2-xs",
      },
    },
    defaultVariants: { tone: "neutral", size: "md" },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {
  dot?: boolean;
}

function Badge({ className, tone, size, dot, children, ...props }: BadgeProps) {
  return (
    <span className={cn(badgeVariants({ tone, size }), className)} {...props}>
      {dot && <span className="size-1.5 rounded-full bg-current" />}
      {children}
    </span>
  );
}

export { Badge };
