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
import { saveAcademicPeriod } from "@attendance/supabase";
import type { AcademicPeriod } from "@attendance/types";
import { formatDateShort } from "@attendance/utils";
import { PeriodSheet } from "./components/period-sheet";
import { usePeriods } from "./hooks/use-periods";

export default function PeriodsPage() {
  const list = usePeriods();
  const [selected, setSelected] = React.useState<string[]>([]);
  const [target, setTarget] = React.useState<
    { mode: "create" } | { mode: "edit"; period: AcademicPeriod } | null
  >(null);

  const handleBulkStatus = async (keys: string[], isActive: boolean) => {
    const picked = list.items.filter((p) => keys.includes(p.id));
    if (picked.length === 0) return;
    try {
      await Promise.all(
        picked.map((p) =>
          saveAcademicPeriod({
            id: p.id,
            name: p.name,
            start_date: p.start_date,
            end_date: p.end_date,
            is_active: isActive,
          }),
        ),
      );
      toast.success(isActive ? "Academic period(s) activated" : "Academic period(s) archived");
      setSelected([]);
      await list.refetch();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update academic period");
    }
  };

  const bulkActions = (keys: string[]): TableBulkAction[] => {
    const picked = list.items.filter((p) => keys.includes(p.id));
    const single = picked.length === 1 ? picked[0] : null;
    const anyActive = picked.some((p) => p.is_active);
    const anyArchived = picked.some((p) => !p.is_active);

    return [
      ...(single
        ? [
            {
              label: "Edit",
              icon: <Pencil />,
              onClick: () => setTarget({ mode: "edit", period: single }),
            },
          ]
        : []),
      ...(anyArchived
        ? [
            {
              label: "Set Active",
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
        title="Academic Periods"
        description="Manage academic years and semesters for course scheduling."
      />

      <Table
        loading={list.isPending}
        refreshing={list.isFetching && !list.isPending}
        data={list.items}
        rowKey={(p) => p.id}
        onRowClick={(p) => setTarget({ mode: "edit", period: p })}
        selectedKeys={selected}
        onSelectionChange={setSelected}
        bulkNoun={["period", "periods"]}
        bulkActions={bulkActions}
        search={{
          value: list.searchInput,
          onChange: list.setSearchInput,
          placeholder: "Search academic period…",
        }}
        actions={
          <Button
            variant="ghost"
            size="sm"
            leadingIcon={<Plus />}
            onClick={() => setTarget({ mode: "create" })}
          >
            New Period
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
        empty={<EmptyState size="sm" title="No academic periods" />}
        columns={[
          {
            key: "name",
            header: "Semester / Period",
            cell: (p) => <span className="font-semibold text-v2-ink">{p.name}</span>,
          },
          {
            key: "start",
            header: "Start Date",
            cell: (p) => <span className="text-v2-sm">{formatDateShort(p.start_date)}</span>,
          },
          {
            key: "end",
            header: "End Date",
            cell: (p) => <span className="text-v2-sm">{formatDateShort(p.end_date)}</span>,
          },
          {
            key: "status",
            header: "Status",
            align: "right",
            cell: (p) => <Status value={p.is_active ? "active" : "archived"} size="sm" />,
          },
        ]}
      />

      <PeriodSheet
        target={target}
        onOpenChange={(open) => !open && setTarget(null)}
        onSaved={() => void list.refetch()}
      />
    </div>
  );
}
