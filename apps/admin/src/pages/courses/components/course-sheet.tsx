import * as React from "react";
import { Button, Input, MultiSelect, Select, Sheet, SheetClose, Switch, toast } from "@attendance/ui";
import { saveCourse, type CourseSummaryRow, type LecturerSummaryRow } from "@attendance/supabase";
import type { AcademicPeriod, Department } from "@attendance/types";

export function CourseSheet({
  target,
  departments,
  periods,
  lecturers,
  onOpenChange,
  onSaved,
}: {
  target: { mode: "create" } | { mode: "edit"; course: CourseSummaryRow } | null;
  departments: Department[];
  periods: AcademicPeriod[];
  lecturers: LecturerSummaryRow[];
  onOpenChange: (open: boolean) => void;
  onSaved: () => void;
}) {
  const editing = target?.mode === "edit" ? target.course : null;
  const [code, setCode] = React.useState("");
  const [title, setTitle] = React.useState("");
  const [departmentId, setDepartmentId] = React.useState("");
  const [periodId, setPeriodId] = React.useState("");
  const [lecturerIds, setLecturerIds] = React.useState<string[]>([]);
  const [isActive, setIsActive] = React.useState(true);
  const [saving, setSaving] = React.useState(false);

  React.useEffect(() => {
    if (editing) {
      setCode(editing.code);
      setTitle(editing.title);
      setDepartmentId(editing.department_id);
      setPeriodId(editing.academic_period_id);
      setLecturerIds(editing.lecturer_ids);
      setIsActive(editing.is_active);
    } else {
      setCode("");
      setTitle("");
      setDepartmentId(departments[0]?.id ?? "");
      setPeriodId(periods[0]?.id ?? "");
      setLecturerIds([]);
      setIsActive(true);
    }
  }, [editing, target, departments, periods]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await saveCourse({
        id: editing?.id,
        code,
        title,
        department_id: departmentId,
        academic_period_id: periodId,
        is_active: isActive,
        lecturer_ids: lecturerIds,
      });
      toast.success(editing ? "Course updated" : "Course created");
      onOpenChange(false);
      onSaved();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save course");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Sheet
      open={Boolean(target)}
      onOpenChange={onOpenChange}
      title={editing ? "Edit Course" : "Create Course"}
      description="Configure course code, department, academic period, and assigned lecturers."
      footer={
        <>
          <SheetClose asChild>
            <Button variant="secondary" disabled={saving}>
              Cancel
            </Button>
          </SheetClose>
          <Button loading={saving} onClick={(e) => void submit(e)}>
            {editing ? "Save Changes" : "Create Course"}
          </Button>
        </>
      }
    >
      <form onSubmit={submit} className="flex flex-col gap-4">
        <Input
          label="Course Code"
          required
          placeholder="e.g. CS301"
          value={code}
          onChange={(e) => setCode(e.target.value)}
        />
        <Input
          label="Course Title"
          required
          placeholder="e.g. Software Engineering & Architecture"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
        <Select
          label="Department"
          required
          value={departmentId}
          onValueChange={setDepartmentId}
          options={departments.map((d) => ({
            value: d.id,
            label: `${d.code} — ${d.name}`,
          }))}
        />
        <Select
          label="Academic Period"
          required
          value={periodId}
          onValueChange={setPeriodId}
          options={periods.map((p) => ({
            value: p.id,
            label: p.name,
          }))}
        />
        <MultiSelect
          label="Assigned Lecturers"
          placeholder="Select one or more lecturers…"
          value={lecturerIds}
          onValueChange={setLecturerIds}
          options={lecturers.map((l) => ({
            value: l.user_id,
            label: `${l.full_name} (${l.staff_number})`,
          }))}
        />
        <Switch
          label="Active course"
          description="Archived courses retain all historical attendance records."
          checked={isActive}
          onCheckedChange={setIsActive}
        />
      </form>
    </Sheet>
  );
}
