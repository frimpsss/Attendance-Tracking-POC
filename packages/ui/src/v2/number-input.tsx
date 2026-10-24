import * as React from "react";
import { Minus, Plus } from "lucide-react";

import { cn } from "@attendance/utils";
import { Field, type FieldControlProps } from "./shared/field";
import { fieldShell, focusRing, inlineShell } from "./shared/styles";

export interface NumberInputProps extends FieldControlProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  size?: "sm" | "md";
  variant?: "filled" | "inline";
  disabled?: boolean;
  id?: string;
  "aria-label"?: string;
  className?: string;
}

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

function useHoldRepeat(action: () => void) {
  const timers = React.useRef<{ delay?: number; repeat?: number }>({});
  const latest = React.useRef(action);
  latest.current = action;

  const stop = React.useCallback(() => {
    window.clearTimeout(timers.current.delay);
    window.clearInterval(timers.current.repeat);
  }, []);

  const start = React.useCallback(() => {
    stop();
    latest.current();
    timers.current.delay = window.setTimeout(() => {
      timers.current.repeat = window.setInterval(() => latest.current(), 70);
    }, 380);
  }, [stop]);

  React.useEffect(() => stop, [stop]);
  return { start, stop };
}

function NumberInput({
  value,
  onChange,
  min = 0,
  max = Number.MAX_SAFE_INTEGER,
  step = 1,
  size = "md",
  variant = "filled",
  disabled,
  id,
  label,
  hint,
  error,
  optional,
  containerClassName,
  className,
  ...props
}: NumberInputProps) {
  const generatedId = React.useId();
  const inputId = id ?? generatedId;
  const [draft, setDraft] = React.useState(String(value));
  const valueRef = React.useRef(value);
  valueRef.current = value;

  React.useEffect(() => setDraft(String(value)), [value]);

  const nudge = (direction: 1 | -1, multiplier = 1) => {
    const next = clamp(Number((valueRef.current + direction * step * multiplier).toFixed(6)), min, max);
    valueRef.current = next;
    onChange(next);
  };

  const decrement = useHoldRepeat(() => nudge(-1));
  const increment = useHoldRepeat(() => nudge(1));

  const commit = () => {
    const parsed = Number(draft);
    if (draft.trim() === "" || Number.isNaN(parsed)) return setDraft(String(value));
    const next = clamp(parsed, min, max);
    onChange(next);
    setDraft(String(next));
  };

  const inline = variant === "inline";
  const buttonClass = cn(
    "flex shrink-0 items-center justify-center rounded-v2-xs bg-transparent text-v2-ink-secondary transition-colors duration-v2-fast hover:bg-v2-canvas hover:text-v2-primary disabled:pointer-events-none disabled:opacity-v2-disabled [&_svg]:size-4",
    inline ? "size-7 hover:bg-v2-field" : size === "sm" ? "size-7" : "size-8",
    focusRing,
  );

  return (
    <Field id={inputId} label={label} hint={hint} error={error} optional={optional} className={containerClassName}>
      <div
        className={cn(
          inline ? cn(inlineShell, "h-v2-control-sm gap-0.5 px-1") : cn(fieldShell, "gap-1 px-1.5", size === "sm" ? "h-v2-control-sm" : "h-v2-control-md"),
          "w-auto",
          className,
        )}
      >
        <button
          type="button"
          data-v2
          data-press="sm"
          tabIndex={-1}
          aria-label="Decrease"
          disabled={disabled || value <= min}
          onPointerDown={(event) => {
            event.preventDefault();
            decrement.start();
          }}
          onPointerUp={decrement.stop}
          onPointerLeave={decrement.stop}
          className={buttonClass}
        >
          <Minus />
        </button>
        <input
          id={inputId}
          type="text"
          inputMode="decimal"
          role="spinbutton"
          aria-valuemin={min}
          aria-valuemax={max === Number.MAX_SAFE_INTEGER ? undefined : max}
          aria-valuenow={value}
          aria-invalid={error ? true : undefined}
          aria-label={props["aria-label"]}
          disabled={disabled}
          value={draft}
          onChange={(event) => setDraft(event.target.value.replace(/[^\d.-]/g, ""))}
          onFocus={(event) => event.target.select()}
          onBlur={commit}
          onKeyDown={(event) => {
            if (event.key === "ArrowUp" || event.key === "ArrowDown") {
              event.preventDefault();
              nudge(event.key === "ArrowUp" ? 1 : -1, event.shiftKey ? 10 : 1);
            } else if (event.key === "Enter") {
              commit();
            } else if (event.key === "Escape") {
              setDraft(String(value));
            }
          }}
          className="h-full w-12 min-w-0 flex-1 bg-transparent text-center font-semibold tabular-nums outline-none"
        />
        <button
          type="button"
          data-v2
          data-press="sm"
          tabIndex={-1}
          aria-label="Increase"
          disabled={disabled || value >= max}
          onPointerDown={(event) => {
            event.preventDefault();
            increment.start();
          }}
          onPointerUp={increment.stop}
          onPointerLeave={increment.stop}
          className={buttonClass}
        >
          <Plus />
        </button>
      </div>
    </Field>
  );
}

export { NumberInput };
