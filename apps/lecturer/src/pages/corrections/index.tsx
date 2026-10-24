import * as React from "react";
import { useNavigate } from "react-router-dom";
import { ChevronRight, ClipboardCheck } from "lucide-react";
import {
  EmptyState,
  FilterBar,
  Skeleton,
  Status,
} from "@attendance/ui";
import { formatDateTime } from "@attendance/utils";
import { useLecturerCorrectionsList } from "./hooks/use-lecturer-corrections";

export default function LecturerCorrectionsPage() {
  const navigate = useNavigate();
  const {
    items,
    loading,
    searchInput,
    setSearchInput,
    statuses,
    setStatuses,
  } = useLecturerCorrectionsList();

  return (
    <div className="flex flex-col gap-6 py-2">
      <div>
        <h1 className="text-v2-xl font-bold tracking-tight text-v2-ink">Correction Requests</h1>
        <p className="mt-1 text-v2-sm text-v2-ink-secondary">
          Review student attendance correction requests for your assigned courses.
        </p>
      </div>

      <FilterBar
        search={{
          value: searchInput,
          onChange: setSearchInput,
          placeholder: "Search student or reason…",
        }}
        filters={[
          {
            key: "status",
            label: "Status",
            options: [
              { value: "pending", label: "Pending" },
              { value: "approved", label: "Approved" },
              { value: "rejected", label: "Rejected" },
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

      {loading ? (
        <div className="flex flex-col gap-3">
          {Array.from({ length: 3 }).map((_, idx) => (
            <div key={idx} className="rounded-v2-lg bg-v2-surface p-5">
              <Skeleton className="h-20 w-full" />
            </div>
          ))}
        </div>
      ) : items.length === 0 ? (
        <EmptyState
          icon={<ClipboardCheck />}
          title="No correction requests"
          description="Requests submitted by students in your courses will appear here."
        />
      ) : (
        <div className="flex flex-col gap-3">
          {items.map((corr) => (
            <button
              key={corr.id}
              type="button"
              onClick={() => navigate(`/corrections/${corr.id}`)}
              className="flex w-full items-start justify-between gap-3 rounded-v2-lg bg-v2-surface p-4 text-left transition-colors hover:bg-v2-canvas/50"
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-v2-mono text-v2-xs font-semibold text-v2-ink">
                    {corr.course_code}
                  </span>
                  <Status value={corr.status} size="sm" />
                </div>
                <p className="mt-1 font-semibold text-v2-ink">
                  {corr.student_name} ({corr.student_number})
                </p>
                <p className="text-v2-xs text-v2-ink-secondary">
                  {corr.session_title} · Current: {corr.current_entry_status.toUpperCase()} →
                  Requested: {corr.requested_status.toUpperCase()}
                </p>
                <p className="mt-1.5 line-clamp-2 text-v2-sm text-v2-ink">
                  "{corr.reason}"
                </p>
                <p className="mt-1 text-v2-xs text-v2-ink-tertiary">
                  Submitted {formatDateTime(corr.created_at)}
                </p>
              </div>
              <ChevronRight className="mt-1 h-4 w-4 shrink-0 text-v2-ink-tertiary" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
