import * as React from "react";
import { useNavigate } from "react-router-dom";
import {
  AlertTriangle,
  ArrowRight,
  CalendarClock,
  ClipboardCheck,
  Plus,
  QrCode,
  Radio,
} from "lucide-react";
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
import { useLecturerHome } from "./hooks/use-lecturer-home";

export default function LecturerHomePage() {
  const navigate = useNavigate();
  const {
    courses,
    openSessions,
    recentSessions,
    todayTimetables,
    pendingCorrections,
    lowStudents,
    threshold,
    loading,
  } = useLecturerHome();

  return (
    <div className="flex flex-col gap-8 py-2">
      <div className="flex flex-col gap-4 rounded-v2-md bg-v2-surface p-5">
        <div>
          <p className="text-v2-2xs font-semibold uppercase tracking-[0.08em] text-v2-ink-tertiary">
            Classroom Control
          </p>
          <h2 className="mt-1 text-v2-xl font-semibold text-v2-ink">
            Ready to take attendance?
          </h2>
          <p className="mt-1 text-v2-sm text-v2-ink-secondary">
            Open a session to display a live QR code and 6-character check-in code.
          </p>
        </div>
        <Button
          size="lg"
          fullWidth
          leadingIcon={<Plus />}
          onClick={() => navigate("/sessions/new")}
        >
          Start Attendance Session
        </Button>
      </div>

      {openSessions.length > 0 && (
        <div className="flex flex-col gap-2.5">
          {openSessions.map((sess) => (
            <button
              key={sess.id}
              type="button"
              onClick={() => navigate(`/sessions/${sess.id}`)}
              className="flex w-full items-center justify-between gap-3 rounded-v2-md bg-v2-primary-soft p-4 text-left transition-colors duration-v2-fast hover:bg-v2-primary-soft-hover"
            >
              <div className="flex items-center gap-3.5">
                <div className="flex size-10 shrink-0 items-center justify-center rounded-v2-sm bg-v2-primary text-v2-on-primary">
                  <Radio className="size-5 animate-pulse" />
                </div>
                <div>
                  <span className="text-v2-2xs font-semibold uppercase tracking-[0.08em] text-v2-primary">
                    Live Open Session
                  </span>
                  <p className="mt-0.5 text-v2-base font-semibold text-v2-ink">
                    {sess.course_code} — {sess.title}
                  </p>
                  <p className="text-v2-xs text-v2-ink-secondary">
                    {sess.present_count + sess.late_count} / {sess.enrolled_count} checked in
                  </p>
                </div>
              </div>
              <QrCode className="size-5 shrink-0 text-v2-primary" />
            </button>
          ))}
        </div>
      )}

      <StatCards
        columns={2}
        loading={loading && courses.length === 0}
        items={[
          {
            label: "Assigned Courses",
            value: String(courses.length),
            caption: "Active semester",
          },
          {
            label: "Pending Corrections",
            value: String(pendingCorrections.length),
            caption: "Awaiting review",
          },
        ]}
      />

      <Card
        variant="plain"
        title={`Today's Classes (${getWeekdayName(new Date().getDay())})`}
        actions={
          <Button variant="ghost" size="sm" onClick={() => navigate("/courses")}>
            All Courses
          </Button>
        }
      >
        {loading && courses.length === 0 ? (
          <div className="flex flex-col gap-3">
            <Skeleton className="h-14" />
            <Skeleton className="h-14" />
          </div>
        ) : todayTimetables.length === 0 ? (
          <EmptyState
            size="sm"
            icon={<CalendarClock />}
            title="No scheduled classes today"
            description="You can still open an ad-hoc session for any assigned course."
          />
        ) : (
          <div className="flex flex-col divide-y divide-v2-line">
            {todayTimetables.map((slot) => (
              <div
                key={slot.id}
                className="flex items-center justify-between gap-3 py-3.5 first:pt-0 last:pb-0"
              >
                <div>
                  <p className="font-semibold text-v2-ink">
                    {slot.course_code} — {slot.course_title}
                  </p>
                  <p className="text-v2-xs text-v2-ink-secondary">
                    {formatTimeSlot(slot.start_time, slot.end_time)} · {slot.venue}
                  </p>
                </div>
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => navigate(`/sessions/new?courseId=${slot.course_id}`)}
                >
                  Open
                </Button>
              </div>
            ))}
          </div>
        )}
      </Card>

      {pendingCorrections.length > 0 && (
        <Card
          variant="plain"
          title="Pending Correction Requests"
          actions={
            <Button
              variant="ghost"
              size="sm"
              trailingIcon={<ArrowRight />}
              onClick={() => navigate("/corrections")}
            >
              Review All
            </Button>
          }
        >
          <div className="flex flex-col divide-y divide-v2-line">
            {pendingCorrections.map((corr) => (
              <button
                key={corr.id}
                type="button"
                onClick={() => navigate(`/corrections/${corr.id}`)}
                className="flex items-center justify-between gap-3 py-3.5 text-left first:pt-0 last:pb-0"
              >
                <div className="min-w-0">
                  <p className="font-semibold text-v2-ink">
                    {corr.student_name} ({corr.student_number})
                  </p>
                  <p className="truncate text-v2-xs text-v2-ink-secondary">
                    {corr.course_code} · "{corr.reason}"
                  </p>
                </div>
                <Status value="pending" size="sm" />
              </button>
            ))}
          </div>
        </Card>
      )}

      {lowStudents.length > 0 && (
        <Card
          variant="plain"
          title={`Students Below ${threshold}% Threshold`}
          description="Enrolled students at risk in your assigned courses."
        >
          <div className="flex flex-col divide-y divide-v2-line">
            {lowStudents.map((st) => (
              <div
                key={`${st.course_id}-${st.student_id}`}
                className="flex items-center justify-between gap-3 py-3 first:pt-0 last:pb-0"
              >
                <div>
                  <p className="text-v2-sm font-semibold text-v2-ink">
                    {st.student_name} ({st.student_number})
                  </p>
                  <p className="text-v2-xs text-v2-ink-secondary">
                    {st.course_code} · {st.attended_count}/{st.eligible_sessions} sessions
                  </p>
                </div>
                <Badge tone="danger" size="sm">
                  <AlertTriangle className="mr-1 h-3 w-3" />
                  {st.attendance_percentage}%
                </Badge>
              </div>
            ))}
          </div>
        </Card>
      )}

      <Card
        variant="plain"
        title="Recent Sessions"
        actions={
          <Button
            variant="ghost"
            size="sm"
            trailingIcon={<ArrowRight />}
            onClick={() => navigate("/sessions")}
          >
            All Sessions
          </Button>
        }
      >
        {loading && recentSessions.length === 0 ? (
          <div className="flex flex-col gap-3">
            <Skeleton className="h-14" />
            <Skeleton className="h-14" />
          </div>
        ) : recentSessions.length === 0 ? (
          <EmptyState
            size="sm"
            icon={<ClipboardCheck />}
            title="No sessions yet"
            description="Open your first attendance session above."
          />
        ) : (
          <div className="flex flex-col divide-y divide-v2-line">
            {recentSessions.map((sess) => (
              <button
                key={sess.id}
                type="button"
                onClick={() => navigate(`/sessions/${sess.id}`)}
                className="flex items-center justify-between gap-3 py-3.5 text-left first:pt-0 last:pb-0"
              >
                <div>
                  <p className="text-v2-sm font-semibold text-v2-ink">
                    {sess.course_code} — {sess.title}
                  </p>
                  <p className="text-v2-xs text-v2-ink-secondary">
                    {formatDateTime(sess.scheduled_at)} · {sess.present_count} P / {sess.late_count} L /{" "}
                    {sess.absent_count} A
                  </p>
                </div>
                <Status value={sess.status} size="sm" />
              </button>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
