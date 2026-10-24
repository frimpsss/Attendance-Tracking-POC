import * as React from "react";
import { Archive, Pencil, Plus } from "lucide-react";
import {
  Button,
  EmptyState,
  PageHeader,
  Status,
  Table,
  toast,
  type TableBulkAction,
} from "@attendance/ui";
import { saveDepartment } from "@attendance/supabase";
import type { Department } from "@attendance/types";
import { DepartmentSheet } from "./components/department-sheet";
import { useDepartments } from "./hooks/use-departments";

export default function DepartmentsPage() {
  const list = useDepartments();
  const [selected, setSelected] = React.useState<string[]>([]);
  const [target, setTarget] = React.useState<
    { mode: "create" } | { mode: "edit"; department: Department } | null
  >(null);

  const handleBulkStatus = async (keys: string[], isActive: boolean) => {
    const picked = list.items.filter((d) => keys.includes(d.id));
    if (picked.length === 0) return;
    try {
      await Promise.all(
        picked.map((d) =>
          saveDepartment({
            id: d.id,
            code: d.code,
            name: d.name,
            is_active: isActive,
          }),
        ),
      );
      toast.success(isActive ? "Department(s) restored" : "Department(s) archived");
      setSelected([]);
      await list.refetch();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update department");
    }
  };

  const bulkActions = (keys: string[]): TableBulkAction[] => {
    const picked = list.items.filter((d) => keys.includes(d.id));
    const single = picked.length === 1 ? picked[0] : null;
    const anyActive = picked.some((d) => d.is_active);
    const anyArchived = picked.some((d) => !d.is_active);

    return [
      ...(single
        ? [
            {
              label: "Edit",
              icon: <Pencil />,
              onClick: () => setTarget({ mode: "edit", department: single }),
            },
          ]
        : []),
      ...(anyArchived
        ? [
            {
              label: "Restore",
              icon: <Archive />,
              onClick: (k: string[]) => void handleBulkStatus(k, true),
            },
          ]
        : []),
      ...(anyActive
        ? [
            {
              label: "Archive",
              icon: <Archive />,
              tone: "danger" as const,
              onClick: (k: string[]) => void handleBulkStatus(k, false),
            },
          ]
        : []),
    ];
  };

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Departments"
        description="Manage academic departments and unique department codes."
      />

      <Table
        loading={list.isPending}
        refreshing={list.isFetching && !list.isPending}
        data={list.items}
        rowKey={(d) => d.id}
        onRowClick={(d) => setTarget({ mode: "edit", department: d })}
        selectedKeys={selected}
        onSelectionChange={setSelected}
        bulkNoun={["department", "departments"]}
        bulkActions={bulkActions}
        search={{
          value: list.searchInput,
          onChange: list.setSearchInput,
          placeholder: "Search department code or name…",
        }}
        actions={
          <Button
            variant="ghost"
            size="sm"
            leadingIcon={<Plus />}
            onClick={() => setTarget({ mode: "create" })}
          >
            New Department
          </Button>
        }
        onRefresh={() => void list.refetch()}
        pagination={{
          page: list.page,
          pageCount: list.pageCount,
          onPageChange: list.setPage,
          pageSize: list.pageSize,
          onPageSizeChange: list.setPageSize,
          total: list.total,
        }}
        empty={<EmptyState size="sm" title="No departments" />}
        columns={[
          {
            key: "code",
            header: "Code",
            cell: (d) => (
              <span className="font-v2-mono text-v2-sm font-semibold text-v2-ink">{d.code}</span>
            ),
          },
          {
            key: "name",
            header: "Department Name",
            cell: (d) => <span className="font-semibold text-v2-ink">{d.name}</span>,
          },
          {
            key: "status",
            header: "Status",
            align: "right",
            cell: (d) => <Status value={d.is_active ? "active" : "archived"} size="sm" />,
          },
        ]}
      />

      <DepartmentSheet
        target={target}
        onOpenChange={(open) => !open && setTarget(null)}
        onSaved={() => void list.refetch()}
      />
    </div>
  );
}
