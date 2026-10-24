import * as React from "react";
import { useNavigate } from "react-router-dom";
import { Plus, QrCode } from "lucide-react";
import {
  Button,
  DateFilter,
  type DateFilterValue,
  EmptyState,
  FilterBar,
  Pagination,
  Skeleton,
  Status,
} from "@attendance/ui";
import { formatDateTime } from "@attendance/utils";
import { useLecturerSessionsList } from "./hooks/use-lecturer-sessions";

function toIsoDate(d: Date): string {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

export default function LecturerSessionsPage() {
  const navigate = useNavigate();
  const {
    items,
    loading,
    searchInput,
    setSearchInput,
    statuses,
    setStatuses,
    setDateFrom,
    setDateTo,
    page,
    setPage,
    pageCount,
  } = useLecturerSessionsList();
  const [dateFilter, setDateFilter] = React.useState<DateFilterValue | undefined>(undefined);

  return (
    <div className="flex flex-col gap-6 py-2">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-v2-2xl font-semibold text-v2-ink">Attendance Sessions</h1>
          <p className="mt-0.5 text-v2-sm text-v2-ink-secondary">
            Manage open check-in windows, finalize classes, and inspect session reports.
          </p>
        </div>
        <Button
          size="sm"
          leadingIcon={<Plus />}
          onClick={() => navigate("/sessions/new")}
        >
          Open Session
        </Button>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2.5">
        <FilterBar
          className="flex-1"
          search={{
            value: searchInput,
            onChange: setSearchInput,
            placeholder: "Search course code or session title…",
          }}
          filters={[
            {
              key: "status",
              label: "Status",
              options: [
                { value: "open", label: "Open" },
                { value: "closed", label: "Closed / Finalized" },
                { value: "scheduled", label: "Scheduled" },
              ],
              value: statuses,
              onChange: setStatuses,
            },
          ]}
          onReset={() => {
            setSearchInput("");
            setStatuses([]);
          }}
        />
        <DateFilter
          value={dateFilter}
          defaultPreset="all_time"
          onChange={(next) => {
            setDateFilter(next);
            if (next.preset === "all_time") {
              setDateFrom("");
              setDateTo("");
            } else {
              setDateFrom(toIsoDate(next.from));
              setDateTo(toIsoDate(next.to));
            }
          }}
        />
      </div>

      {loading ? (
        <div className="flex flex-col gap-3">
          <Skeleton className="h-36" />
          <Skeleton className="h-36" />
          <Skeleton className="h-36" />
        </div>
      ) : items.length === 0 ? (
        <EmptyState
          icon={<QrCode />}
          title="No attendance sessions found"
          description="Open a class session to generate a live QR code and check-in code."
          action={
            <Button leadingIcon={<Plus />} onClick={() => navigate("/sessions/new")}>
              Start Attendance Session
            </Button>
          }
        />
      ) : (
        <div className="flex flex-col gap-3.5">
          {items.map((sess) => (
            <div key={sess.id} className="flex flex-col gap-4 rounded-v2-md bg-v2-surface p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-v2-mono text-v2-sm font-semibold text-v2-ink">
                      {sess.course_code}
                    </span>
                    <Status value={sess.status} size="sm" />
                  </div>
                  <h2 className="mt-1 text-v2-md font-semibold text-v2-ink">{sess.title}</h2>
                  <p className="mt-0.5 text-v2-xs text-v2-ink-secondary">
                    {formatDateTime(sess.scheduled_at)}
                  </p>
                </div>
                <span className="shrink-0 text-v2-sm font-semibold tabular-nums text-v2-ink">
                  {sess.present_count + sess.late_count} / {sess.enrolled_count}
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-4 text-v2-xs text-v2-ink-secondary tabular-nums">
                <span>
                  Present: <strong className="text-v2-ink">{sess.present_count}</strong>
                </span>
                <span>
                  Late: <strong className="text-v2-ink">{sess.late_count}</strong>
                </span>
                <span>
                  Absent: <strong className="text-v2-ink">{sess.absent_count}</strong>
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <Button
                  variant={sess.status === "open" ? "primary" : "secondary"}
                  size="sm"
                  onClick={() => navigate(`/sessions/${sess.id}`)}
                >
                  {sess.status === "open" ? "Live QR & Roster" : "Session Details"}
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => navigate(`/sessions/${sess.id}/report`)}
                >
                  Report & Export
                </Button>
              </div>
            </div>
          ))}

          {pageCount > 1 && (
            <Pagination page={page} pageCount={pageCount} onPageChange={setPage} />
          )}
        </div>
      )}
    </div>
  );
}
