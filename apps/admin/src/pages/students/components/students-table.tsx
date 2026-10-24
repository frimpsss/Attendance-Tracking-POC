import * as React from "react";
import { useNavigate } from "react-router-dom";
import { Eye, KeyRound, UserCheck, UserX } from "lucide-react";
import { EmptyState, Status, Table, toast, type TableBulkAction } from "@attendance/ui";
import { adminSetUserAccess, useAuth } from "@attendance/supabase";
import type { StudentsListState } from "../hooks/use-students";
import { ACCOUNT_STATUS_OPTIONS } from "../utils/constants";

export function StudentsTable({
  list,
  actions,
}: {
  list: StudentsListState;
  actions?: React.ReactNode;
}) {
  const navigate = useNavigate();
  const { user, sendPasswordReset } = useAuth();
  const [selected, setSelected] = React.useState<string[]>([]);

  const handleBulkAccess = async (keys: string[], isActive: boolean) => {
    if (!user || keys.length === 0) return;
    try {
      await Promise.all(
        keys.map((studentId) =>
          adminSetUserAccess({
            actorId: user.id,
            targetUserId: studentId,
            isActive,
            reason: isActive ? "Reactivated by Admin" : "Deactivated by Admin",
          }),
        ),
      );
      toast.success(
        isActive
          ? `Reactivated ${keys.length} student${keys.length === 1 ? "" : "s"}`
          : `Deactivated ${keys.length} student${keys.length === 1 ? "" : "s"}`,
      );
      setSelected([]);
      await list.refetch();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update access");
    }
  };

  const bulkActions = (keys: string[]): TableBulkAction[] => {
    const picked = list.students.filter((s) => keys.includes(s.user_id));
    const single = picked.length === 1 ? picked[0] : null;
    const anyActive = picked.some((s) => s.is_active);
    const anyInactive = picked.some((s) => !s.is_active);

    return [
      ...(single
        ? [
            {
              label: "View",
              icon: <Eye />,
              onClick: () => navigate(`/students/${single.user_id}`),
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
      data={list.students}
      rowKey={(row) => row.user_id}
      onRowClick={(row) => navigate(`/students/${row.user_id}`)}
      selectedKeys={selected}
      onSelectionChange={setSelected}
      bulkNoun={["student", "students"]}
      bulkActions={bulkActions}
      search={{
        value: list.searchInput,
        onChange: list.setSearchInput,
        placeholder: "Search Student ID, full name, or email…",
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
          options: ACCOUNT_STATUS_OPTIONS,
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
          title="No students found"
          description="Try another search query or create a student account."
        />
      }
      columns={[
        {
          key: "student_number",
          header: "Student ID",
          cell: (row) => (
            <span className="font-v2-mono text-v2-sm font-semibold text-v2-ink">
              {row.student_number}
            </span>
          ),
        },
        {
          key: "name",
          header: "Student",
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
          key: "level",
          header: "Level",
          cell: (row) => <span className="text-v2-sm text-v2-ink">Level {row.academic_level}</span>,
        },
        {
          key: "enrolled",
          header: "Courses",
          cell: (row) => (
            <span className="text-v2-sm text-v2-ink-secondary">
              {row.enrolled_courses_count} enrolled
            </span>
          ),
        },
        {
          key: "attendance",
          header: "Attendance Rate",
          cell: (row) => (
            <div className="flex items-center gap-2">
              <span className="font-semibold text-v2-ink">
                {row.attendance_percentage !== null ? `${row.attendance_percentage}%` : "N/A"}
              </span>
              {row.is_below_threshold && <Status value="absent" label="Low" size="sm" />}
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
