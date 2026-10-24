import * as React from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, CheckCheck, Lock } from "lucide-react";
import {
  Button,
  EmptyState,
  Input,
  Modal,
  SearchInput,
  Skeleton,
  Status,
  ToggleChips,
  toast,
} from "@attendance/ui";
import {
  bulkMarkAttendance,
  finalizeAttendanceSession,
  markStudentAttendance,
  useAuth,
  type SessionRosterRow,
} from "@attendance/supabase";
import type { AttendanceStatus } from "@attendance/types";
import { useLecturerSessionDetail } from "./hooks/use-lecturer-sessions";

export default function LecturerSessionMarkPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const {
    session,
    roster,
    loading,
    searchInput,
    setSearchInput,
    statuses,
    setStatuses,
    refetch,
  } = useLecturerSessionDetail(id);

  const [overrideModal, setOverrideModal] = React.useState<{
    row: SessionRosterRow;
    nextStatus: AttendanceStatus;
  } | null>(null);
  const [overrideReason, setOverrideReason] = React.useState("");
  const [savingId, setSavingId] = React.useState<string | null>(null);
  const [bulkLoading, setBulkLoading] = React.useState(false);

  if (loading && !session) {
    return (
      <div className="flex flex-col gap-4 py-2">
        <Skeleton className="h-12" />
        <Skeleton className="h-10" />
        <Skeleton className="h-64" />
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

  const handleMarkStudent = async (
    row: SessionRosterRow,
    nextStatus: AttendanceStatus,
    reason?: string,
  ) => {
    if (!user) return;
    const requiresReason =
      session.status === "closed" ||
      (row.entry_id !== null && row.entry_source !== "manual");

    if (requiresReason && !reason) {
      setOverrideReason("");
      setOverrideModal({ row, nextStatus });
      return;
    }

    setSavingId(row.student_id);
    try {
      await markStudentAttendance({
        actorId: user.id,
        sessionId: session.id,
        studentId: row.student_id,
        status: nextStatus,
        reason: reason ?? "Manual roster marking by lecturer",
      });
      toast.success(`Marked ${row.student_name} as ${nextStatus.toUpperCase()}`);
      setOverrideModal(null);
      await refetch();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to mark attendance");
    } finally {
      setSavingId(null);
    }
  };

  const handleBulkMarkUnmarkedPresent = async () => {
    if (!user) return;
    const unmarkedIds = roster.filter((r) => !r.entry_status).map((r) => r.student_id);
    if (unmarkedIds.length === 0) {
      toast.message("All students on the roster are already marked");
      return;
    }
    setBulkLoading(true);
    try {
      await bulkMarkAttendance({
        actorId: user.id,
        sessionId: session.id,
        studentIds: unmarkedIds,
        status: "present",
        reason: "Bulk marked Present by lecturer",
      });
      toast.success(`Marked ${unmarkedIds.length} students Present`);
      await refetch();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Bulk mark failed");
    } finally {
      setBulkLoading(false);
    }
  };

  const handleFinalize = async () => {
    if (!user) return;
    setBulkLoading(true);
    try {
      const res = await finalizeAttendanceSession({
        callerId: user.id,
        sessionId: session.id,
      });
      toast.success("Session finalized", {
        description: `${res.absent_inserted} remaining students marked Absent.`,
      });
      await refetch();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to finalize session");
    } finally {
      setBulkLoading(false);
    }
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
        <Status value={session.status} size="sm" />
      </div>

      <div>
        <h1 className="text-v2-2xl font-semibold text-v2-ink">
          Manual & Bulk Marking — {session.course_code}
        </h1>
        <p className="mt-1 text-v2-sm text-v2-ink-secondary">
          Tap Present, Late, or Absent for any enrolled student. Overriding an existing QR/code
          check-in or closed session requires an audit reason.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
        <Button
          variant="secondary"
          size="sm"
          loading={bulkLoading}
          leadingIcon={<CheckCheck />}
          onClick={() => void handleBulkMarkUnmarkedPresent()}
        >
          Mark Unmarked Present
        </Button>
        {session.status !== "closed" && (
          <Button
            variant="primary"
            size="sm"
            loading={bulkLoading}
            leadingIcon={<Lock />}
            onClick={() => void handleFinalize()}
          >
            Finalize & Mark Remaining Absent
          </Button>
        )}
      </div>

      <div className="flex flex-col gap-3">
        <SearchInput
          value={searchInput}
          onValueChange={setSearchInput}
          placeholder="Search student name or ID…"
        />
        <ToggleChips
          multiple={false}
          value={statuses.length === 0 ? ["all"] : statuses}
          onChange={(next) => {
            const v = next[0];
            setStatuses(!v || v === "all" ? [] : [v]);
          }}
          options={[
            { value: "all", label: "All" },
            { value: "unmarked", label: "Unmarked" },
            { value: "present", label: "Present" },
            { value: "late", label: "Late" },
            { value: "absent", label: "Absent" },
          ]}
        />
      </div>

      <div className="flex flex-col divide-y divide-v2-line">
        {roster.map((row) => (
          <div
            key={row.student_id}
            className="flex flex-col gap-3 py-4 first:pt-0 sm:flex-row sm:items-center sm:justify-between"
          >
            <div>
              <div className="flex items-center gap-2">
                <p className="font-semibold text-v2-ink">{row.student_name}</p>
                {row.entry_status ? (
                  <Status value={row.entry_status} size="sm" />
                ) : (
                  <Status value="pending" label="Unmarked" size="sm" />
                )}
              </div>
              <p className="mt-0.5 text-v2-xs text-v2-ink-secondary">
                {row.student_number}
                {row.entry_source ? ` · Source: ${row.entry_source.toUpperCase()}` : ""}
              </p>
            </div>

            <div className="grid grid-cols-3 gap-1.5">
              {(["present", "late", "absent"] as AttendanceStatus[]).map((st) => {
                const isCurrent = row.entry_status === st;
                return (
                  <Button
                    key={st}
                    size="sm"
                    variant={isCurrent ? "primary" : "secondary"}
                    loading={savingId === row.student_id}
                    onClick={() => void handleMarkStudent(row, st)}
                  >
                    {st.charAt(0).toUpperCase() + st.slice(1)}
                  </Button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      <Modal
        open={Boolean(overrideModal)}
        onOpenChange={(open) => !open && setOverrideModal(null)}
        title="Audit Reason Required"
        description={
          overrideModal
            ? `Changing ${overrideModal.row.student_name} to ${overrideModal.nextStatus.toUpperCase()} requires an audit reason.`
            : ""
        }
        footer={
          <>
            <Button variant="secondary" size="sm" onClick={() => setOverrideModal(null)}>
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={() => {
                if (!overrideModal) return;
                if (!overrideReason.trim()) {
                  toast.error("Please enter a reason for this override");
                  return;
                }
                void handleMarkStudent(
                  overrideModal.row,
                  overrideModal.nextStatus,
                  overrideReason.trim(),
                );
              }}
            >
              Confirm Override
            </Button>
          </>
        }
      >
        <Input
          label="Override Reason"
          required
          placeholder="Verified student was present in class…"
          value={overrideReason}
          onChange={(e) => setOverrideReason(e.target.value)}
        />
      </Modal>
    </div>
  );
}
