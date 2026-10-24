import * as React from "react";
import { X } from "lucide-react";

import { cn } from "@attendance/utils";

const tones = {
  neutral: "bg-v2-surface text-v2-ink",
  primary: "bg-v2-primary-soft text-v2-ink",
  info: "bg-v2-primary-soft text-v2-ink",
  success: "bg-v2-success-soft text-v2-ink",
  warning: "bg-v2-warning-soft text-v2-ink",
  danger: "bg-v2-danger-soft text-v2-ink",
} as const;

export interface AlertProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "title"> {
  tone?: keyof typeof tones;
  title?: React.ReactNode;
  action?: React.ReactNode;
  onDismiss?: () => void;
}

function Alert({ tone = "neutral", title, action, onDismiss, className, children, ...props }: AlertProps) {
  return (
    <div
      role="alert"
      className={cn("font-v2 flex gap-3 rounded-v2-md px-4 py-3.5 text-v2-ui leading-[20px]", tones[tone], className)}
      {...props}
    >
      <div className="flex-1">
        {title && <p className="font-semibold">{title}</p>}
        {children && <div className="text-v2-ink-secondary">{children}</div>}
        {action && <div className="mt-2.5 flex gap-2">{action}</div>}
      </div>
      {onDismiss && (
        <button
          type="button"
          data-v2
          onClick={onDismiss}
          aria-label="Dismiss"
          className="-mr-1 -mt-0.5 flex size-6 items-center justify-center rounded-v2-xs bg-transparent text-v2-ink-tertiary transition-colors duration-v2-fast hover:bg-v2-ink/5 hover:text-v2-ink"
        >
          <X className="size-3.5" />
        </button>
      )}
    </div>
  );
}

export { Alert };
