import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@attendance/utils";

const typographyVariants = cva("font-v2", {
  variants: {
    variant: {
      display: "text-v2-7xl font-semibold leading-[40px]",
      h1: "text-v2-4xl font-semibold leading-[32px]",
      h2: "text-v2-2xl font-semibold leading-[28px]",
      h3: "text-v2-lg font-semibold leading-[24px]",
      h4: "text-v2-base font-semibold leading-[20px]",
      "body-lg": "text-v2-lg leading-[26px]",
      body: "text-v2-base leading-[22px]",
      "body-sm": "text-v2-sm leading-[20px]",
      caption: "text-v2-xs leading-[16px]",
      overline: "text-v2-2xs font-semibold uppercase leading-[16px] tracking-[0.08em]",
      code: "rounded-v2-xs bg-v2-surface-hover px-1.5 py-0.5 font-mono text-v2-meta",
      kbd: "inline-flex h-5 min-w-5 items-center justify-center rounded-v2-xs border border-v2-line-strong bg-v2-canvas px-1 font-mono text-v2-2xs font-medium",
    },
    tone: {
      default: "text-v2-ink",
      secondary: "text-v2-ink-secondary",
      tertiary: "text-v2-ink-tertiary",
      primary: "text-v2-primary",
      danger: "text-v2-danger",
      inherit: "",
    },
    weight: {
      regular: "font-normal",
      medium: "font-medium",
      semibold: "font-semibold",
    },
    numeric: {
      true: "tabular-nums",
    },
    truncate: {
      true: "truncate",
    },
  },
  defaultVariants: { variant: "body" },
});

type Variant = NonNullable<VariantProps<typeof typographyVariants>["variant"]>;

const defaultElement: Record<Variant, React.ElementType> = {
  display: "h1",
  h1: "h1",
  h2: "h2",
  h3: "h3",
  h4: "h4",
  "body-lg": "p",
  body: "p",
  "body-sm": "p",
  caption: "span",
  overline: "span",
  code: "code",
  kbd: "kbd",
};

const defaultTone: Partial<Record<Variant, "tertiary" | "secondary">> = {
  overline: "tertiary",
  kbd: "secondary",
};

export interface TypographyProps
  extends React.HTMLAttributes<HTMLElement>,
    VariantProps<typeof typographyVariants> {
  as?: React.ElementType;
}

const Typography = React.forwardRef<HTMLElement, TypographyProps>(
  ({ variant, tone, weight, numeric, truncate, as, className, ...props }, ref) => {
    const resolved = variant ?? "body";
    const Comp = as ?? defaultElement[resolved];
    return (
      <Comp
        ref={ref}
        className={cn(
          typographyVariants({
            variant: resolved,
            tone: tone ?? defaultTone[resolved] ?? "default",
            weight,
            numeric,
            truncate,
          }),
          className,
        )}
        {...props}
      />
    );
  },
);
Typography.displayName = "Typography";

export { Typography };
