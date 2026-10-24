import * as React from "react";
import { Badge, EmptyState, PageHeader, Table } from "@attendance/ui";
import { formatDateTime } from "@attendance/utils";
import { useAuditLogs } from "./hooks/use-audit-logs";

export default function AuditLogsPage() {
  const {
    items,
    total,
    loading,
    searchInput,
    setSearchInput,
    entityTypes,
    setEntityTypes,
    page,
    setPage,
    pageSize,
    setPageSize,
    pageCount,
    refetch,
  } = useAuditLogs();

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Audit Logs"
        description="Immutable audit trail of privileged attendance overrides, session finalizations, correction reviews, and role changes."
      />

      <Table
        loading={loading}
        data={items}
        rowKey={(a) => a.id}
        search={{
          value: searchInput,
          onChange: setSearchInput,
          placeholder: "Search action, actor, or reason…",
        }}
        filters={[
          {
            key: "entity_type",
            label: "Entity Type",
            options: [
              { value: "attendance_entry", label: "Attendance Entry" },
              { value: "attendance_session", label: "Attendance Session" },
              { value: "correction_request", label: "Correction Request" },
              { value: "profile", label: "User Profile / Role" },
              { value: "system_settings", label: "System Settings" },
            ],
            value: entityTypes,
            onChange: setEntityTypes,
          },
        ]}
        onRefresh={() => void refetch()}
        pagination={{
          page,
          pageCount,
          onPageChange: setPage,
          pageSize,
          onPageSizeChange: setPageSize,
          total,
        }}
        empty={<EmptyState size="sm" title="No audit logs recorded" />}
        columns={[
          {
            key: "time",
            header: "Timestamp",
            cell: (a) => (
              <span className="text-v2-xs text-v2-ink-secondary">
                {formatDateTime(a.created_at)}
              </span>
            ),
          },
          {
            key: "actor",
            header: "Actor",
            cell: (a) => (
              <div>
                <p className="font-semibold text-v2-ink">{a.actor_name ?? "System"}</p>
                {a.actor_email && (
                  <p className="text-v2-xs text-v2-ink-secondary">{a.actor_email}</p>
                )}
              </div>
            ),
          },
          {
            key: "action",
            header: "Action",
            cell: (a) => (
              <Badge tone="neutral" size="sm">
                {a.action.replace(/_/g, " ")}
              </Badge>
            ),
          },
          {
            key: "reason",
            header: "Reason",
            cell: (a) => <span className="text-v2-sm text-v2-ink">{a.reason ?? "—"}</span>,
          },
          {
            key: "diff",
            header: "Change Details",
            cell: (a) => (
              <span className="font-v2-mono text-v2-xs text-v2-ink-secondary">
                {a.old_data ? `${JSON.stringify(a.old_data)} → ` : ""}
                {a.new_data ? JSON.stringify(a.new_data) : "—"}
              </span>
            ),
          },
        ]}
      />
    </div>
  );
}
