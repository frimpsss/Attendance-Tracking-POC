import * as React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { cn } from "@attendance/utils";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const YEARS_PER_PAGE = 12;

const navButton =
  "flex size-8 items-center justify-center rounded-v2-sm bg-transparent text-v2-ink-secondary transition-colors duration-v2-fast hover:bg-v2-surface-hover hover:text-v2-ink";

const cell = (active: boolean) =>
  cn(
    "h-10 rounded-v2-sm text-v2-ui tabular-nums transition-colors duration-v2-fast",
    active
      ? "bg-v2-primary font-semibold text-v2-on-primary hover:bg-v2-primary-hover"
      : "bg-transparent text-v2-ink hover:bg-v2-surface-hover",
  );

export interface MonthYearPanelProps {
  month: Date;
  onPick: (month: Date) => void;
}

function MonthYearPanel({ month, onPick }: MonthYearPanelProps) {
  const [mode, setMode] = React.useState<"months" | "years">("months");
  const [year, setYear] = React.useState(month.getFullYear());
  const pageStart = year - (year % YEARS_PER_PAGE);
  const today = new Date();

  const step = (direction: 1 | -1) =>
    setYear((current) => current + direction * (mode === "months" ? 1 : YEARS_PER_PAGE));

  return (
    <div className="flex w-[252px] flex-col gap-3">
      <div className="flex h-8 items-center justify-between px-1">
        <button
          type="button"
          data-press
          onClick={() => setMode(mode === "months" ? "years" : "months")}
          className="rounded-v2-sm px-1 text-v2-base font-semibold text-v2-ink hover:bg-v2-surface-hover"
        >
          {mode === "months" ? year : `${pageStart} – ${pageStart + YEARS_PER_PAGE - 1}`}
        </button>
        <div className="flex items-center gap-1">
          <button
            type="button"
            data-press
            aria-label="Previous"
            className={navButton}
            onClick={() => step(-1)}
          >
            <ChevronLeft className="size-4" />
          </button>
          <button
            type="button"
            data-press
            aria-label="Next"
            className={navButton}
            onClick={() => step(1)}
          >
            <ChevronRight className="size-4" />
          </button>
        </div>
      </div>
      <div className="grid grid-cols-3 gap-1.5">
        {mode === "months"
          ? MONTHS.map((label, index) => {
              const active = year === month.getFullYear() && index === month.getMonth();
              const current = year === today.getFullYear() && index === today.getMonth();
              return (
                <button
                  key={label}
                  type="button"
                  data-press
                  className={cn(cell(active), current && !active && "text-v2-primary")}
                  onClick={() => onPick(new Date(year, index, 1))}
                >
                  {label}
                </button>
              );
            })
          : Array.from({ length: YEARS_PER_PAGE }, (_, index) => pageStart + index).map(
              (value) => (
                <button
                  key={value}
                  type="button"
                  data-press
                  className={cell(value === year)}
                  onClick={() => {
                    setYear(value);
                    setMode("months");
                  }}
                >
                  {value}
                </button>
              ),
            )}
      </div>
    </div>
  );
}

export { MonthYearPanel };
