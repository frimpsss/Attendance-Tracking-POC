import * as React from "react";
import { useNavigate } from "react-router-dom";
import { ClipboardCheck, FileEdit, History } from "lucide-react";
import {
  Button,
  DateFilter,
  type DateFilterValue,
  EmptyState,
  FilterBar,
  Pagination,
  Skeleton,
  StatCards,
  Status,
} from "@attendance/ui";
import { formatDateTime } from "@attendance/utils";
import { useStudentHistory } from "./hooks/use-student-history";

function toIsoDate(d: Date): string {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

export default function StudentHistoryPage() {
  const navigate = useNavigate();
  const {
    student,
    courses,
    items,
    loading,
    searchInput,
    setSearchInput,
    courseIds,
    setCourseIds,
    statuses,
    setStatuses,
    setDateFrom,
    setDateTo,
    page,
    setPage,
    pageCount,
  } = useStudentHistory();

  const [dateFilter, setDateFilter] = React.useState<DateFilterValue | undefined>(
    undefined,
  );

  return (
    <div className="flex flex-col gap-6 py-2">
      <div className="flex items-center justify-between gap-2">
        <div>
          <h1 className="text-v2-xl font-bold tracking-tight text-v2-ink">Attendance History</h1>
          <p className="mt-1 text-v2-sm text-v2-ink-secondary">
            Review your finalized session records and submit correction requests.
          </p>
        </div>
        <Button
          variant="secondary"
          size="sm"
          leadingIcon={<ClipboardCheck />}
          onClick={() => navigate("/corrections")}
        >
          My Corrections
        </Button>
      </div>

      {student && (
        <StatCards
          columns={2}
          items={[
            {
              label: "Overall Rate",
              value: `${student.attendance_percentage}%`,
              caption: `${student.attended_count}/${student.eligible_sessions} attended`,
            },
            {
              label: "Summary",
              value: `${student.present_count} P · ${student.late_count} L · ${student.absent_count} A`,
              caption: "Present / Late / Absent",
            },
          ]}
        />
      )}

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
              key: "course",
              label: "Course",
              options: courses.map((c) => ({
                value: c.course_id,
                label: `${c.course_code} — ${c.course_title}`,
              })),
              value: courseIds,
              onChange: setCourseIds,
            },
            {
              key: "status",
              label: "Status",
              options: [
                { value: "present", label: "Present" },
                { value: "late", label: "Late" },
                { value: "absent", label: "Absent" },
              ],
              value: statuses,
              onChange: setStatuses,
            },
          ]}
          onReset={() => {
            setSearchInput("");
            setCourseIds([]);
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
          {Array.from({ length: 4 }).map((_, idx) => (
            <div key={idx} className="rounded-v2-lg bg-v2-surface p-5">
              <Skeleton className="h-20 w-full" />
            </div>
          ))}
        </div>
      ) : items.length === 0 ? (
        <EmptyState
          icon={<History />}
          title="No attendance entries found"
          description="Your check-in records and finalized sessions will appear here."
        />
      ) : (
        <div className="flex flex-col gap-3">
          {items.map((ent) => (
            <div key={ent.id} className="rounded-v2-lg bg-v2-surface p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-v2-mono text-v2-xs font-semibold text-v2-ink">
                      {ent.course_code}
                    </span>
                    <Status value={ent.status} size="sm" />
                  </div>
                  <p className="mt-1 font-semibold text-v2-ink">{ent.session_title}</p>
                  <p className="mt-0.5 text-v2-xs text-v2-ink-secondary">
                    Scheduled {formatDateTime(ent.session_scheduled_at)} · Source:{" "}
                    {ent.source.toUpperCase()}
                  </p>
                  {ent.checked_in_at && (
                    <p className="mt-0.5 text-v2-xs text-v2-ink-tertiary">
                      Checked in: {formatDateTime(ent.checked_in_at)}
                    </p>
                  )}
                </div>

                {ent.session_status === "closed" && ent.status !== "present" && (
                  <Button
                    variant="secondary"
                    size="sm"
                    leadingIcon={<FileEdit />}
                    onClick={() => navigate(`/corrections/new?entryId=${ent.id}`)}
                  >
                    Request Correction
                  </Button>
                )}
              </div>
            </div>
          ))}

          {pageCount > 1 && (
            <Pagination
              page={page}
              pageCount={pageCount}
              onPageChange={setPage}
            />
          )}
        </div>
      )}
    </div>
  );
}
