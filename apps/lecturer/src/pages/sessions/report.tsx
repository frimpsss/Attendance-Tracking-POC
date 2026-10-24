import * as React from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import {
  Button,
  Card,
  EmptyState,
  ExportButton,
  Skeleton,
  StatCards,
  Status,
  toast,
  type ExportFormat,
} from "@attendance/ui";
import { exportToCsv, exportToPdf, formatDateTime } from "@attendance/utils";
import { useLecturerSessionDetail } from "./hooks/use-lecturer-sessions";

export default function LecturerSessionReportPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { session, roster, loading } = useLecturerSessionDetail(id);

  if (loading && !session) {
    return (
      <div className="flex flex-col gap-4 py-2">
        <Skeleton className="h-9 w-28" />
        <Skeleton className="h-24 w-full rounded-v2-lg" />
        <Skeleton className="h-64 w-full rounded-v2-lg" />
      </div>
    );
  }

  if (!session) {
    return (
      <EmptyState
        title="Session not found"
        action={<Button onClick={() => navigate("/sessions")}>Back to Sessions</Button>}
      />
    );
  }

  const attendedCount = session.present_count + session.late_count;
  const attendanceRate =
    session.enrolled_count > 0
      ? Math.round((attendedCount / session.enrolled_count) * 100)
      : 100;

  const handleExport = (format: ExportFormat) => {
    if (format === "pdf") {
      exportToPdf({
        title: `${session.course_code} — ${session.title}`,
        subtitle: `Scheduled ${formatDateTime(session.scheduled_at)} · Attendance Rate: ${attendanceRate}%`,
        headers: ["Student ID", "Full Name", "Status", "Source", "Checked In At"],
        rows: roster.map((r) => [
          r.student_number,
          r.student_name,
          (r.entry_status ?? "unmarked").toUpperCase(),
          (r.entry_source ?? "—").toUpperCase(),
          formatDateTime(r.checked_in_at),
        ]),
      });
      return;
    }

    exportToCsv(
      `${session.course_code}-${session.title.replace(/\s+/g, "-")}.csv`,
      roster.map((r) => ({
        student_number: r.student_number,
        student_name: r.student_name,
        email: r.student_email,
        status: r.entry_status ?? "unmarked",
        source: r.entry_source ?? "—",
        checked_in_at: r.checked_in_at ?? "—",
        override_reason: r.override_reason ?? "",
      })),
    );
    toast.success("Session CSV report exported");
  };

  return (
    <div className="flex flex-col gap-6 py-2">
      <div className="flex items-center justify-between gap-2">
        <Button
          variant="ghost"
          size="sm"
          leadingIcon={<ArrowLeft />}
          onClick={() => navigate(`/sessions/${session.id}`)}
        >
          Back to Session
        </Button>
        <div className="flex items-center gap-2">
          <Status value={session.status} size="sm" />
          <ExportButton
            formats={["csv", "pdf"]}
            onExport={handleExport}
            label="Export"
          />
        </div>
      </div>

      <div>
        <h1 className="text-v2-xl font-bold tracking-tight text-v2-ink">
          Session Attendance Report — {session.course_code}
        </h1>
        <p className="mt-1 text-v2-xs text-v2-ink-secondary">
          {session.title} · {formatDateTime(session.scheduled_at)}
        </p>
      </div>

      <StatCards
        columns={2}
        items={[
          {
            label: "Session Attendance Rate",
            value: `${attendanceRate}%`,
            caption: `${attendedCount} of ${session.enrolled_count} attended`,
          },
          {
            label: "Breakdown",
            value: `${session.present_count} P · ${session.late_count} L · ${session.absent_count} A`,
            caption: "Present / Late / Absent",
          },
        ]}
      />

      <Card variant="plain" title={`Full Session Roster (${roster.length})`}>
        <div className="flex flex-col divide-y divide-v2-line rounded-v2-lg bg-v2-surface px-4">
          {roster.map((r) => (
            <div
              key={r.student_id}
              className="flex items-center justify-between gap-3 py-3.5"
            >
              <div>
                <p className="font-semibold text-v2-ink">{r.student_name}</p>
                <p className="mt-0.5 text-v2-xs text-v2-ink-secondary">
                  {r.student_number} ·{" "}
                  {r.entry_source ? `Source: ${r.entry_source.toUpperCase()}` : "Unmarked"}
                </p>
              </div>
              {r.entry_status ? (
                <Status value={r.entry_status} size="sm" />
              ) : (
                <Status value="pending" label="Unmarked" size="sm" />
              )}
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
