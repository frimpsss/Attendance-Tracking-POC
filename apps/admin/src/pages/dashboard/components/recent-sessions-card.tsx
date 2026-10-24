import { useNavigate } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { Button, Card, Status, Table } from "@attendance/ui";
import type { SessionSummaryRow } from "@attendance/supabase";
import { formatDateTime } from "@attendance/utils";

export function RecentSessionsCard({
  sessions,
  loading,
  timezone,
}: {
  sessions: SessionSummaryRow[];
  loading: boolean;
  timezone: string;
}) {
  const navigate = useNavigate();

  return (
    <Card
      variant="plain"
      title="Recent Attendance Sessions"
      description="Latest scheduled, open, and finalized class sessions"
      actions={
        <Button
          variant="ghost"
          size="sm"
          trailingIcon={<ArrowRight />}
          onClick={() => navigate("/attendance")}
        >
          View All
        </Button>
      }
    >
      <Table
        loading={loading}
        data={sessions}
        rowKey={(row) => row.id}
        onRowClick={(row) => navigate(`/attendance/sessions/${row.id}`)}
        columns={[
          {
            key: "course",
            header: "Course & Session",
            cell: (row) => (
              <div>
                <p className="font-semibold text-v2-ink">
                  {row.course_code} — {row.title}
                </p>
                <p className="text-v2-xs text-v2-ink-secondary">{row.course_title}</p>
              </div>
            ),
          },
          {
            key: "date",
            header: "Scheduled",
            cell: (row) => (
              <span className="text-v2-sm text-v2-ink-secondary">
                {formatDateTime(row.scheduled_at, timezone)}
              </span>
            ),
          },
          {
            key: "checked",
            header: "Attendance",
            cell: (row) => (
              <span className="text-v2-sm tabular-nums text-v2-ink">
                {row.checked_in_count} / {row.enrolled_count} checked in
              </span>
            ),
          },
          {
            key: "status",
            header: "Status",
            align: "right",
            cell: (row) => <Status value={row.status} size="sm" />,
          },
        ]}
      />
    </Card>
  );
}
