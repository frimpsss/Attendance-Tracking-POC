import * as React from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Plus } from "lucide-react";
import {
  Badge,
  Button,
  EmptyState,
  ExportButton,
  SearchInput,
  Skeleton,
  StatCards,
  Status,
  Tabs,
  toast,
  type ExportFormat,
} from "@attendance/ui";
import {
  exportToCsv,
  exportToPdf,
  formatDateTime,
  formatTimeSlot,
  getWeekdayName,
} from "@attendance/utils";
import { useLecturerCourseDetail } from "./hooks/use-lecturer-courses";

export default function LecturerCourseDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [tab, setTab] = React.useState("roster");

  const {
    course,
    timetables,
    sessions,
    roster,
    totalRoster,
    threshold,
    loading,
    searchInput,
    setSearchInput,
  } = useLecturerCourseDetail(id);

  if (loading && !course) {
    return (
      <div className="flex flex-col gap-4 py-2">
        <Skeleton className="h-9 w-28" />
        <Skeleton className="h-32 w-full rounded-v2-lg" />
        <Skeleton className="h-24 w-full rounded-v2-lg" />
        <Skeleton className="h-64 w-full rounded-v2-lg" />
      </div>
    );
  }

  if (!course) {
    return (
      <EmptyState
        title="Course not found"
        action={<Button onClick={() => navigate("/courses")}>Back to Courses</Button>}
      />
    );
  }

  const handleExport = (format: ExportFormat) => {
    if (format === "pdf") {
      exportToPdf({
        title: `${course.code} — ${course.title}`,
        subtitle: `${course.department_name} · ${totalRoster} Enrolled Students`,
        headers: ["Student ID", "Full Name", "Attended / Eligible", "Rate"],
        rows: roster.map((r) => [
          r.student_number,
          r.student_name,
          `${r.attended_count} / ${r.eligible_sessions}`,
          `${r.attendance_percentage}%`,
        ]),
      });
      return;
    }

    exportToCsv(
      `${course.code}-roster-attendance.csv`,
      roster.map((r) => ({
        student_number: r.student_number,
        student_name: r.student_name,
        email: r.student_email,
        eligible_sessions: r.eligible_sessions,
        present: r.present_count,
        late: r.late_count,
        absent: r.absent_count,
        attendance_percentage: `${r.attendance_percentage}%`,
      })),
    );
    toast.success("Course attendance CSV downloaded");
  };

  return (
    <div className="flex flex-col gap-6 py-2">
      <div className="flex items-center justify-between gap-2">
        <Button
          variant="ghost"
          size="sm"
          leadingIcon={<ArrowLeft />}
          onClick={() => navigate("/courses")}
        >
          Courses
        </Button>
        <div className="flex items-center gap-2">
          <ExportButton
            formats={["csv", "pdf"]}
            onExport={handleExport}
            label="Export"
          />
          <Button
            size="sm"
            leadingIcon={<Plus />}
            onClick={() => navigate(`/sessions/new?courseId=${course.id}`)}
          >
            Start Session
          </Button>
        </div>
      </div>

      <div className="rounded-v2-lg bg-v2-surface p-5">
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <span className="font-v2-mono text-v2-sm font-semibold text-v2-ink">
              {course.code}
            </span>
            <Status value={course.is_active ? "active" : "archived"} size="sm" />
          </div>
          <h1 className="text-v2-xl font-bold tracking-tight text-v2-ink">{course.title}</h1>
          <p className="text-v2-xs text-v2-ink-secondary">
            {course.department_name} · {course.academic_period_name}
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
            label: "Enrolled Roster",
            value: String(totalRoster),
            caption: "Active students",
          },
          {
            label: "Finalized Sessions",
            value: String(course.closed_session_count),
            caption: `${course.open_session_count} open`,
          },
        ]}
      />

      <Tabs
        value={tab}
        onValueChange={setTab}
        items={[
          {
            value: "roster",
            label: `Student Roster (${totalRoster})`,
            content: (
              <div className="mt-4 flex flex-col gap-4">
                <SearchInput
                  value={searchInput}
                  onValueChange={setSearchInput}
                  placeholder="Search student ID or name…"
                />
                {roster.length === 0 ? (
                  <EmptyState size="sm" title="No matching students" />
                ) : (
                  <div className="flex flex-col divide-y divide-v2-line rounded-v2-lg bg-v2-surface px-4">
                    {roster.map((st) => {
                      const low =
                        st.eligible_sessions > 0 && st.attendance_percentage < threshold;
                      return (
                        <div
                          key={st.student_id}
                          className="flex items-center justify-between gap-3 py-3.5"
                        >
                          <div className="min-w-0">
                            <p className="font-semibold text-v2-ink">{st.student_name}</p>
                            <p className="mt-0.5 text-v2-xs text-v2-ink-secondary">
                              {st.student_number} · {st.attended_count}/{st.eligible_sessions}{" "}
                              attended ({st.present_count} P, {st.late_count} L, {st.absent_count} A)
                            </p>
                          </div>
                          <div className="flex shrink-0 flex-col items-end gap-1">
                            <span className="text-v2-sm font-semibold text-v2-ink">
                              {st.attendance_percentage}%
                            </span>
                            {low && <Status value="absent" label="Low" size="sm" />}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            ),
          },
          {
            value: "sessions",
            label: `Sessions (${sessions.length})`,
            content: (
              <div className="mt-4 flex flex-col gap-3">
                {sessions.length === 0 ? (
                  <EmptyState size="sm" title="No sessions recorded yet" />
                ) : (
                  sessions.map((s) => (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => navigate(`/sessions/${s.id}`)}
                      className="flex items-center justify-between gap-3 rounded-v2-lg bg-v2-surface p-4 text-left transition-colors hover:bg-v2-canvas/50"
                    >
                      <div>
                        <p className="font-semibold text-v2-ink">{s.title}</p>
                        <p className="mt-0.5 text-v2-xs text-v2-ink-secondary">
                          {formatDateTime(s.scheduled_at)} · {s.present_count} P / {s.late_count} L /{" "}
                          {s.absent_count} A
                        </p>
                      </div>
                      <Status value={s.status} size="sm" />
                    </button>
                  ))
                )}
              </div>
            ),
          },
        ]}
      />
    </div>
  );
}
