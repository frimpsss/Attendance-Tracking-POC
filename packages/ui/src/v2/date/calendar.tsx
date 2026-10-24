import * as React from "react";
import { DayPicker } from "react-day-picker";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { cn } from "@attendance/utils";
import { MonthYearPanel } from "./month-year-panel";

export type CalendarProps = React.ComponentProps<typeof DayPicker>;

const navButton =
  "flex size-8 items-center justify-center rounded-v2-sm bg-transparent text-v2-ink-secondary transition-colors duration-v2-fast hover:bg-v2-surface-hover hover:text-v2-ink disabled:opacity-v2-disabled";

const initialMonth = (props: CalendarProps) => {
  const selected = (props as { selected?: unknown }).selected;
  const first =
    selected instanceof Date
      ? selected
      : Array.isArray(selected)
        ? selected[0]
        : (selected as { from?: Date } | undefined)?.from;
  return props.month ?? props.defaultMonth ?? first ?? new Date();
};

function Calendar({ className, classNames, showOutsideDays = true, ...props }: CalendarProps) {
  const [internalMonth, setInternalMonth] = React.useState<Date>(() => initialMonth(props));
  const [picking, setPicking] = React.useState(false);
  const month = props.month ?? internalMonth;

  const changeMonth = (next: Date) => {
    setInternalMonth(next);
    props.onMonthChange?.(next);
  };

  if (picking) {
    return (
      <div data-v2 className={cn("font-v2 p-3", className)}>
        <MonthYearPanel
          month={month}
          onPick={(next) => {
            changeMonth(next);
            setPicking(false);
          }}
        />
      </div>
    );
  }

  return (
    <div data-v2 className={cn("font-v2 p-3", className)}>
      <DayPicker
        showOutsideDays={showOutsideDays}
        classNames={{
          months: "relative flex flex-col gap-6 sm:flex-row",
          month: "flex flex-col gap-3",
          month_caption: "flex h-8 items-center px-1",
          caption_label: "text-v2-base font-semibold text-v2-ink",
          nav: "absolute right-0 top-0 z-10 flex items-center gap-1",
          month_grid: "border-collapse",
          weekdays: "flex",
          weekday:
            "flex size-9 items-center justify-center text-v2-xs font-medium text-v2-ink-tertiary",
          week: "mt-0.5 flex",
          day: "relative size-9 p-0 text-center",
          outside: "text-v2-ink-disabled",
          disabled: "pointer-events-none opacity-40",
          range_start: "rounded-l-v2-sm bg-v2-primary-soft",
          range_end: "rounded-r-v2-sm bg-v2-primary-soft",
          range_middle: "bg-v2-primary-soft",
          hidden: "invisible",
          ...classNames,
        }}
        components={{
          CaptionLabel: ({ children, className: captionClassName, ...labelProps }) => (
            <button
              {...(labelProps as React.ButtonHTMLAttributes<HTMLButtonElement>)}
              type="button"
              data-press
              onClick={() => setPicking(true)}
              className={cn(
                captionClassName,
                "rounded-v2-sm px-1 transition-colors duration-v2-fast hover:bg-v2-surface-hover",
              )}
            >
              {children}
            </button>
          ),
          PreviousMonthButton: (buttonProps) => (
            <button {...buttonProps} data-press className={navButton}>
              <ChevronLeft className="size-4" />
            </button>
          ),
          NextMonthButton: (buttonProps) => (
            <button {...buttonProps} data-press className={navButton}>
              <ChevronRight className="size-4" />
            </button>
          ),
          DayButton: ({ day, modifiers, className: dayClassName, ...buttonProps }) => (
            <button
              {...buttonProps}
              data-press
              data-day={day.isoDate}
              data-selected={modifiers.selected || undefined}
              className={cn(
                "size-9 rounded-v2-sm text-v2-ui tabular-nums transition-colors duration-v2-fast",
                modifiers.range_middle
                  ? "bg-transparent text-v2-ink hover:bg-v2-primary-soft-hover"
                  : modifiers.selected
                    ? "bg-v2-primary font-semibold text-v2-on-primary hover:bg-v2-primary-hover"
                    : cn(
                        "bg-transparent hover:bg-v2-surface-hover",
                        modifiers.today && "font-semibold text-v2-primary",
                      ),
                dayClassName,
              )}
            />
          ),
        }}
        {...props}
        month={month}
        onMonthChange={changeMonth}
      />
    </div>
  );
}

export { Calendar };
