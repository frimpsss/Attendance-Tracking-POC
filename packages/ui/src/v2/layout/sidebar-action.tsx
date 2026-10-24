import * as React from "react";

import { cn } from "@attendance/utils";
import { focusRing } from "../shared/styles";

export interface SidebarActionProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  icon: React.ReactNode;
  label: string;
  trailing?: React.ReactNode;
  indicator?: boolean;
}

const SidebarAction = React.forwardRef<HTMLButtonElement, SidebarActionProps>(
  ({ icon, label, trailing, indicator, className, ...props }, ref) => (
    <button
      ref={ref}
      type="button"
      data-v2
      title={label}
      className={cn(
        "group flex w-full items-center gap-3 rounded-v2-sm bg-transparent px-3 py-2 text-left text-v2-base font-medium text-v2-ink-tertiary transition-colors duration-v2-base hover:text-v2-primary data-[state=open]:text-v2-primary group-data-[collapsed]/sidebar:justify-center group-data-[collapsed]/sidebar:px-2",
        focusRing,
        className,
      )}
      {...props}
    >
      <span className="relative flex size-5 shrink-0 items-center justify-center text-v2-ink-tertiary/80 transition-colors duration-v2-base group-hover:text-v2-primary group-data-[state=open]:text-v2-primary [&_svg]:size-[19px]">
        {icon}
        {indicator && (
          <span className="absolute -right-0.5 -top-0.5 hidden size-2 rounded-full bg-v2-primary ring-2 ring-v2-surface group-data-[collapsed]/sidebar:block" />
        )}
      </span>
      <span className="min-w-0 flex-1 truncate group-data-[collapsed]/sidebar:hidden">
        {label}
      </span>
      {trailing && (
        <span className="flex shrink-0 items-center group-data-[collapsed]/sidebar:hidden">
          {trailing}
        </span>
      )}
    </button>
  ),
);
SidebarAction.displayName = "SidebarAction";

export { SidebarAction };
