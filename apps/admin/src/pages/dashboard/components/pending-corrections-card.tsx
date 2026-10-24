import { useNavigate } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { Badge, Button, Card, Status } from "@attendance/ui";
import type { DetailedCorrectionRow } from "@attendance/supabase";
import { formatDateTime } from "@attendance/utils";

export function PendingCorrectionsCard({
  corrections,
  timezone,
}: {
  corrections: DetailedCorrectionRow[];
  timezone: string;
}) {
  const navigate = useNavigate();

  return (
    <Card
      variant="plain"
      title="Pending Correction Requests"
      description="Student attendance disputes awaiting lecturer or admin review"
      actions={
        <div className="flex items-center gap-2">
          <Badge tone="warning">{corrections.length} pending</Badge>
          <Button
            variant="ghost"
            size="sm"
            trailingIcon={<ArrowRight />}
            onClick={() => navigate("/attendance")}
          >
            Review All
          </Button>
        </div>
      }
    >
      <div className="flex flex-col divide-y divide-v2-line">
        {corrections.map((req) => (
          <div
            key={req.id}
            onClick={() => navigate(`/attendance/sessions/${req.session_id}`)}
            className="-mx-2 flex cursor-pointer flex-col gap-1.5 rounded-v2-sm px-2 py-3.5 transition-colors duration-v2-fast first:pt-1 last:pb-1 hover:bg-v2-surface sm:flex-row sm:items-center sm:justify-between"
          >
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-v2-base font-semibold text-v2-ink">
                  {req.student_name}
                </span>
                <span className="font-v2-mono text-v2-xs text-v2-ink-tertiary">
                  {req.course_code}
                </span>
                <span className="text-v2-xs text-v2-ink-tertiary">
                  · {formatDateTime(req.created_at, timezone)}
                </span>
              </div>
              <p className="mt-0.5 text-v2-sm text-v2-ink-secondary">{req.reason}</p>
            </div>
            <div className="flex shrink-0 items-center gap-1.5">
              <Status value={req.current_entry_status} size="sm" />
              <span className="text-v2-xs text-v2-ink-tertiary">→</span>
              <Status value={req.requested_status} size="sm" />
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}
