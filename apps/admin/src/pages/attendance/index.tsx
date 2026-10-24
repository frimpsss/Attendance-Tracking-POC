import * as React from "react";
import { useNavigate } from "react-router-dom";
import { Check, Edit3, Eye, X } from "lucide-react";
import {
  DateFilter,
  type DateFilterValue,
  EmptyState,
  PageHeader,
  Status,
  SupportingEvidenceView,
  Table,
  Tabs,
  toast,
  type TableBulkAction,
} from "@attendance/ui";
import { reviewCorrectionRequest, useAuth } from "@attendance/supabase";
import { formatDateTime } from "@attendance/utils";
import { OverrideAttendanceModal, type OverrideTarget } from "./components/override-modal";
import { useAttendanceExplorer } from "./hooks/use-attendance";

function toIsoDate(d: Date): string {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

export default function AttendancePage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const list = useAttendanceExplorer();
  const [tab, setTab] = React.useState("sessions");
  const [dateFilter, setDateFilter] = React.useState<DateFilterValue | undefined>(undefined);
  const [selectedSessions, setSelectedSessions] = React.useState<string[]>([]);
  const [selectedEntries, setSelectedEntries] = React.useState<string[]>([]);
  const [selectedCorrections, setSelectedCorrections] = React.useState<string[]>([]);
  const [overrideTarget, setOverrideTarget] = React.useState<OverrideTarget | null>(null);

  const courseOptions = list.courses.map((c) => ({
    value: c.id,
    label: `${c.code} — ${c.title}`,
  }));
  const deptOptions = list.departments.map((d) => ({
    value: d.id,
    label: `${d.code} — ${d.name}`,
  }));

  const handleBulkCorrectionDecision = async (
    keys: string[],
    decision: "approved" | "rejected",
  ) => {
    if (!user || keys.length === 0) return;
    const pending = list.corrections.filter(
      (c) => keys.includes(c.id) && c.status === "pending",
    );
    if (pending.length === 0) return;
    try {
      await Promise.all(
        pending.map((c) =>
          reviewCorrectionRequest({
            callerId: user.id,
            requestId: c.id,
            decision,
            decisionNote: decision === "approved" ? "Approved by Admin" : "Rejected by Admin",
          }),
        ),
      );
      toast.success(
        decision === "approved"
          ? `Approved ${pending.length} correction request(s)`
          : `Rejected ${pending.length} correction request(s)`,
      );
      setSelectedCorrections([]);
      await list.refetch();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to review correction");
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Attendance Monitor & Overrides"
        description="Inspect class sessions, verify entry sources (QR, code, manual, correction), and perform audited overrides."
        actions={
          <DateFilter
            value={dateFilter}
            defaultPreset="all_time"
            onChange={(next) => {
              setDateFilter(next);
              if (next.preset === "all_time") {
                list.setDateFrom("");
                list.setDateTo("");
              } else {
                list.setDateFrom(toIsoDate(next.from));
                list.setDateTo(toIsoDate(next.to));
              }
            }}
          />
        }
      />

      <Tabs
        value={tab}
        contentClassName="mt-8"
        onValueChange={(next) => {
          setTab(next);
          list.setPage(1);
          list.setStatuses([]);
          setSelectedSessions([]);
          setSelectedEntries([]);
          setSelectedCorrections([]);
        }}
        items={[
          {
            value: "sessions",
            label: "Sessions",
            count: list.sessionsTotal,
            content: (
              <div className="mt-4">
                <Table
                  loading={list.isPending}
                  refreshing={list.isFetching && !list.isPending}
                  data={list.sessions}
                  rowKey={(s) => s.id}
                  onRowClick={(s) => navigate(`/attendance/sessions/${s.id}`)}
                  selectedKeys={selectedSessions}
                  onSelectionChange={setSelectedSessions}
                  bulkNoun={["session", "sessions"]}
                  bulkActions={(keys): TableBulkAction[] => {
                    const single = keys.length === 1 ? keys[0] : null;
                    return single
                      ? [
                          {
                            label: "Inspect Session",
                            icon: <Eye />,
                            onClick: () => navigate(`/attendance/sessions/${single}`),
                          },
                        ]
                      : [];
                  }}
                  search={{
                    value: list.searchInput,
                    onChange: list.setSearchInput,
                    placeholder: "Search session title or course…",
                  }}
                  filters={[
                    {
                      key: "course",
                      label: "Course",
                      options: courseOptions,
                      value: list.courseIds,
                      onChange: list.setCourseIds,
                    },
                    {
                      key: "department",
                      label: "Department",
                      options: deptOptions,
                      value: list.departmentIds,
                      onChange: list.setDepartmentIds,
                    },
                    {
                      key: "status",
                      label: "Status",
                      options: [
                        { value: "scheduled", label: "Scheduled" },
                        { value: "open", label: "Open" },
                        { value: "closed", label: "Closed (Finalized)" },
                      ],
                      value: list.statuses,
                      onChange: list.setStatuses,
                    },
                  ]}
                  onRefresh={() => void list.refetch()}
                  pagination={{
                    page: list.page,
                    pageCount: Math.max(1, Math.ceil(list.sessionsTotal / list.pageSize)),
                    onPageChange: list.setPage,
                    pageSize: list.pageSize,
                    onPageSizeChange: list.setPageSize,
                    total: list.sessionsTotal,
                  }}
                  empty={<EmptyState size="sm" title="No attendance sessions found" />}
                  columns={[
                    {
                      key: "course",
                      header: "Course & Topic",
                      cell: (s) => (
                        <div>
                          <p className="font-semibold text-v2-ink">
                            {s.course_code} — {s.title}
                          </p>
                          <p className="text-v2-xs text-v2-ink-secondary">
                            {s.department_code} · Opened by {s.created_by_name ?? "Lecturer"}
                          </p>
                        </div>
                      ),
                    },
                    {
                      key: "scheduled",
                      header: "Scheduled",
                      cell: (s) => (
                        <span className="text-v2-sm text-v2-ink-secondary">
                          {formatDateTime(s.scheduled_at)}
                        </span>
                      ),
                    },
                    {
                      key: "counts",
                      header: "Present / Late / Absent",
                      cell: (s) => (
                        <span className="text-v2-sm text-v2-ink">
                          {s.present_count} P · {s.late_count} L · {s.absent_count} A (of{" "}
                          {s.enrolled_count})
                        </span>
                      ),
                    },
                    {
                      key: "status",
                      header: "Status",
                      align: "right",
                      cell: (s) => <Status value={s.status} size="sm" />,
                    },
                  ]}
                />
              </div>
            ),
          },
          {
            value: "entries",
            label: "Student Entries",
            count: list.entriesTotal,
            content: (
              <div className="mt-4">
                <Table
                  loading={list.isPending}
                  refreshing={list.isFetching && !list.isPending}
                  data={list.entries}
                  rowKey={(e) => e.id}
                  onRowClick={(e) =>
                    setOverrideTarget({
                      sessionId: e.session_id,
                      studentId: e.student_id,
                      studentName: e.student_name,
                      studentNumber: e.student_number,
                      currentStatus: e.status,
                    })
                  }
                  selectedKeys={selectedEntries}
                  onSelectionChange={setSelectedEntries}
                  bulkNoun={["entry", "entries"]}
                  bulkActions={(keys): TableBulkAction[] => {
                    const picked = list.entries.filter((e) => keys.includes(e.id));
                    const single = picked.length === 1 ? picked[0] : null;
                    return single
                      ? [
                          {
                            label: "Audited Override",
                            icon: <Edit3 />,
                            onClick: () =>
                              setOverrideTarget({
                                sessionId: single.session_id,
                                studentId: single.student_id,
                                studentName: single.student_name,
                                studentNumber: single.student_number,
                                currentStatus: single.status,
                              }),
                          },
                          {
                            label: "Inspect Session",
                            icon: <Eye />,
                            onClick: () =>
                              navigate(`/attendance/sessions/${single.session_id}`),
                          },
                        ]
                      : [];
                  }}
                  search={{
                    value: list.searchInput,
                    onChange: list.setSearchInput,
                    placeholder: "Search student name, ID, or course code…",
                  }}
                  filters={[
                    {
                      key: "course",
                      label: "Course",
                      options: courseOptions,
                      value: list.courseIds,
                      onChange: list.setCourseIds,
                    },
                    {
                      key: "status",
                      label: "Status",
                      options: [
                        { value: "present", label: "Present" },
                        { value: "late", label: "Late" },
                        { value: "absent", label: "Absent" },
                      ],
                      value: list.statuses,
                      onChange: list.setStatuses,
                    },
                  ]}
                  onRefresh={() => void list.refetch()}
                  pagination={{
                    page: list.page,
                    pageCount: Math.max(1, Math.ceil(list.entriesTotal / list.pageSize)),
                    onPageChange: list.setPage,
                    pageSize: list.pageSize,
                    onPageSizeChange: list.setPageSize,
                    total: list.entriesTotal,
                  }}
                  empty={<EmptyState size="sm" title="No attendance entries found" />}
                  columns={[
                    {
                      key: "student",
                      header: "Student",
                      cell: (e) => (
                        <div>
                          <p className="font-semibold text-v2-ink">{e.student_name}</p>
                          <p className="font-v2-mono text-v2-xs text-v2-ink-secondary">
                            {e.student_number}
                          </p>
                        </div>
                      ),
                    },
                    {
                      key: "session",
                      header: "Course & Session",
                      cell: (e) => (
                        <div>
                          <p className="font-semibold text-v2-ink">{e.course_code}</p>
                          <p className="text-v2-xs text-v2-ink-secondary">{e.session_title}</p>
                        </div>
                      ),
                    },
                    {
                      key: "source",
                      header: "Source",
                      cell: (e) => (
                        <Status value={e.source} label={e.source.toUpperCase()} size="sm" />
                      ),
                    },
                    {
                      key: "time",
                      header: "Checked In At",
                      cell: (e) => (
                        <span className="text-v2-xs text-v2-ink-secondary">
                          {formatDateTime(e.checked_in_at)}
                        </span>
                      ),
                    },
                    {
                      key: "status",
                      header: "Status",
                      align: "right",
                      cell: (e) => <Status value={e.status} size="sm" />,
                    },
                  ]}
                />
              </div>
            ),
          },
          {
            value: "corrections",
            label: "Correction Requests",
            count: list.correctionsTotal,
            content: (
              <div className="mt-4">
                <Table
                  loading={list.isPending}
                  refreshing={list.isFetching && !list.isPending}
                  data={list.corrections}
                  rowKey={(c) => c.id}
                  onRowClick={(c) => navigate(`/attendance/sessions/${c.session_id}`)}
                  selectedKeys={selectedCorrections}
                  onSelectionChange={setSelectedCorrections}
                  bulkNoun={["request", "requests"]}
                  bulkActions={(keys): TableBulkAction[] => {
                    const picked = list.corrections.filter((c) => keys.includes(c.id));
                    const anyPending = picked.some((c) => c.status === "pending");
                    const single = picked.length === 1 ? picked[0] : null;
                    return [
                      ...(single
                        ? [
                            {
                              label: "Inspect Session",
                              icon: <Eye />,
                              onClick: () =>
                                navigate(`/attendance/sessions/${single.session_id}`),
                            },
                          ]
                        : []),
                      ...(anyPending
                        ? [
                            {
                              label: "Approve",
                              icon: <Check />,
                              onClick: (k: string[]) =>
                                void handleBulkCorrectionDecision(k, "approved"),
                            },
                            {
                              label: "Reject",
                              icon: <X />,
                              tone: "danger" as const,
                              onClick: (k: string[]) =>
                                void handleBulkCorrectionDecision(k, "rejected"),
                            },
                          ]
                        : []),
                    ];
                  }}
                  search={{
                    value: list.searchInput,
                    onChange: list.setSearchInput,
                    placeholder: "Search student or reason…",
                  }}
                  onRefresh={() => void list.refetch()}
                  pagination={{
                    page: list.page,
                    pageCount: Math.max(1, Math.ceil(list.correctionsTotal / list.pageSize)),
                    onPageChange: list.setPage,
                    pageSize: list.pageSize,
                    onPageSizeChange: list.setPageSize,
                    total: list.correctionsTotal,
                  }}
                  empty={<EmptyState size="sm" title="No correction requests" />}
                  columns={[
                    {
                      key: "student",
                      header: "Student",
                      cell: (c) => (
                        <div>
                          <p className="font-semibold text-v2-ink">{c.student_name}</p>
                          <p className="text-v2-xs text-v2-ink-secondary">{c.student_number}</p>
                        </div>
                      ),
                    },
                    {
                      key: "course",
                      header: "Course & Session",
                      cell: (c) => (
                        <div>
                          <p className="font-semibold text-v2-ink">{c.course_code}</p>
                          <p className="text-v2-xs text-v2-ink-secondary">{c.session_title}</p>
                        </div>
                      ),
                    },
                    {
                      key: "change",
                      header: "Requested Change",
                      cell: (c) => (
                        <div className="flex items-center gap-1.5">
                          <Status value={c.current_entry_status} size="sm" />
                          <span className="text-v2-xs text-v2-ink-tertiary">→</span>
                          <Status value={c.requested_status} size="sm" />
                        </div>
                      ),
                    },
                    {
                      key: "reason",
                      header: "Reason & Evidence",
                      cell: (c) => (
                        <div className="flex max-w-sm flex-col gap-1.5">
                          <p className="text-v2-xs text-v2-ink-secondary">{c.reason}</p>
                          {c.supporting_note && (
                            <div onClick={(e) => e.stopPropagation()}>
                              <SupportingEvidenceView value={c.supporting_note} compact />
                            </div>
                          )}
                        </div>
                      ),
                    },
                    {
                      key: "status",
                      header: "Review Status",
                      align: "right",
                      cell: (c) => <Status value={c.status} size="sm" />,
                    },
                  ]}
                />
              </div>
            ),
          },
        ]}
      />

      <OverrideAttendanceModal
        target={overrideTarget}
        onOpenChange={(open) => !open && setOverrideTarget(null)}
        onSaved={() => void list.refetch()}
      />
    </div>
  );
}
