import * as React from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ArrowLeft, Send } from "lucide-react";
import {
  Alert,
  Button,
  Card,
  FileUpload,
  Input,
  Select,
  Skeleton,
  Textarea,
  serializeSupportingEvidence,
  toast,
  type UploadItem,
} from "@attendance/ui";
import { submitStudentCorrectionRequest, useAuth } from "@attendance/supabase";
import type { AttendanceStatus } from "@attendance/types";
import { formatDateTime } from "@attendance/utils";
import { useStudentCorrections } from "./hooks/use-student-corrections";

export default function NewStudentCorrectionPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const { items: existingCorrections, eligibleEntries, loading } = useStudentCorrections();

  const preselectedEntryId = searchParams.get("entryId") ?? "";
  const [entryId, setEntryId] = React.useState(preselectedEntryId);
  const [requestedStatus, setRequestedStatus] = React.useState<AttendanceStatus>("present");
  const [reason, setReason] = React.useState("");
  const [supportingNote, setSupportingNote] = React.useState("");
  const [uploads, setUploads] = React.useState<UploadItem[]>([]);
  const [saving, setSaving] = React.useState(false);

  React.useEffect(() => {
    if (!entryId && eligibleEntries.length > 0) {
      setEntryId(preselectedEntryId || eligibleEntries[0].id);
    }
  }, [eligibleEntries, entryId, preselectedEntryId]);

  const hasPendingForSelected = existingCorrections.some(
    (c) => c.attendance_entry_id === entryId && c.status === "pending",
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !entryId) return;
    if (hasPendingForSelected) {
      toast.error("A pending correction request already exists for this session entry");
      return;
    }
    setSaving(true);
    try {
      const serializedEvidence = await serializeSupportingEvidence(supportingNote, uploads);
      await submitStudentCorrectionRequest({
        studentId: user.id,
        entryId,
        requestedStatus,
        reason: reason.trim(),
        supportingNote: serializedEvidence,
      });
      toast.success("Correction request submitted to course lecturer");
      navigate("/corrections", { replace: true });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to submit correction request");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex flex-col gap-6 py-2">
      <div>
        <Button
          variant="ghost"
          size="sm"
          leadingIcon={<ArrowLeft />}
          onClick={() => navigate(-1)}
        >
          Back
        </Button>
      </div>

      <Card
        variant="plain"
        title="Submit Attendance Correction Request"
        description="Select a finalized attendance session entry, explain why your status should be updated, and attach supporting evidence."
      >
        {loading ? (
          <div className="flex flex-col gap-4 rounded-v2-lg bg-v2-surface p-5">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-24 w-full" />
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-5 rounded-v2-lg bg-v2-surface p-5">
            <Select
              label="Finalized Attendance Session Entry"
              required
              value={entryId}
              onValueChange={setEntryId}
              options={eligibleEntries.map((e) => ({
                value: e.id,
                label: `${e.course_code} — ${e.session_title} (${formatDateTime(e.session_scheduled_at)}) [${e.status.toUpperCase()}]`,
              }))}
            />

            {hasPendingForSelected && (
              <Alert tone="warning" title="Pending Request Exists">
                You already have a pending correction request for this attendance entry. Duplicate
                pending requests are blocked.
              </Alert>
            )}

            <Select
              label="Requested Attendance Status"
              value={requestedStatus}
              onValueChange={(v) => setRequestedStatus(v as AttendanceStatus)}
              options={[
                { value: "present", label: "Present" },
                { value: "late", label: "Late" },
              ]}
            />

            <Textarea
              label="Explanation / Reason"
              required
              rows={3}
              placeholder="Explain why your attendance record should be corrected…"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            />

            <FileUpload
              label="Supporting Documents / Evidence"
              optional
              value={uploads}
              onChange={setUploads}
              maxSize={5 * 1024 * 1024}
              accept={{
                "application/pdf": [".pdf"],
                "image/*": [".png", ".jpg", ".jpeg", ".webp"],
              }}
              description="Upload medical note, lab sign-in sheet, or photo · PDF, PNG, JPG up to 5 MB"
            />

            <Input
              label="Supporting Evidence Note / Reference"
              optional
              placeholder="Medical certificate ref #MC-2026-88 or lab sign-in sheet…"
              value={supportingNote}
              onChange={(e) => setSupportingNote(e.target.value)}
            />

            <Button
              type="submit"
              size="lg"
              fullWidth
              disabled={hasPendingForSelected || !entryId}
              loading={saving}
              leadingIcon={<Send />}
            >
              Submit Correction Request
            </Button>
          </form>
        )}
      </Card>
    </div>
  );
}
