import * as React from "react";
import { Button, Modal, ModalClose, Select, Textarea, toast } from "@attendance/ui";
import { markStudentAttendance, useAuth } from "@attendance/supabase";
import type { AttendanceStatus } from "@attendance/types";

export interface OverrideTarget {
  sessionId: string;
  studentId: string;
  studentName: string;
  studentNumber: string;
  currentStatus: AttendanceStatus;
}

export function OverrideAttendanceModal({
  target,
  onOpenChange,
  onSaved,
}: {
  target: OverrideTarget | null;
  onOpenChange: (open: boolean) => void;
  onSaved: () => void;
}) {
  const { user } = useAuth();
  const [status, setStatus] = React.useState<AttendanceStatus>("present");
  const [reason, setReason] = React.useState("");
  const [saving, setSaving] = React.useState(false);

  React.useEffect(() => {
    if (target) {
      setStatus(target.currentStatus);
      setReason("");
    }
  }, [target]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!target || !user) return;
    if (reason.trim().length < 3) {
      toast.error("An audit reason (minimum 3 characters) is mandatory for overrides.");
      return;
    }
    setSaving(true);
    try {
      await markStudentAttendance({
        callerId: user.id,
        sessionId: target.sessionId,
        studentId: target.studentId,
        status,
        reason: reason.trim(),
      });
      toast.success("Attendance entry overridden and logged in audit trail");
      onOpenChange(false);
      onSaved();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to override attendance");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      open={Boolean(target)}
      onOpenChange={onOpenChange}
      title="Audited Attendance Override"
      description={
        target
          ? `Override recorded status for ${target.studentName} (${target.studentNumber}). This action writes an immutable entry to the Audit Log.`
          : ""
      }
      footer={
        <>
          <ModalClose asChild>
            <Button variant="secondary" disabled={saving}>
              Cancel
            </Button>
          </ModalClose>
          <Button loading={saving} onClick={(e) => void submit(e)}>
            Confirm Audited Override
          </Button>
        </>
      }
    >
      <form onSubmit={submit} className="flex flex-col gap-4">
        <Select
          label="New Attendance Status"
          required
          value={status}
          onValueChange={(v) => setStatus(v as AttendanceStatus)}
          options={[
            { value: "present", label: "Present" },
            { value: "late", label: "Late (counts as attended)" },
            { value: "absent", label: "Absent" },
          ]}
        />
        <Textarea
          label="Mandatory Audit Reason"
          required
          placeholder="Explain why this attendance record is being modified (e.g. Approved medical excuse, verified lab sign-in sheet)…"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
        />
      </form>
    </Modal>
  );
}
