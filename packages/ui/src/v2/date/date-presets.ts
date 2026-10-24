import {
  endOfMonth,
  endOfToday,
  endOfYear,
  endOfYesterday,
  startOfMonth,
  startOfToday,
  startOfWeek,
  startOfYear,
  startOfYesterday,
  subMonths,
  subWeeks,
  subYears,
  endOfWeek,
  endOfDay,
} from "date-fns";

import type { DatePreset } from "./date-filter";

export const rangeFor = (
  preset: Exclude<DatePreset, "custom">,
): { from: Date; to: Date } => {
  const now = new Date();
  switch (preset) {
    case "today":
      return { from: startOfToday(), to: endOfToday() };
    case "yesterday":
      return { from: startOfYesterday(), to: endOfYesterday() };
    case "this_week":
      return { from: startOfWeek(now), to: endOfToday() };
    case "last_week":
      return { from: startOfWeek(subWeeks(now, 1)), to: endOfWeek(subWeeks(now, 1)) };
    case "this_month":
      return { from: startOfMonth(now), to: endOfMonth(now) };
    case "last_month":
      return { from: startOfMonth(subMonths(now, 1)), to: endOfMonth(subMonths(now, 1)) };
    case "this_year":
      return { from: startOfYear(now), to: endOfYear(now) };
    case "last_year":
      return { from: startOfYear(subYears(now, 1)), to: endOfYear(subYears(now, 1)) };
    case "all_time":
      return { from: new Date(2000, 0, 1), to: endOfDay(now) };
  }
};
