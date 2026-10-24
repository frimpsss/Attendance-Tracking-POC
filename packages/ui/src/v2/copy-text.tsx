import * as React from "react";
import { Check, Copy } from "lucide-react";

import { cn } from "@attendance/utils";
import { Button } from "./button";
import { Field, type FieldControlProps } from "./shared/field";
import { fieldShell, focusRing } from "./shared/styles";
import { Tooltip } from "./tooltip";

const writeClipboard = async (value: string) => {
  try {
    await navigator.clipboard.writeText(value);
    return true;
  } catch {
    const area = document.createElement("textarea");
    area.value = value;
    area.style.position = "fixed";
    area.style.opacity = "0";
    document.body.appendChild(area);
    area.select();
    const ok = document.execCommand("copy");
    area.remove();
    return ok;
  }
};

function useCopy(value: string, onCopy?: (value: string) => void) {
  const [copied, setCopied] = React.useState(false);
  const timer = React.useRef<number>();
  React.useEffect(() => () => window.clearTimeout(timer.current), []);
  const copy = async () => {
    if (!(await writeClipboard(value))) return;
    setCopied(true);
    onCopy?.(value);
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setCopied(false), 1600);
  };
  return { copied, copy };
}

export interface CopyTextProps extends FieldControlProps {
  value: string;
  display?: React.ReactNode;
  variant?: "inline" | "field" | "code";
  mono?: boolean;
  onCopy?: (value: string) => void;
  className?: string;
}

function CopyText({
  value,
  display,
  variant = "inline",
  mono,
  onCopy,
  label,
  hint,
  error,
  optional,
  containerClassName,
  className,
}: CopyTextProps) {
  const { copied, copy } = useCopy(value, onCopy);
  const Icon = copied ? Check : Copy;

  if (variant === "field") {
    return (
      <Field label={label} hint={hint} error={error} optional={optional} className={containerClassName}>
        <div className={cn("flex items-center gap-2", className)}>
          <div className={cn(fieldShell, "h-v2-control-md min-w-0 flex-1 cursor-text")}>
            <span className={cn("min-w-0 flex-1 select-all truncate", mono && "font-mono text-v2-sm")}>{display ?? value}</span>
          </div>
          <Button variant={copied ? "soft" : "secondary"} leadingIcon={<Icon />} onClick={() => void copy()} aria-live="polite">
            {copied ? "Copied" : "Copy"}
          </Button>
        </div>
      </Field>
    );
  }

  if (variant === "code") {
    return (
      <button
        type="button"
        data-v2
        data-press
        onClick={() => void copy()}
        aria-label={copied ? `Copied ${value}` : `Copy ${value}`}
        className={cn(
          "font-v2 group inline-flex max-w-full items-center gap-2 rounded-v2-sm bg-v2-field px-2.5 py-1 text-v2-sm text-v2-ink transition-colors duration-v2-fast hover:bg-v2-field-hover",
          focusRing,
          className,
        )}
      >
        <span className="truncate font-mono">{display ?? value}</span>
        <Icon className={cn("size-3.5 shrink-0", copied ? "text-v2-primary" : "text-v2-ink-tertiary group-hover:text-v2-ink")} />
      </button>
    );
  }

  return (
    <span className={cn("font-v2 group inline-flex max-w-full items-center gap-1", className)}>
      <span className={cn("truncate", mono && "font-mono")}>{display ?? value}</span>
      <Tooltip content={copied ? "Copied" : "Copy"}>
        <button
          type="button"
          data-v2
          onClick={(event) => {
            event.stopPropagation();
            void copy();
          }}
          aria-label={copied ? `Copied ${value}` : `Copy ${value}`}
          className={cn(
            "flex size-6 shrink-0 items-center justify-center rounded-v2-xs bg-transparent transition-[color,background-color,opacity] duration-v2-fast hover:bg-v2-surface-hover",
            copied ? "text-v2-primary opacity-100" : "text-v2-ink-tertiary opacity-60 hover:text-v2-ink group-hover:opacity-100",
            focusRing,
          )}
        >
          <Icon className="size-3.5" />
        </button>
      </Tooltip>
    </span>
  );
}

export { CopyText };
