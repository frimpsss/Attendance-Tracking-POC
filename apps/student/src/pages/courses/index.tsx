import * as React from "react";
import { useNavigate } from "react-router-dom";
import { BookOpen, CalendarClock, ChevronRight } from "lucide-react";
import {
  Button,
  EmptyState,
  SearchInput,
  Skeleton,
  Status,
} from "@attendance/ui";
import { useStudentCoursesList } from "./hooks/use-student-courses";

export default function StudentCoursesPage() {
  const navigate = useNavigate();
  const { items, threshold, loading, searchInput, setSearchInput } =
    useStudentCoursesList();

  return (
    <div className="flex flex-col gap-6 py-2">
      <div className="flex items-center justify-between gap-2">
        <div>
          <h1 className="text-v2-xl font-bold tracking-tight text-v2-ink">My Enrolled Courses</h1>
          <p className="mt-1 text-v2-sm text-v2-ink-secondary">
            View course attendance percentages, schedules, and session records.
          </p>
        </div>
        <Button
          variant="secondary"
          size="sm"
          leadingIcon={<CalendarClock />}
          onClick={() => navigate("/timetable")}
        >
          Timetable
        </Button>
      </div>

      <SearchInput
        value={searchInput}
        onValueChange={setSearchInput}
        placeholder="Search course code or title…"
      />

      {loading ? (
        <div className="flex flex-col gap-3">
          {Array.from({ length: 3 }).map((_, idx) => (
            <div key={idx} className="rounded-v2-lg bg-v2-surface p-5">
              <Skeleton className="h-24 w-full" />
            </div>
          ))}
        </div>
      ) : items.length === 0 ? (
        <EmptyState
          icon={<BookOpen />}
          title="No active course enrollments"
          description="Contact your department administrator if a course is missing."
        />
      ) : (
        <div className="flex flex-col gap-3">
          {items.map((c) => {
            const low = c.eligible_sessions > 0 && c.attendance_percentage < threshold;
            return (
              <button
                key={c.course_id}
                type="button"
                onClick={() => navigate(`/courses/${c.course_id}`)}
                className="flex w-full items-start justify-between gap-3 rounded-v2-lg bg-v2-surface p-5 text-left transition-colors hover:bg-v2-canvas/50"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-v2-mono text-v2-sm font-semibold text-v2-ink">
                      {c.course_code}
                    </span>
                    {low ? (
                      <Status value="absent" label={`Low (${c.attendance_percentage}%)`} size="sm" />
                    ) : (
                      <Status value="present" label={`${c.attendance_percentage}%`} size="sm" />
                    )}
                  </div>
                  <h2 className="mt-1 text-v2-base font-semibold text-v2-ink">
                    {c.course_title}
                  </h2>
                  <p className="mt-0.5 text-v2-xs text-v2-ink-secondary">
                    Lecturer(s):{" "}
                    {c.lecturer_names.length > 0 ? c.lecturer_names.join(", ") : "Unassigned"}
                  </p>
                  <p className="mt-1 text-v2-xs text-v2-ink-secondary">
                    {c.attended_count} attended of {c.eligible_sessions} finalized sessions (
                    {c.present_count} P, {c.late_count} L, {c.absent_count} A)
                  </p>
                </div>
                <ChevronRight className="mt-1 h-4 w-4 shrink-0 text-v2-ink-tertiary" />
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
