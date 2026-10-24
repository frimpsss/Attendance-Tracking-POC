import * as React from "react";
import { Button, Input, Sheet, SheetClose, Switch, toast } from "@attendance/ui";
import { saveDepartment } from "@attendance/supabase";
import type { Department } from "@attendance/types";

export function DepartmentSheet({
  target,
  onOpenChange,
  onSaved,
}: {
  target: { mode: "create" } | { mode: "edit"; department: Department } | null;
  onOpenChange: (open: boolean) => void;
  onSaved: () => void;
}) {
  const editing = target?.mode === "edit" ? target.department : null;
  const [code, setCode] = React.useState("");
  const [name, setName] = React.useState("");
  const [isActive, setIsActive] = React.useState(true);
  const [saving, setSaving] = React.useState(false);

  React.useEffect(() => {
    if (editing) {
      setCode(editing.code);
      setName(editing.name);
      setIsActive(editing.is_active);
    } else {
      setCode("");
      setName("");
      setIsActive(true);
    }
  }, [editing, target]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await saveDepartment({
        id: editing?.id,
        code,
        name,
        is_active: isActive,
      });
      toast.success(editing ? "Department updated" : "Department created");
      onOpenChange(false);
      onSaved();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save department");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Sheet
      open={Boolean(target)}
      onOpenChange={onOpenChange}
      title={editing ? "Edit Department" : "New Department"}
      description="Departments group courses, faculty, and students."
      footer={
        <>
          <SheetClose asChild>
            <Button variant="secondary" disabled={saving}>
              Cancel
            </Button>
          </SheetClose>
          <Button loading={saving} onClick={(e) => void submit(e)}>
            {editing ? "Save Changes" : "Create Department"}
          </Button>
        </>
      }
    >
      <form onSubmit={submit} className="flex flex-col gap-4">
        <Input
          label="Department Code"
          required
          placeholder="e.g. CS"
          value={code}
          onChange={(e) => setCode(e.target.value)}
        />
        <Input
          label="Department Name"
          required
          placeholder="e.g. Computer Science & Engineering"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <Switch
          label="Active department"
          description="Archived departments remain linked to historical attendance records."
          checked={isActive}
          onCheckedChange={setIsActive}
        />
      </form>
    </Sheet>
  );
}
