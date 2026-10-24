import * as React from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowRight,
  CalendarClock,
  QrCode,
  Radio,
} from "lucide-react";
import {
  Alert,
  BreakdownBars,
  Button,
  Card,
  EmptyState,
  Skeleton,
  StatCards,
  Status,
} from "@attendance/ui";
import { formatDateTime, formatTimeSlot, getWeekdayName } from "@attendance/utils";
import { useStudentHome } from "./hooks/use-student-home";

export default function StudentHomePage() {
  const navigate = useNavigate();
  const {
    student,
    courseStats,
    openSessions,
    todayTimetables,
    recentEntries,
    threshold,
    loading,
  } = useStudentHome();

  const overallPct = student?.attendance_percentage ?? 100;
  const isOverallLow =
    Boolean(student && student.eligible_sessions > 0 && overallPct < threshold);
  const lowCourses = courseStats.filter(
    (c) => c.eligible_sessions > 0 && c.attendance_percentage < threshold,
  );

  return (
    <div className="flex flex-col gap-6 py-2">
      <div className="flex flex-col gap-4 rounded-v2-lg bg-v2-surface p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-v2-xs font-semibold uppercase tracking-wider text-v2-ink-tertiary">
              Classroom Check-In
            </p>
            <h2 className="mt-1 text-v2-xl font-bold tracking-tight text-v2-ink">
              In class right now?
            </h2>
            <p className="mt-1 text-v2-sm text-v2-ink-secondary">
              Scan the classroom QR code or enter your lecturer's 6-character session code.
            </p>
          </div>
        </div>
        <Button
          size="lg"
          fullWidth
          leadingIcon={<QrCode />}
          onClick={() => navigate("/check-in")}
        >
          Check In Now
        </Button>
      </div>

      {(isOverallLow || lowCourses.length > 0) && (
        <Alert
          tone="danger"
          title={`Low Attendance Warning (< ${threshold}%)`}
          action={
            <Button variant="secondary" size="sm" onClick={() => navigate("/history")}>
              View History
            </Button>
          }
        >
          Your attendance is below the {threshold}% institutional minimum in{" "}
          {lowCourses.length > 0
            ? lowCourses.map((c) => `${c.course_code} (${c.attendance_percentage}%)`).join(", ")
            : `overall sessions (${overallPct}%)`}
          .
        </Alert>
      )}

      {openSessions.length > 0 && (
        <div className="flex flex-col gap-3">
          {openSessions.map((sess) => (
            <button
              key={sess.id}
              type="button"
              onClick={() => navigate("/check-in")}
              className="flex w-full items-center justify-between gap-3 rounded-v2-lg bg-v2-primary-soft p-4 text-left transition-colors"
            >
              <div className="flex items-center gap-3.5">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-v2-md bg-white text-v2-primary">
                  <Radio className="h-5 w-5 animate-pulse" />
                </div>
                <div>
                  <span className="text-v2-2xs font-bold uppercase tracking-wider text-v2-primary">
                    Open Check-In Window
                  </span>
                  <p className="text-v2-base font-semibold text-v2-ink">
                    {sess.course_code} — {sess.title}
                  </p>
                  <p className="text-v2-xs text-v2-ink-secondary">
                    Tap to scan QR or enter 6-character code
                  </p>
                </div>
              </div>
              <QrCode className="h-5 w-5 shrink-0 text-v2-primary" />
            </button>
          ))}
        </div>
      )}

      {loading ? (
        <div className="grid grid-cols-2 gap-4">
          <Skeleton className="h-24 rounded-v2-lg" />
          <Skeleton className="h-24 rounded-v2-lg" />
        </div>
      ) : (
        <StatCards
          columns={2}
          items={[
            {
              label: "Overall Attendance",
              value: `${overallPct}%`,
              caption: `${student?.attended_count ?? 0}/${student?.eligible_sessions ?? 0} finalized sessions`,
            },
            {
              label: "Enrolled Courses",
              value: String(courseStats.length),
              caption: `Level ${student?.academic_level ?? "300"}`,
            },
          ]}
        />
      )}

      <Card
        variant="plain"
        title="Course Attendance Breakdown"
        actions={
          <Button variant="ghost" size="sm" onClick={() => navigate("/courses")}>
            All Courses
          </Button>
        }
      >
        {loading ? (
          <div className="rounded-v2-lg bg-v2-surface p-4">
            <Skeleton className="h-32 w-full" />
          </div>
        ) : courseStats.length === 0 ? (
          <EmptyState size="sm" title="No active course enrollments" />
        ) : (
          <div className="rounded-v2-lg bg-v2-surface p-5">
            <BreakdownBars
              max={100}
              items={courseStats.map((c) => {
                const low = c.eligible_sessions > 0 && c.attendance_percentage < threshold;
                return {
                  label: `${c.course_code} — ${c.course_title}`,
                  value: c.attendance_percentage,
                  displayValue: `${c.attendance_percentage}%`,
                  meta: `${c.attended_count}/${c.eligible_sessions} sessions`,
                  tone: low ? "danger" : "accent",
                };
              })}
            />
          </div>
        )}
      </Card>

      <Card
        variant="plain"
        title={`Today's Timetable (${getWeekdayName(new Date().getDay())})`}
        actions={
          <Button variant="ghost" size="sm" onClick={() => navigate("/timetable")}>
            Full Week
          </Button>
        }
      >
        {loading ? (
          <div className="rounded-v2-lg bg-v2-surface p-4">
            <Skeleton className="h-20 w-full" />
          </div>
        ) : todayTimetables.length === 0 ? (
          <EmptyState
            size="sm"
            icon={<CalendarClock />}
            title="No scheduled classes today"
          />
        ) : (
          <div className="flex flex-col divide-y divide-v2-line rounded-v2-lg bg-v2-surface px-4">
            {todayTimetables.map((slot) => (
              <div
                key={slot.id}
                className="flex items-center justify-between gap-3 py-3.5"
              >
                <div>
                  <p className="font-semibold text-v2-ink">
                    {slot.course_code} — {slot.course_title}
                  </p>
                  <p className="mt-0.5 text-v2-xs text-v2-ink-secondary">
                    {formatTimeSlot(slot.start_time, slot.end_time)} · {slot.venue}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      <Card
        variant="plain"
        title="Recent Check-Ins & Finalized Records"
        actions={
          <Button
            variant="ghost"
            size="sm"
            trailingIcon={<ArrowRight />}
            onClick={() => navigate("/history")}
          >
            Full History
          </Button>
        }
      >
        {loading ? (
          <div className="rounded-v2-lg bg-v2-surface p-4">
            <Skeleton className="h-28 w-full" />
          </div>
        ) : recentEntries.length === 0 ? (
          <EmptyState size="sm" title="No attendance entries yet" />
        ) : (
          <div className="flex flex-col divide-y divide-v2-line rounded-v2-lg bg-v2-surface px-4">
            {recentEntries.map((ent) => (
              <div
                key={ent.id}
                className="flex items-center justify-between gap-3 py-3.5"
              >
                <div>
                  <p className="font-semibold text-v2-ink">
                    {ent.course_code} — {ent.session_title}
                  </p>
                  <p className="mt-0.5 text-v2-xs text-v2-ink-secondary">
                    {formatDateTime(ent.session_scheduled_at)} · Source:{" "}
                    {ent.source.toUpperCase()}
                  </p>
                </div>
                <Status value={ent.status} size="sm" />
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
