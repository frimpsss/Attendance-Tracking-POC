import * as React from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, FileEdit } from "lucide-react";
import {
  Badge,
  Button,
  Card,
  EmptyState,
  Skeleton,
  StatCards,
  Status,
} from "@attendance/ui";
import { formatDateTime, formatTimeSlot, getWeekdayName } from "@attendance/utils";
import { useStudentCourseDetail } from "./hooks/use-student-courses";

export default function StudentCourseDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { courseStat, timetables, entries, threshold, loading } =
    useStudentCourseDetail(id);

  if (loading && !courseStat) {
    return (
      <div className="flex flex-col gap-4 py-2">
        <Skeleton className="h-9 w-28" />
        <Skeleton className="h-32 w-full rounded-v2-lg" />
        <Skeleton className="h-24 w-full rounded-v2-lg" />
        <Skeleton className="h-64 w-full rounded-v2-lg" />
      </div>
    );
  }

  if (!courseStat) {
    return (
      <EmptyState
        title="Course enrollment not found"
        action={<Button onClick={() => navigate("/courses")}>Back to Courses</Button>}
      />
    );
  }

  const isLow =
    courseStat.eligible_sessions > 0 && courseStat.attendance_percentage < threshold;

  return (
    <div className="flex flex-col gap-6 py-2">
      <div>
        <Button
          variant="ghost"
          size="sm"
          leadingIcon={<ArrowLeft />}
          onClick={() => navigate("/courses")}
        >
          Courses
        </Button>
      </div>

      <div className="rounded-v2-lg bg-v2-surface p-5">
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <span className="font-v2-mono text-v2-sm font-semibold text-v2-ink">
              {courseStat.course_code}
            </span>
            {isLow ? (
              <Status value="absent" label={`Below ${threshold}%`} size="sm" />
            ) : (
              <Status value="present" label="Good Standing" size="sm" />
            )}
          </div>
          <h1 className="text-v2-xl font-bold tracking-tight text-v2-ink">
            {courseStat.course_title}
          </h1>
          <p className="text-v2-xs text-v2-ink-secondary">
            Lecturer(s):{" "}
            {courseStat.lecturer_names.length > 0
              ? courseStat.lecturer_names.join(", ")
              : "Unassigned"}
          </p>
          {timetables.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1.5 pt-1">
              {timetables.map((slot) => (
                <Badge key={slot.id} tone="neutral" size="sm">
                  {getWeekdayName(slot.weekday, true)}{" "}
                  {formatTimeSlot(slot.start_time, slot.end_time)} ({slot.venue})
                </Badge>
              ))}
            </div>
          )}
        </div>
      </div>

      <StatCards
        columns={2}
        items={[
          {
            label: "Course Attendance %",
            value: `${courseStat.attendance_percentage}%`,
            caption: `${courseStat.attended_count} / ${courseStat.eligible_sessions} eligible sessions`,
          },
          {
            label: "Status Breakdown",
            value: `${courseStat.present_count} P · ${courseStat.late_count} L · ${courseStat.absent_count} A`,
            caption: "Present / Late / Absent",
          },
        ]}
      />

      <Card variant="plain" title="Course Attendance Records">
        {entries.length === 0 ? (
          <EmptyState size="sm" title="No attendance entries recorded yet" />
        ) : (
          <div className="flex flex-col divide-y divide-v2-line rounded-v2-lg bg-v2-surface px-4">
            {entries.map((ent) => (
              <div
                key={ent.id}
                className="flex items-center justify-between gap-3 py-3.5"
              >
                <div className="min-w-0">
                  <p className="font-semibold text-v2-ink">{ent.session_title}</p>
                  <p className="mt-0.5 text-v2-xs text-v2-ink-secondary">
                    {formatDateTime(ent.session_scheduled_at)} · Source:{" "}
                    {ent.source.toUpperCase()}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <Status value={ent.status} size="sm" />
                  {ent.session_status === "closed" && ent.status !== "present" && (
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      aria-label="Request correction"
                      onClick={() => navigate(`/corrections/new?entryId=${ent.id}`)}
                    >
                      <FileEdit className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
