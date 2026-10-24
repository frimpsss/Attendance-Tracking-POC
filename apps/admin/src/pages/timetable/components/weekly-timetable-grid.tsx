import * as React from "react";
import { Clock, MapPin, Plus, User } from "lucide-react";
import { EmptyState, Skeleton } from "@attendance/ui";
import type { DetailedTimetableRow } from "@attendance/supabase";
import { cn, getWeekdayName } from "@attendance/utils";

const DISPLAY_DAYS = [1, 2, 3, 4, 5, 6] as const;
const START_HOUR = 7;
const END_HOUR = 19;
const HOUR_HEIGHT = 76;

function parseMinutes(hhmm: string): number {
  const [h = "0", m = "0"] = hhmm.split(":");
  return Number(h) * 60 + Number(m);
}

function formatHour(hour: number): string {
  return `${String(hour).padStart(2, "0")}:00`;
}

export function WeeklyTimetableGrid({
  items,
  loading,
  onSelectSlot,
  onCreateAt,
}: {
  items: DetailedTimetableRow[];
  loading: boolean;
  onSelectSlot?: (entry: DetailedTimetableRow) => void;
  onCreateAt?: (weekday: number, startTime: string) => void;
}) {
  const hours = React.useMemo(
    () => Array.from({ length: END_HOUR - START_HOUR }, (_, idx) => START_HOUR + idx),
    [],
  );

  const daysToRender = React.useMemo(() => {
    const hasSunday = items.some((i) => i.weekday === 0);
    return hasSunday ? ([0, ...DISPLAY_DAYS] as number[]) : ([...DISPLAY_DAYS] as number[]);
  }, [items]);

  if (loading) {
    return (
      <div className="flex flex-col gap-3">
        <div className="grid grid-cols-6 gap-3">
          {Array.from({ length: 6 }, (_, i) => (
            <Skeleton key={i} className="h-10" />
          ))}
        </div>
        <Skeleton className="h-[520px]" />
      </div>
    );
  }

  if (items.length === 0 && !onCreateAt) {
    return (
      <EmptyState
        size="sm"
        illustration="search"
        title="No scheduled classes"
        description="Scheduled course lecture slots will appear on the weekly timetable grid."
      />
    );
  }

  const totalHeight = hours.length * HOUR_HEIGHT;

  return (
    <div className="w-full overflow-x-auto">
      <div className="min-w-[880px]">
        <div
          className="grid border-b border-v2-line bg-v2-surface"
          style={{
            gridTemplateColumns: `72px repeat(${daysToRender.length}, minmax(0, 1fr))`,
          }}
        >
          <div className="flex h-12 items-center justify-center px-2 text-v2-xs font-medium text-v2-ink-tertiary">
            GMT
          </div>
          {daysToRender.map((day) => {
            const dayCount = items.filter((i) => i.weekday === day).length;
            return (
              <div
                key={day}
                className="flex h-12 items-center justify-between border-l border-v2-line px-3.5"
              >
                <span className="text-v2-sm font-semibold text-v2-ink">
                  {getWeekdayName(day)}
                </span>
                {dayCount > 0 && (
                  <span className="rounded-v2-xs bg-v2-primary-soft px-2 py-0.5 text-v2-2xs font-semibold text-v2-primary">
                    {dayCount} {dayCount === 1 ? "slot" : "slots"}
                  </span>
                )}
              </div>
            );
          })}
        </div>

        <div
          className="relative grid bg-v2-canvas"
          style={{
            gridTemplateColumns: `72px repeat(${daysToRender.length}, minmax(0, 1fr))`,
            height: totalHeight,
          }}
        >
          <div className="relative select-none bg-v2-surface/50">
            {hours.map((hour, idx) => (
              <div
                key={hour}
                style={{ top: idx * HOUR_HEIGHT, height: HOUR_HEIGHT }}
                className="absolute inset-x-0 border-b border-v2-line px-2 pt-1.5 text-right font-v2-mono text-v2-xs text-v2-ink-tertiary"
              >
                {formatHour(hour)}
              </div>
            ))}
          </div>

          {daysToRender.map((day) => {
            const daySlots = items.filter((entry) => entry.weekday === day);

            return (
              <div key={day} className="relative border-l border-v2-line">
                {hours.map((hour, idx) => (
                  <div
                    key={hour}
                    style={{ top: idx * HOUR_HEIGHT, height: HOUR_HEIGHT }}
                    onClick={
                      onCreateAt ? () => onCreateAt(day, formatHour(hour)) : undefined
                    }
                    className={cn(
                      "group/cell absolute inset-x-0 border-b border-v2-line transition-colors duration-v2-fast",
                      onCreateAt && "cursor-pointer hover:bg-v2-surface-hover/70",
                    )}
                  >
                    {onCreateAt && (
                      <span className="pointer-events-none flex h-full items-center justify-center text-v2-xs font-medium text-v2-ink-tertiary opacity-0 transition-opacity duration-v2-fast group-hover/cell:opacity-100">
                        <Plus className="mr-1 size-3.5" /> Add {formatHour(hour)}
                      </span>
                    )}
                  </div>
                ))}

                {daySlots.map((slot) => {
                  const startMins = parseMinutes(slot.start_time);
                  const endMins = parseMinutes(slot.end_time);
                  const clampedStart = Math.max(START_HOUR * 60, startMins);
                  const clampedEnd = Math.min(
                    END_HOUR * 60,
                    Math.max(clampedStart + 45, endMins),
                  );
                  const top = ((clampedStart - START_HOUR * 60) / 60) * HOUR_HEIGHT;
                  const height = Math.max(
                    64,
                    ((clampedEnd - clampedStart) / 60) * HOUR_HEIGHT - 4,
                  );

                  return (
                    <button
                      key={slot.id}
                      type="button"
                      data-v2
                      data-press="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectSlot?.(slot);
                      }}
                      style={{ top: top + 2, height }}
                      className={cn(
                        "absolute inset-x-1.5 z-10 flex flex-col justify-between overflow-hidden rounded-v2-sm bg-v2-primary-soft p-2.5 text-left transition-colors duration-v2-fast",
                        onSelectSlot
                          ? "cursor-pointer hover:bg-v2-primary-soft-hover"
                          : "cursor-default",
                      )}
                    >
                      <div className="min-w-0">
                        <div className="flex items-center justify-between gap-1.5">
                          <span className="rounded-v2-xs bg-v2-primary px-1.5 py-0.5 font-v2-mono text-v2-2xs font-bold text-v2-on-primary">
                            {slot.course_code}
                          </span>
                          <span className="inline-flex items-center gap-1 font-v2-mono text-v2-2xs font-semibold text-v2-primary">
                            <Clock className="size-3" />
                            {slot.start_time.slice(0, 5)}–{slot.end_time.slice(0, 5)}
                          </span>
                        </div>
                        <p className="mt-1.5 line-clamp-2 text-v2-xs font-semibold leading-snug text-v2-ink">
                          {slot.course_title}
                        </p>
                      </div>

                      <div className="mt-1 flex flex-col gap-0.5 text-v2-2xs text-v2-ink-secondary">
                        <span className="inline-flex items-center gap-1 truncate font-medium">
                          <MapPin className="size-3 shrink-0 text-v2-primary" />
                          <span className="truncate">{slot.venue}</span>
                        </span>
                        {slot.lecturer_names.length > 0 && (
                          <span className="inline-flex items-center gap-1 truncate">
                            <User className="size-3 shrink-0 text-v2-ink-tertiary" />
                            <span className="truncate">{slot.lecturer_names.join(", ")}</span>
                          </span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
