import * as React from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Check, X } from "lucide-react";
import {
  Button,
  Card,
  EmptyState,
  Skeleton,
  Status,
  SupportingEvidenceView,
  Textarea,
  toast,
} from "@attendance/ui";
import { reviewCorrectionRequest, useAuth } from "@attendance/supabase";
import { formatDateTime } from "@attendance/utils";
import { useLecturerCorrectionDetail } from "./hooks/use-lecturer-corrections";

export default function LecturerCorrectionDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { item, loading, refetch } = useLecturerCorrectionDetail(id);

  const [decisionNote, setDecisionNote] = React.useState("");
  const [submitting, setSubmitting] = React.useState(false);

  if (loading && !item) {
    return (
      <div className="flex flex-col gap-4 py-2">
        <Skeleton className="h-9 w-28" />
        <Skeleton className="h-64 w-full rounded-v2-lg" />
        <Skeleton className="h-44 w-full rounded-v2-lg" />
      </div>
    );
  }

  if (!item) {
    return (
      <EmptyState
        title="Correction request not found"
        action={<Button onClick={() => navigate("/corrections")}>Back to Corrections</Button>}
      />
    );
  }

  const handleDecision = async (decision: "approved" | "rejected") => {
    if (!user) return;
    setSubmitting(true);
    try {
      await reviewCorrectionRequest({
        reviewerId: user.id,
        requestId: item.id,
        decision,
        decisionNote: decisionNote.trim() || undefined,
      });
      toast.success(
        decision === "approved"
          ? "Correction approved and attendance entry updated"
          : "Correction request rejected",
      );
      await refetch();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to review request");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col gap-6 py-2">
      <div className="flex items-center justify-between gap-2">
        <Button
          variant="ghost"
          size="sm"
          leadingIcon={<ArrowLeft />}
          onClick={() => navigate("/corrections")}
        >
          Corrections
        </Button>
        <Status value={item.status} size="sm" />
      </div>

      <Card variant="plain" title="Correction Request Details">
        <div className="flex flex-col gap-3 rounded-v2-lg bg-v2-surface p-5 text-v2-sm">
          <div className="flex justify-between border-b border-v2-line pb-2.5">
            <span className="text-v2-ink-secondary">Student</span>
            <span className="font-semibold text-v2-ink">
              {item.student_name} ({item.student_number})
            </span>
          </div>
          <div className="flex justify-between border-b border-v2-line pb-2.5">
            <span className="text-v2-ink-secondary">Course</span>
            <span className="font-semibold text-v2-ink">
              {item.course_code} — {item.course_title}
            </span>
          </div>
          <div className="flex justify-between border-b border-v2-line pb-2.5">
            <span className="text-v2-ink-secondary">Session</span>
            <span className="font-medium text-v2-ink">
              {item.session_title} ({formatDateTime(item.session_scheduled_at)})
            </span>
          </div>
          <div className="flex items-center justify-between border-b border-v2-line pb-2.5">
            <span className="text-v2-ink-secondary">Current Recorded Status</span>
            <Status value={item.current_entry_status} size="sm" />
          </div>
          <div className="flex items-center justify-between border-b border-v2-line pb-2.5">
            <span className="text-v2-ink-secondary">Requested Status</span>
            <Status value={item.requested_status} size="sm" />
          </div>
          <div className="flex flex-col gap-1.5 border-b border-v2-line pb-2.5">
            <span className="text-v2-ink-secondary">Student Explanation</span>
            <p className="rounded-v2-md bg-v2-canvas p-3 text-v2-ink">
              "{item.reason}"
            </p>
          </div>
          {item.supporting_note && (
            <div className="flex flex-col gap-1.5 border-b border-v2-line pb-2.5">
              <span className="text-v2-ink-secondary">Supporting Evidence / Note</span>
              <SupportingEvidenceView value={item.supporting_note} />
            </div>
          )}
          <div className="flex justify-between">
            <span className="text-v2-ink-secondary">Submitted At</span>
            <span className="text-v2-ink">{formatDateTime(item.created_at)}</span>
          </div>
        </div>
      </Card>

      {item.status === "pending" ? (
        <Card variant="plain" title="Review Decision">
          <div className="flex flex-col gap-4 rounded-v2-lg bg-v2-surface p-5">
            <Textarea
              label="Decision Note (Visible to Student)"
              rows={3}
              placeholder="Explain why the request was approved or rejected…"
              value={decisionNote}
              onChange={(e) => setDecisionNote(e.target.value)}
            />
            <div className="grid grid-cols-2 gap-3">
              <Button
                variant="danger"
                loading={submitting}
                leadingIcon={<X />}
                onClick={() => void handleDecision("rejected")}
              >
                Reject
              </Button>
              <Button
                variant="primary"
                loading={submitting}
                leadingIcon={<Check />}
                onClick={() => void handleDecision("approved")}
              >
                Approve & Update
              </Button>
            </div>
          </div>
        </Card>
      ) : (
        <Card variant="plain" title="Decision Record">
          <div className="flex flex-col gap-2.5 rounded-v2-lg bg-v2-surface p-5 text-v2-sm">
            <div className="flex justify-between">
              <span className="text-v2-ink-secondary">Reviewed By</span>
              <span className="font-semibold text-v2-ink">{item.reviewer_name ?? "Admin / Lecturer"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-v2-ink-secondary">Reviewed At</span>
              <span className="text-v2-ink">{formatDateTime(item.reviewed_at)}</span>
            </div>
            {item.decision_note && (
              <div className="flex flex-col gap-1.5 pt-1">
                <span className="text-v2-ink-secondary">Decision Note</span>
                <p className="rounded-v2-md bg-v2-canvas p-3 text-v2-ink">
                  {item.decision_note}
                </p>
              </div>
            )}
          </div>
        </Card>
      )}
    </div>
  );
}
