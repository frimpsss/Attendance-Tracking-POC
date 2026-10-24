import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@attendance/utils";
import { focusRing } from "./shared/styles";
import { Spinner } from "./spinner";

const buttonVariants = cva(
  cn(
    "font-v2 inline-flex shrink-0 select-none items-center justify-center gap-2 whitespace-nowrap rounded-v2-sm font-medium transition-colors duration-v2-fast ease-out disabled:pointer-events-none disabled:opacity-v2-disabled [&_svg]:pointer-events-none [&_svg]:shrink-0",
    focusRing,
  ),
  {
    variants: {
      variant: {
        primary:
          "bg-v2-primary text-v2-on-primary hover:bg-v2-primary-hover active:bg-v2-primary-active",
        secondary:
          "bg-v2-field text-v2-ink hover:bg-v2-field-hover active:bg-v2-surface-active",
        soft: "bg-v2-primary-soft text-v2-primary hover:bg-v2-primary-soft-hover active:bg-v2-primary-soft-hover active:text-v2-primary-active",
        ghost:
          "bg-transparent text-v2-ink-secondary hover:bg-v2-surface-hover hover:text-v2-ink active:bg-v2-surface-active",
        danger: "bg-v2-danger text-white hover:bg-v2-danger-hover active:bg-v2-danger-hover",
        "danger-ghost": "bg-transparent text-v2-danger hover:bg-v2-danger-soft active:bg-v2-danger-soft",
        text: "h-auto bg-transparent px-0 font-medium text-v2-primary hover:text-v2-primary-hover active:text-v2-primary-active",
        link: "h-auto bg-transparent px-0 text-v2-ink underline decoration-[1.5px] underline-offset-[6px] hover:text-v2-primary active:text-v2-primary-active",
      },
      size: {
        sm: "h-v2-control-sm px-3.5 text-v2-base [&_svg]:size-4",
        md: "h-v2-control-md px-5 text-v2-md [&_svg]:size-[18px]",
        lg: "h-v2-control-lg px-6 text-v2-lg [&_svg]:size-5",
        "icon-sm": "size-v2-control-sm [&_svg]:size-4",
        icon: "size-v2-control-md [&_svg]:size-[18px]",
        "icon-lg": "size-v2-control-lg [&_svg]:size-5",
      },
      block: {
        true: "w-full",
      },
    },
    compoundVariants: [
      { variant: "link", className: "h-auto px-0" },
      { variant: "text", className: "h-auto px-0" },
    ],
    defaultVariants: {
      variant: "primary",
      size: "md",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
  leadingIcon?: React.ReactNode;
  trailingIcon?: React.ReactNode;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant,
      size,
      block,
      fullWidth,
      asChild = false,
      loading = false,
      disabled,
      leadingIcon,
      trailingIcon,
      children,
      type,
      ...props
    },
    ref,
  ) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        ref={ref}
        data-v2
        data-press
        type={asChild ? undefined : (type ?? "button")}
        className={cn(buttonVariants({ variant, size, block: block ?? fullWidth }), className)}
        disabled={disabled || loading}
        aria-busy={loading || undefined}
        {...props}
      >
        {asChild ? (
          children
        ) : (
          <>
            {loading ? <Spinner size="sm" /> : leadingIcon}
            {children}
            {trailingIcon}
          </>
        )}
      </Comp>
    );
  },
);
Button.displayName = "Button";

export { Button };
