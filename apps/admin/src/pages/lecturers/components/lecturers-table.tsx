import * as React from "react";
import { useNavigate } from "react-router-dom";
import { Eye, KeyRound, UserCheck, UserX } from "lucide-react";
import { Badge, EmptyState, Status, Table, toast, type TableBulkAction } from "@attendance/ui";
import { adminSetUserAccess, useAuth } from "@attendance/supabase";
import type { LecturersListState } from "../hooks/use-lecturers";
import { LECTURER_STATUS_OPTIONS } from "../utils/constants";

export function LecturersTable({
  list,
  actions,
}: {
  list: LecturersListState;
  actions?: React.ReactNode;
}) {
  const navigate = useNavigate();
  const { user, sendPasswordReset } = useAuth();
  const [selected, setSelected] = React.useState<string[]>([]);

  const handleBulkAccess = async (keys: string[], isActive: boolean) => {
    if (!user || keys.length === 0) return;
    try {
      await Promise.all(
        keys.map((lecturerId) =>
          adminSetUserAccess({
            actorId: user.id,
            targetUserId: lecturerId,
            isActive,
            reason: isActive ? "Reactivated by Admin" : "Deactivated by Admin",
          }),
        ),
      );
      toast.success(
        isActive
          ? `Reactivated ${keys.length} lecturer${keys.length === 1 ? "" : "s"}`
          : `Deactivated ${keys.length} lecturer${keys.length === 1 ? "" : "s"}`,
      );
      setSelected([]);
      await list.refetch();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update access");
    }
  };

  const bulkActions = (keys: string[]): TableBulkAction[] => {
    const picked = list.lecturers.filter((l) => keys.includes(l.user_id));
    const single = picked.length === 1 ? picked[0] : null;
    const anyActive = picked.some((l) => l.is_active);
    const anyInactive = picked.some((l) => !l.is_active);

    return [
      ...(single
        ? [
            {
              label: "View",
              icon: <Eye />,
              onClick: () => navigate(`/lecturers/${single.user_id}`),
            },
            {
              label: "Reset Password",
              icon: <KeyRound />,
              onClick: async () => {
                await sendPasswordReset(single.email);
                toast.success(`Password reset link sent to ${single.email}`);
                setSelected([]);
              },
            },
          ]
        : []),
      ...(anyInactive
        ? [
            {
              label: "Activate",
              icon: <UserCheck />,
              onClick: (k: string[]) => void handleBulkAccess(k, true),
            },
          ]
        : []),
      ...(anyActive
        ? [
            {
              label: "Deactivate",
              icon: <UserX />,
              tone: "danger" as const,
              onClick: (k: string[]) => void handleBulkAccess(k, false),
            },
          ]
        : []),
    ];
  };

  return (
    <Table
      loading={list.isPending}
      refreshing={list.isFetching && !list.isPending}
      data={list.lecturers}
      rowKey={(row) => row.user_id}
      onRowClick={(row) => navigate(`/lecturers/${row.user_id}`)}
      selectedKeys={selected}
      onSelectionChange={setSelected}
      bulkNoun={["lecturer", "lecturers"]}
      bulkActions={bulkActions}
      search={{
        value: list.searchInput,
        onChange: list.setSearchInput,
        placeholder: "Search Staff ID, name, or email…",
      }}
      filters={[
        {
          key: "department",
          label: "Department",
          options: list.departments.map((d) => ({
            value: d.id,
            label: `${d.code} — ${d.name}`,
          })),
          value: list.departmentIds,
          onChange: list.setDepartmentIds,
        },
        {
          key: "status",
          label: "Status",
          options: LECTURER_STATUS_OPTIONS,
          value: list.statuses,
          onChange: list.setStatuses,
        },
      ]}
      actions={actions}
      onRefresh={() => void list.refetch()}
      pagination={{
        page: list.page,
        pageCount: list.pageCount,
        onPageChange: list.setPage,
        pageSize: list.pageSize,
        onPageSizeChange: list.setPageSize,
        total: list.total,
      }}
      empty={
        <EmptyState
          size="sm"
          illustration="search"
          title="No lecturers found"
          description="Try another search query or create a lecturer account."
        />
      }
      columns={[
        {
          key: "staff_number",
          header: "Staff ID",
          cell: (row) => (
            <span className="font-v2-mono text-v2-sm font-semibold text-v2-ink">
              {row.staff_number}
            </span>
          ),
        },
        {
          key: "name",
          header: "Lecturer",
          cell: (row) => (
            <div>
              <p className="font-semibold text-v2-ink">{row.full_name}</p>
              <p className="text-v2-xs text-v2-ink-secondary">{row.email}</p>
            </div>
          ),
        },
        {
          key: "department",
          header: "Department",
          cell: (row) => (
            <span className="text-v2-sm text-v2-ink">
              {row.department_code} — {row.department_name}
            </span>
          ),
        },
        {
          key: "courses",
          header: "Assigned Courses",
          cell: (row) =>
            row.course_codes.length === 0 ? (
              <span className="text-v2-xs text-v2-ink-tertiary">Unassigned</span>
            ) : (
              <div className="flex flex-wrap gap-1.5">
                {row.course_codes.map((code) => (
                  <Badge key={code} tone="neutral" size="sm">
                    {code}
                  </Badge>
                ))}
              </div>
            ),
        },
        {
          key: "status",
          header: "Account",
          align: "right",
          cell: (row) => <Status value={row.is_active ? "active" : "inactive"} size="sm" />,
        },
      ]}
    />
  );
}
