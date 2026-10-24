import { cn } from "@attendance/utils";
import { focusRing } from "./shared/styles";

export interface ToggleChipsProps {
  options: { value: string; label: string; disabled?: boolean }[];
  value: string[];
  onChange: (value: string[]) => void;
  multiple?: boolean;
  size?: "sm" | "md";
  className?: string;
}

function ToggleChips({ options, value, onChange, multiple = true, size = "sm", className }: ToggleChipsProps) {
  const toggle = (option: string) => {
    if (!multiple) return onChange([option]);
    onChange(value.includes(option) ? value.filter((item) => item !== option) : [...value, option]);
  };

  return (
    <div role="group" className={cn("font-v2 flex flex-wrap items-center gap-1.5", className)}>
      {options.map((option) => {
        const active = value.includes(option.value);
        return (
          <button
            key={option.value}
            type="button"
            data-v2
            data-press
            aria-pressed={active}
            disabled={option.disabled}
            onClick={() => toggle(option.value)}
            className={cn(
              "rounded-v2-sm font-medium transition-colors duration-v2-fast disabled:opacity-v2-disabled",
              size === "sm" ? "h-v2-control-sm px-3.5 text-v2-ui" : "h-v2-control-md px-4 text-v2-base",
              active
                ? "bg-v2-primary-soft text-v2-primary hover:bg-v2-primary-soft-hover"
                : "bg-transparent text-v2-ink-tertiary hover:bg-v2-surface-hover hover:text-v2-ink",
              focusRing,
            )}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}

export { ToggleChips };
