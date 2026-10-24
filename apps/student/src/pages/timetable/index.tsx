import * as React from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, CalendarClock, Clock, MapPin } from "lucide-react";
import { Button, EmptyState, Skeleton } from "@attendance/ui";
import { cn, formatTimeSlot, getWeekdayName } from "@attendance/utils";
import { useStudentTimetable } from "./hooks/use-student-timetable";

const DAYS = [1, 2, 3, 4, 5] as const;

export default function StudentTimetablePage() {
  const navigate = useNavigate();
  const { items, loading } = useStudentTimetable();
  const [selectedDay, setSelectedDay] = React.useState<number>(() => {
    const today = new Date().getDay();
    return today >= 1 && today <= 5 ? today : 1;
  });

  const daySlots = React.useMemo(
    () =>
      items
        .filter((s) => s.weekday === selectedDay)
        .sort((a, b) => a.start_time.localeCompare(b.start_time)),
    [items, selectedDay],
  );

  return (
    <div className="flex flex-col gap-5 py-2">
      <div className="flex items-center justify-between gap-2">
        <Button
          variant="ghost"
          size="sm"
          leadingIcon={<ArrowLeft />}
          onClick={() => navigate("/courses")}
        >
          Courses
        </Button>
      </div>

      <div>
        <h1 className="text-v2-lg font-semibold text-v2-ink">Weekly Class Timetable</h1>
        <p className="text-v2-xs text-v2-ink-secondary">
          Scheduled lecture times and venues for your enrolled courses.
        </p>
      </div>

      <div className="grid grid-cols-5 gap-1.5 rounded-v2-sm bg-v2-surface p-1">
        {DAYS.map((day) => {
          const count = items.filter((i) => i.weekday === day).length;
          const active = selectedDay === day;
          return (
            <button
              key={day}
              type="button"
              data-v2
              data-press
              onClick={() => setSelectedDay(day)}
              className={cn(
                "flex flex-col items-center justify-center rounded-v2-xs py-2 text-center transition-colors duration-v2-fast",
                active
                  ? "bg-v2-primary font-semibold text-v2-on-primary"
                  : "bg-transparent text-v2-ink-secondary hover:bg-v2-surface-hover",
              )}
            >
              <span className="text-v2-xs">{getWeekdayName(day, true)}</span>
              <span
                className={cn(
                  "mt-0.5 text-v2-2xs",
                  active ? "text-v2-on-primary/90" : "text-v2-ink-tertiary",
                )}
              >
                {count} {count === 1 ? "class" : "classes"}
              </span>
            </button>
          );
        })}
      </div>

      {loading ? (
        <div className="flex flex-col gap-3">
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
        </div>
      ) : daySlots.length === 0 ? (
        <EmptyState
          icon={<CalendarClock />}
          title={`No classes on ${getWeekdayName(selectedDay)}`}
          description="Select another day above to view your scheduled lectures."
        />
      ) : (
        <div className="flex flex-col gap-3">
          {daySlots.map((slot) => (
            <div
              key={slot.id}
              className="flex flex-col gap-2 rounded-v2-md bg-v2-surface p-4"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="rounded-v2-xs bg-v2-primary px-2 py-0.5 font-v2-mono text-v2-xs font-bold text-v2-on-primary">
                  {slot.course_code}
                </span>
                <span className="inline-flex items-center gap-1 font-v2-mono text-v2-xs font-semibold text-v2-primary">
                  <Clock className="size-3.5" />
                  {formatTimeSlot(slot.start_time, slot.end_time)}
                </span>
              </div>
              <p className="text-v2-base font-semibold text-v2-ink">{slot.course_title}</p>
              <div className="flex flex-wrap items-center justify-between gap-2 text-v2-xs text-v2-ink-secondary">
                <span className="inline-flex items-center gap-1">
                  <MapPin className="size-3.5 text-v2-primary" />
                  {slot.venue}
                </span>
                <span>{slot.lecturer_names.join(", ") || "Lecturer"}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
