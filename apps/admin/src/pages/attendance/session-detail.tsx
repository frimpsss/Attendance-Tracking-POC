import * as React from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { Check, Clock, Edit3, Lock, X } from "lucide-react";
import {
  Button,
  EmptyState,
  FocusLayout,
  Skeleton,
  StatCards,
  Status,
  Table,
  toast,
  type TableBulkAction,
} from "@attendance/ui";
import {
  finalizeAttendanceSession,
  markStudentAttendance,
  querySessionById,
  querySessionRosterPage,
  subscribeToAttendanceChanges,
  useAuth,
  type SessionRosterRow,
  type SessionSummaryRow,
} from "@attendance/supabase";
import type { AttendanceStatus } from "@attendance/types";
import { formatDateTime } from "@attendance/utils";
import { OverrideAttendanceModal, type OverrideTarget } from "./components/override-modal";

export default function SessionDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  const [session, setSession] = React.useState<SessionSummaryRow | null>(null);
  const [roster, setRoster] = React.useState<SessionRosterRow[]>([]);
  const [totalRoster, setTotalRoster] = React.useState(0);
  const [loading, setLoading] = React.useState(true);
  const [selected, setSelected] = React.useState<string[]>([]);

  const [searchInput, setSearchInput] = React.useState("");
  const [search, setSearch] = React.useState("");
  const [statuses, setStatuses] = React.useState<string[]>([]);
  const [page, setPage] = React.useState(1);
  const [pageSize, setPageSize] = React.useState(15);

  const [overrideTarget, setOverrideTarget] = React.useState<OverrideTarget | null>(null);
  const [finalizing, setFinalizing] = React.useState(false);

  const exit = () => (location.key !== "default" ? navigate(-1) : navigate("/attendance"));

  React.useEffect(() => {
    const t = setTimeout(() => {
      setSearch(searchInput.trim());
      setPage(1);
    }, 250);
    return () => clearTimeout(t);
  }, [searchInput]);

  const load = React.useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      const [sess, rost] = await Promise.all([
        querySessionById(id),
        querySessionRosterPage({
          sessionId: id,
          page,
          pageSize,
          search,
          statuses,
        }),
      ]);
      setSession(sess);
      setRoster(rost.items);
      setTotalRoster(rost.total);
    } finally {
      setLoading(false);
    }
  }, [id, page, pageSize, search, statuses]);

  React.useEffect(() => {
    void load();
    return subscribeToAttendanceChanges(() => void load());
  }, [load]);

  const handleFinalize = async () => {
    if (!user || !session) return;
    setFinalizing(true);
    try {
      const res = await finalizeAttendanceSession({
        callerId: user.id,
        sessionId: session.id,
      });
      toast.success("Session finalized", {
        description: `${res.absent_inserted} unmarked students recorded as Absent.`,
      });
      await load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to finalize session");
    } finally {
      setFinalizing(false);
    }
  };

  const handleBulkMark = async (studentIds: string[], nextStatus: AttendanceStatus) => {
    if (!user || !session || studentIds.length === 0) return;
    try {
      await Promise.all(
        studentIds.map((studentId) =>
          markStudentAttendance({
            callerId: user.id,
            sessionId: session.id,
            studentId,
            status: nextStatus,
            reason: `Bulk marked ${nextStatus} by Admin`,
          }),
        ),
      );
      toast.success(`Marked ${studentIds.length} student(s) as ${nextStatus}`);
      setSelected([]);
      await load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to mark attendance");
    }
  };

  const bulkActions = (keys: string[]): TableBulkAction[] => {
    const picked = roster.filter((r) => keys.includes(r.student_id));
    const single = picked.length === 1 ? picked[0] : null;
    return [
      ...(single && session
        ? [
            {
              label: "Audited Override",
              icon: <Edit3 />,
              onClick: () =>
                setOverrideTarget({
                  sessionId: session.id,
                  studentId: single.student_id,
                  studentName: single.student_name,
                  studentNumber: single.student_number,
                  currentStatus: single.entry_status ?? "present",
                }),
            },
          ]
        : []),
      {
        label: "Mark Present",
        icon: <Check />,
        onClick: (k: string[]) => void handleBulkMark(k, "present"),
      },
      {
        label: "Mark Late",
        icon: <Clock />,
        onClick: (k: string[]) => void handleBulkMark(k, "late"),
      },
      {
        label: "Mark Absent",
        icon: <X />,
        tone: "danger" as const,
        onClick: (k: string[]) => void handleBulkMark(k, "absent"),
      },
    ];
  };

  return (
    <div className="h-dvh">
      <FocusLayout
        width="xl"
        title={session ? `${session.course_code} — ${session.title}` : "Attendance Session"}
        status={session && <Status value={session.status} size="sm" />}
        subtitle={
          session
            ? `Scheduled ${formatDateTime(session.scheduled_at)} · ${session.course_title}`
            : undefined
        }
        onBack={exit}
        actions={
          session &&
          session.status !== "closed" && (
            <Button
              variant="primary"
              size="sm"
              loading={finalizing}
              leadingIcon={<Lock />}
              onClick={() => void handleFinalize()}
            >
              Close & Finalize Session
            </Button>
          )
        }
      >
        {!loading && !session ? (
          <EmptyState
            illustration="search"
            title="Session not found"
            description="Go back to the attendance monitor and try again."
            action={<Button onClick={exit}>Back to Attendance</Button>}
          />
        ) : loading && !session ? (
          <div className="flex flex-col gap-6">
            <Skeleton className="h-24" />
            <Skeleton className="h-12" />
            <Skeleton className="h-80" />
          </div>
        ) : session ? (
          <div className="flex flex-col gap-8">
            <StatCards
              columns={5}
              items={[
                {
                  label: "Session Status",
                  value: session.status.toUpperCase(),
                  caption: session.closed_at
                    ? `Closed ${formatDateTime(session.closed_at)}`
                    : "Active / Scheduled",
                },
                {
                  label: "Enrolled Roster",
                  value: String(session.enrolled_count),
                  caption: session.course_title,
                },
                {
                  label: "Present",
                  value: String(session.present_count),
                  caption: "On-time check-ins",
                },
                {
                  label: "Late",
                  value: String(session.late_count),
                  caption: "After grace window",
                },
                {
                  label: "Absent",
                  value: String(session.absent_count),
                  caption: "Recorded absences",
                },
              ]}
            />

            <Table
              loading={loading}
              data={roster}
              rowKey={(r) => r.student_id}
              onRowClick={(r) =>
                setOverrideTarget({
                  sessionId: session.id,
                  studentId: r.student_id,
                  studentName: r.student_name,
                  studentNumber: r.student_number,
                  currentStatus: r.entry_status ?? "present",
                })
              }
              selectedKeys={selected}
              onSelectionChange={setSelected}
              bulkNoun={["student", "students"]}
              bulkActions={bulkActions}
              search={{
                value: searchInput,
                onChange: setSearchInput,
                placeholder: "Search student ID or name…",
              }}
              filters={[
                {
                  key: "status",
                  label: "Status",
                  options: [
                    { value: "present", label: "Present" },
                    { value: "late", label: "Late" },
                    { value: "absent", label: "Absent" },
                    { value: "unmarked", label: "Unmarked" },
                  ],
                  value: statuses,
                  onChange: (v) => {
                    setStatuses(v);
                    setPage(1);
                  },
                },
              ]}
              onRefresh={() => void load()}
              pagination={{
                page,
                pageCount: Math.max(1, Math.ceil(totalRoster / pageSize)),
                onPageChange: setPage,
                pageSize,
                onPageSizeChange: (v) => {
                  setPageSize(v);
                  setPage(1);
                },
                total: totalRoster,
              }}
              columns={[
                {
                  key: "id",
                  header: "Student ID",
                  cell: (r) => (
                    <span className="font-v2-mono text-v2-sm font-semibold">
                      {r.student_number}
                    </span>
                  ),
                },
                {
                  key: "name",
                  header: "Student",
                  cell: (r) => (
                    <div>
                      <p className="font-semibold text-v2-ink">{r.student_name}</p>
                      <p className="text-v2-xs text-v2-ink-secondary">{r.student_email}</p>
                    </div>
                  ),
                },
                {
                  key: "source",
                  header: "Source",
                  cell: (r) =>
                    r.entry_source ? (
                      <Status
                        value={r.entry_source}
                        label={r.entry_source.toUpperCase()}
                        size="sm"
                      />
                    ) : (
                      <span className="text-v2-xs text-v2-ink-tertiary">Not marked yet</span>
                    ),
                },
                {
                  key: "time",
                  header: "Checked In At",
                  cell: (r) => (
                    <span className="text-v2-sm text-v2-ink-secondary">
                      {formatDateTime(r.checked_in_at)}
                    </span>
                  ),
                },
                {
                  key: "status",
                  header: "Status",
                  align: "right",
                  cell: (r) =>
                    r.entry_status ? (
                      <Status value={r.entry_status} size="sm" />
                    ) : (
                      <Status value="pending" label="Unmarked" size="sm" />
                    ),
                },
              ]}
            />
          </div>
        ) : null}
      </FocusLayout>

      <OverrideAttendanceModal
        target={overrideTarget}
        onOpenChange={(open) => !open && setOverrideTarget(null)}
        onSaved={() => void load()}
      />
    </div>
  );
}
