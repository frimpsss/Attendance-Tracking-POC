import * as React from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Archive, Eye, Pencil, Plus } from "lucide-react";
import {
  Button,
  EmptyState,
  PageHeader,
  Status,
  Table,
  toast,
  type TableBulkAction,
} from "@attendance/ui";
import { saveCourse, type CourseSummaryRow } from "@attendance/supabase";
import { CourseSheet } from "./components/course-sheet";
import { useCourses } from "./hooks/use-courses";

export default function CoursesPage() {
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const list = useCourses();
  const [selected, setSelected] = React.useState<string[]>([]);

  const [target, setTarget] = React.useState<
    { mode: "create" } | { mode: "edit"; course: CourseSummaryRow } | null
  >(() => (params.get("action") === "create" ? { mode: "create" } : null));

  const handleBulkStatus = async (keys: string[], isActive: boolean) => {
    const picked = list.courses.filter((c) => keys.includes(c.id));
    if (picked.length === 0) return;
    try {
      await Promise.all(
        picked.map((c) =>
          saveCourse({
            id: c.id,
            code: c.code,
            title: c.title,
            department_id: c.department_id,
            academic_period_id: c.academic_period_id,
            is_active: isActive,
          }),
        ),
      );
      toast.success(isActive ? "Course(s) restored" : "Course(s) archived");
      setSelected([]);
      await list.refetch();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update course");
    }
  };

  const bulkActions = (keys: string[]): TableBulkAction[] => {
    const picked = list.courses.filter((c) => keys.includes(c.id));
    const single = picked.length === 1 ? picked[0] : null;
    const anyActive = picked.some((c) => c.is_active);
    const anyArchived = picked.some((c) => !c.is_active);

    return [
      ...(single
        ? [
            {
              label: "View",
              icon: <Eye />,
              onClick: () => navigate(`/courses/${single.id}`),
            },
            {
              label: "Edit",
              icon: <Pencil />,
              onClick: () => setTarget({ mode: "edit", course: single }),
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
        title="Courses & Enrollments"
        description="Manage courses, assign lecturers, and enroll students in bulk or individually."
      />

      <Table
        loading={list.isPending}
        refreshing={list.isFetching && !list.isPending}
        data={list.courses}
        rowKey={(c) => c.id}
        onRowClick={(c) => navigate(`/courses/${c.id}`)}
        selectedKeys={selected}
        onSelectionChange={setSelected}
        bulkNoun={["course", "courses"]}
        bulkActions={bulkActions}
        search={{
          value: list.searchInput,
          onChange: list.setSearchInput,
          placeholder: "Search course code or title…",
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
            key: "period",
            label: "Academic Period",
            options: list.periods.map((p) => ({
              value: p.id,
              label: p.name,
            })),
            value: list.periodIds,
            onChange: list.setPeriodIds,
          },
        ]}
        actions={
          <Button
            variant="ghost"
            size="sm"
            leadingIcon={<Plus />}
            onClick={() => setTarget({ mode: "create" })}
          >
            New Course
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
        empty={<EmptyState size="sm" title="No courses found" />}
        columns={[
          {
            key: "code",
            header: "Code",
            cell: (c) => (
              <span className="font-v2-mono text-v2-sm font-semibold text-v2-ink">{c.code}</span>
            ),
          },
          {
            key: "title",
            header: "Course Title",
            cell: (c) => (
              <div>
                <p className="font-semibold text-v2-ink">{c.title}</p>
                <p className="text-v2-xs text-v2-ink-secondary">
                  {c.department_code} · {c.academic_period_name}
                </p>
              </div>
            ),
          },
          {
            key: "lecturers",
            header: "Assigned Lecturers",
            cell: (c) =>
              c.lecturer_names.length > 0 ? (
                <span className="text-v2-sm text-v2-ink">{c.lecturer_names.join(", ")}</span>
              ) : (
                <span className="text-v2-xs text-v2-ink-tertiary">Unassigned</span>
              ),
          },
          {
            key: "enrolled",
            header: "Enrolled",
            cell: (c) => (
              <span className="text-v2-sm text-v2-ink-secondary">
                {c.enrolled_students_count} students
              </span>
            ),
          },
          {
            key: "attendance",
            header: "Avg Attendance",
            cell: (c) => (
              <span className="font-semibold text-v2-ink">
                {c.attendance_percentage !== null ? `${c.attendance_percentage}%` : "N/A"}
              </span>
            ),
          },
          {
            key: "status",
            header: "Status",
            align: "right",
            cell: (c) => <Status value={c.is_active ? "active" : "archived"} size="sm" />,
          },
        ]}
      />

      <CourseSheet
        target={target}
        departments={list.departments}
        periods={list.periods}
        lecturers={list.lecturers}
        onOpenChange={(open) => {
          if (!open) {
            setTarget(null);
            setParams({});
          }
        }}
        onSaved={() => void list.refetch()}
      />
    </div>
  );
}
