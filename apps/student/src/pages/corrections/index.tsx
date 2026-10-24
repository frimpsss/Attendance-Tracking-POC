import * as React from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, ClipboardCheck, Plus } from "lucide-react";
import {
  Button,
  EmptyState,
  Skeleton,
  Status,
  SupportingEvidenceView,
} from "@attendance/ui";
import { formatDateTime } from "@attendance/utils";
import { useStudentCorrections } from "./hooks/use-student-corrections";

export default function StudentCorrectionsPage() {
  const navigate = useNavigate();
  const { items, loading } = useStudentCorrections();

  return (
    <div className="flex flex-col gap-6 py-2">
      <div className="flex items-center justify-between gap-2">
        <Button
          variant="ghost"
          size="sm"
          leadingIcon={<ArrowLeft />}
          onClick={() => navigate("/history")}
        >
          History
        </Button>
        <Button
          size="sm"
          leadingIcon={<Plus />}
          onClick={() => navigate("/corrections/new")}
        >
          New Request
        </Button>
      </div>

      <div>
        <h1 className="text-v2-xl font-bold tracking-tight text-v2-ink">My Correction Requests</h1>
        <p className="mt-1 text-v2-sm text-v2-ink-secondary">
          Track the status and reviewer notes of your submitted attendance corrections.
        </p>
      </div>

      {loading ? (
        <div className="flex flex-col gap-3">
          {Array.from({ length: 3 }).map((_, idx) => (
            <div key={idx} className="rounded-v2-lg bg-v2-surface p-5">
              <Skeleton className="h-24 w-full" />
            </div>
          ))}
        </div>
      ) : items.length === 0 ? (
        <EmptyState
          icon={<ClipboardCheck />}
          title="No correction requests submitted"
          description="You can submit a correction request for any finalized session entry."
          action={
            <Button leadingIcon={<Plus />} onClick={() => navigate("/corrections/new")}>
              Request Correction
            </Button>
          }
        />
      ) : (
        <div className="flex flex-col gap-3">
          {items.map((corr) => (
            <div key={corr.id} className="rounded-v2-lg bg-v2-surface p-5">
              <div className="flex flex-col gap-2.5">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-v2-mono text-v2-xs font-semibold text-v2-ink">
                    {corr.course_code} — {corr.session_title}
                  </span>
                  <Status value={corr.status} size="sm" />
                </div>
                <p className="text-v2-xs text-v2-ink-secondary">
                  Requested Status: <strong>{corr.requested_status.toUpperCase()}</strong> ·
                  Submitted {formatDateTime(corr.created_at)}
                </p>
                <p className="rounded-v2-md bg-v2-canvas p-3 text-v2-sm text-v2-ink">
                  "{corr.reason}"
                </p>
                {corr.supporting_note && (
                  <div className="pt-1">
                    <p className="mb-1.5 text-v2-xs font-medium text-v2-ink-secondary">
                      Supporting Evidence
                    </p>
                    <SupportingEvidenceView value={corr.supporting_note} />
                  </div>
                )}
                {corr.decision_note && (
                  <div className="border-t border-v2-line pt-2.5 text-v2-xs text-v2-ink-secondary">
                    <span className="font-semibold text-v2-ink">
                      Reviewer Note ({corr.reviewer_name ?? "Lecturer"}):
                    </span>{" "}
                    {corr.decision_note}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
