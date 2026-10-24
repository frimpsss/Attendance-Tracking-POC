import * as React from "react";
import { ArrowUpRight } from "lucide-react";

import { cn } from "@attendance/utils";

export interface TextLinkProps extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
  tone?: "primary" | "ink";
  external?: boolean;
}

const TextLink = React.forwardRef<HTMLAnchorElement, TextLinkProps>(
  ({ tone = "primary", external, className, children, ...props }, ref) => (
    <a
      ref={ref}
      data-v2
      target={external ? "_blank" : props.target}
      rel={external ? "noreferrer" : props.rel}
      onClick={(event) => {
        event.stopPropagation();
        props.onClick?.(event);
      }}
      className={cn(
        "font-v2 inline-flex items-center gap-0.5 rounded-v2-xs font-medium underline-offset-4 outline-none transition-colors duration-v2-fast hover:underline focus-visible:ring-v2 focus-visible:ring-v2-focus",
        tone === "primary" ? "text-v2-primary hover:text-v2-primary-hover" : "text-v2-ink hover:text-v2-primary",
        className,
      )}
      {...props}
    >
      {children}
      {external && <ArrowUpRight className="size-3.5" />}
    </a>
  ),
);
TextLink.displayName = "TextLink";

export { TextLink };
