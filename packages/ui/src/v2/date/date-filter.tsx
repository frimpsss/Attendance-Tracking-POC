import * as React from "react";
import * as PopoverPrimitive from "@radix-ui/react-popover";
import { endOfDay, format as formatDate } from "date-fns";
import { Calendar as CalendarIcon, ChevronDown } from "lucide-react";
import type { DateRange } from "react-day-picker";

import { cn } from "@attendance/utils";
import { Button } from "../button";
import { DATE_FORMAT } from "../shared/format";
import { floatingSurface } from "../shared/styles";
import { Calendar } from "./calendar";
import { rangeFor } from "./date-presets";

export type DatePreset =
  | "today"
  | "yesterday"
  | "this_week"
  | "last_week"
  | "this_month"
  | "last_month"
  | "this_year"
  | "last_year"
  | "all_time"
  | "custom";

export interface DateFilterValue {
  preset: DatePreset;
  from: Date;
  to: Date;
}

const presetLabels: Record<DatePreset, string> = {
  today: "Today",
  yesterday: "Yesterday",
  this_week: "This week",
  last_week: "Last week",
  this_month: "This month",
  last_month: "Last month",
  this_year: "This year",
  last_year: "Last year",
  all_time: "All time",
  custom: "Custom range",
};

export interface DateFilterProps {
  value?: DateFilterValue;
  defaultPreset?: Exclude<DatePreset, "custom">;
  presets?: DatePreset[];
  onChange?: (value: DateFilterValue) => void;
  align?: "start" | "end";
  className?: string;
}

const allPresets: DatePreset[] = [
  "today",
  "yesterday",
  "this_week",
  "last_week",
  "this_month",
  "last_month",
  "this_year",
  "last_year",
  "all_time",
  "custom",
];

function DateFilter({
  value,
  defaultPreset = "all_time",
  presets = allPresets,
  onChange,
  align = "end",
  className,
}: DateFilterProps) {
  const [internal, setInternal] = React.useState<DateFilterValue>(() => ({
    preset: defaultPreset,
    ...rangeFor(defaultPreset),
  }));
  const current = value ?? internal;
  const [open, setOpen] = React.useState(false);
  const [draft, setDraft] = React.useState<DateRange | undefined>({
    from: current.from,
    to: current.to,
  });
  const [draftPreset, setDraftPreset] = React.useState<DatePreset>(current.preset);
  const [month, setMonth] = React.useState<Date>(current.from);

  const reset = () => {
    setDraft({ from: current.from, to: current.to });
    setDraftPreset(current.preset);
    setMonth(current.preset === "all_time" ? current.to : current.from);
  };

  const commit = (next: DateFilterValue) => {
    setInternal(next);
    onChange?.(next);
    setOpen(false);
  };

  const pickPreset = (preset: DatePreset) => {
    if (preset === "custom") {
      setDraftPreset("custom");
      return;
    }
    const range = rangeFor(preset);
    setDraftPreset(preset);
    setDraft(range);
    setMonth(preset === "all_time" ? range.to : range.from);
  };

  const label =
    current.preset === "custom"
      ? `${formatDate(current.from, DATE_FORMAT)} – ${formatDate(current.to, DATE_FORMAT)}`
      : presetLabels[current.preset];

  const canApply = Boolean(draft?.from && draft?.to);

  return (
    <PopoverPrimitive.Root
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (next) reset();
      }}
    >
      <PopoverPrimitive.Trigger asChild>
        <Button
          variant="secondary"
          className={className}
          leadingIcon={<CalendarIcon />}
          trailingIcon={<ChevronDown className="text-v2-ink-tertiary" />}
        >
          {label}
        </Button>
      </PopoverPrimitive.Trigger>
      <PopoverPrimitive.Portal>
        <PopoverPrimitive.Content
          align={align}
          sideOffset={6}
          className={cn(floatingSurface, "flex flex-col")}
        >
          <div className="flex">
            <ul className="flex w-40 shrink-0 flex-col gap-0.5 border-r border-v2-line p-1.5">
              {presets.map((preset) => (
                <li key={preset}>
                  <button
                    type="button"
                    data-v2
                    onClick={() => pickPreset(preset)}
                    className={cn(
                      "flex h-9 w-full items-center rounded-v2-xs px-3 text-left text-v2-base transition-colors duration-v2-fast",
                      draftPreset === preset
                        ? "bg-v2-primary-soft font-semibold text-v2-primary"
                        : "bg-transparent text-v2-ink-secondary hover:bg-v2-surface-hover hover:text-v2-ink",
                    )}
                  >
                    {presetLabels[preset]}
                  </button>
                </li>
              ))}
            </ul>
            <Calendar
              mode="range"
              selected={draft}
              month={month}
              onMonthChange={setMonth}
              onSelect={(range, day) => {
                setDraftPreset("custom");
                setDraft(draft?.from && draft?.to ? { from: day, to: undefined } : range);
              }}
            />
          </div>
          <div className="flex items-center justify-between gap-3 border-t border-v2-line px-4 py-3">
            <span className="text-v2-sm tabular-nums text-v2-ink-secondary">
              {draft?.from
                ? `${formatDate(draft.from, DATE_FORMAT)}${draft.to ? ` – ${formatDate(draft.to, DATE_FORMAT)}` : " – …"}`
                : "Select a start date"}
            </span>
            <div className="flex gap-2">
              <Button size="sm" variant="ghost" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button
                size="sm"
                disabled={!canApply}
                onClick={() =>
                  draft?.from &&
                  draft.to &&
                  commit({
                    preset: draftPreset,
                    from: draft.from,
                    to: draftPreset === "custom" ? endOfDay(draft.to) : draft.to,
                  })
                }
              >
                Apply
              </Button>
            </div>
          </div>
        </PopoverPrimitive.Content>
      </PopoverPrimitive.Portal>
    </PopoverPrimitive.Root>
  );
}

export { DateFilter };
