import { useNavigate } from "react-router-dom";
import { ArrowRight, Plus } from "lucide-react";
import {
  Badge,
  BreakdownBars,
  Button,
  Card,
  EmptyState,
  PageHeader,
  Skeleton,
  StatCards,
  Status,
} from "@attendance/ui";
import { PendingCorrectionsCard } from "./components/pending-corrections-card";
import { RecentSessionsCard } from "./components/recent-sessions-card";
import { useDashboard } from "./hooks/use-dashboard";
import { computeOverallAttendance } from "./utils/metrics";

export default function DashboardPage() {
  const navigate = useNavigate();
  const {
    studentsTotal,
    lecturersTotal,
    courses,
    recentSessions,
    sessionsTotal,
    lowStudents,
    pendingCorrections,
    settings,
    loading,
  } = useDashboard();

  const threshold = settings?.low_attendance_threshold ?? 75;
  const timezone = settings?.timezone ?? "Africa/Accra";
  const overallRate = computeOverallAttendance(courses);

  return (
    <div className="flex flex-col gap-12">
      <PageHeader
        title="Overview"
        description="Real-time attendance performance, course participation, and threshold alerts."
        actions={
          <Button
            variant="primary"
            size="sm"
            leadingIcon={<Plus />}
            onClick={() => navigate("/courses?action=create")}
          >
            New Course
          </Button>
        }
      />

      <StatCards
        columns={4}
        loading={loading && courses.length === 0}
        items={[
          {
            label: "Overall Attendance",
            value: overallRate,
            caption: `Policy threshold: ${threshold}%`,
          },
          {
            label: "Students",
            value: String(studentsTotal),
            caption: `${lowStudents.length} below threshold`,
          },
          {
            label: "Active Courses",
            value: String(courses.filter((c) => c.is_active).length),
            caption: `${lecturersTotal} assigned lecturers`,
          },
          {
            label: "Recorded Sessions",
            value: String(sessionsTotal),
            caption: `${recentSessions.filter((s) => s.status === "open").length} open right now`,
          },
        ]}
      />

      <div className="grid grid-cols-1 gap-12 lg:grid-cols-2">
        <Card
          variant="plain"
          title="Attendance by Course"
          description="Present + Late attendance rate across finalized sessions"
          actions={
            <Button
              variant="ghost"
              size="sm"
              trailingIcon={<ArrowRight />}
              onClick={() => navigate("/reports")}
            >
              Full Report
            </Button>
          }
        >
          {loading && courses.length === 0 ? (
            <div className="flex flex-col gap-4">
              <Skeleton className="h-9" />
              <Skeleton className="h-9" />
              <Skeleton className="h-9" />
            </div>
          ) : courses.length === 0 ? (
            <EmptyState size="sm" title="No courses yet" />
          ) : (
            <BreakdownBars
              max={100}
              items={courses.map((c) => ({
                label: `${c.code} — ${c.title}`,
                value: c.attendance_percentage ?? 0,
                displayValue:
                  c.attendance_percentage !== null ? `${c.attendance_percentage}%` : "N/A",
                meta: `${c.closed_sessions_count} ${
                  c.closed_sessions_count === 1 ? "session" : "sessions"
                }`,
              }))}
            />
          )}
        </Card>

        <Card
          variant="plain"
          title="Students Below Threshold"
          description={`Enrolled students below the ${threshold}% attendance requirement`}
          actions={
            <Badge tone={lowStudents.length > 0 ? "danger" : "neutral"}>
              {lowStudents.length} flagged
            </Badge>
          }
        >
          {loading && courses.length === 0 ? (
            <div className="flex flex-col gap-4">
              <Skeleton className="h-12" />
              <Skeleton className="h-12" />
              <Skeleton className="h-12" />
            </div>
          ) : lowStudents.length === 0 ? (
            <EmptyState
              size="sm"
              title="All students meet threshold"
              description="No students are currently below the configured attendance threshold."
            />
          ) : (
            <div className="flex flex-col divide-y divide-v2-line">
              {lowStudents.slice(0, 6).map((s) => (
                <div
                  key={s.user_id}
                  onClick={() => navigate(`/students/${s.user_id}`)}
                  className="-mx-2 flex cursor-pointer items-center justify-between gap-4 rounded-v2-sm px-2 py-3.5 transition-colors duration-v2-fast first:pt-1 last:pb-1 hover:bg-v2-surface"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2.5">
                      <span className="truncate text-v2-base font-semibold text-v2-ink">
                        {s.full_name}
                      </span>
                      <span className="font-v2-mono text-v2-xs text-v2-ink-tertiary">
                        {s.student_number}
                      </span>
                    </div>
                    <p className="mt-0.5 text-v2-xs text-v2-ink-secondary">
                      {s.department_code} · {s.attended_count} of {s.eligible_sessions_count} sessions attended
                    </p>
                  </div>
                  <Status
                    value="absent"
                    label={
                      s.attendance_percentage !== null ? `${s.attendance_percentage}%` : "N/A"
                    }
                    size="sm"
                  />
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      <RecentSessionsCard
        sessions={recentSessions}
        loading={loading}
        timezone={timezone}
      />

      {pendingCorrections.length > 0 && (
        <PendingCorrectionsCard
          corrections={pendingCorrections}
          timezone={timezone}
        />
      )}
    </div>
  );
}
