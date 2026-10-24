import * as React from "react";
import { Button, DatePicker, Input, Sheet, SheetClose, Switch, toast } from "@attendance/ui";
import { saveAcademicPeriod } from "@attendance/supabase";
import type { AcademicPeriod } from "@attendance/types";

function parseIsoDate(iso: string): Date | undefined {
  if (!iso) return undefined;
  const d = new Date(`${iso}T00:00:00`);
  return Number.isNaN(d.getTime()) ? undefined : d;
}

function toIsoDate(d: Date | undefined): string {
  if (!d) return "";
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

export function PeriodSheet({
  target,
  onOpenChange,
  onSaved,
}: {
  target: { mode: "create" } | { mode: "edit"; period: AcademicPeriod } | null;
  onOpenChange: (open: boolean) => void;
  onSaved: () => void;
}) {
  const editing = target?.mode === "edit" ? target.period : null;
  const [name, setName] = React.useState("");
  const [startDate, setStartDate] = React.useState("2026-09-01");
  const [endDate, setEndDate] = React.useState("2027-01-31");
  const [isActive, setIsActive] = React.useState(true);
  const [saving, setSaving] = React.useState(false);

  React.useEffect(() => {
    if (editing) {
      setName(editing.name);
      setStartDate(editing.start_date);
      setEndDate(editing.end_date);
      setIsActive(editing.is_active);
    } else {
      setName("");
      setStartDate("2026-09-01");
      setEndDate("2027-01-31");
      setIsActive(true);
    }
  }, [editing, target]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (endDate < startDate) {
      toast.error("End date must be on or after start date");
      return;
    }
    setSaving(true);
    try {
      await saveAcademicPeriod({
        id: editing?.id,
        name,
        start_date: startDate,
        end_date: endDate,
        is_active: isActive,
      });
      toast.success(editing ? "Academic period updated" : "Academic period created");
      onOpenChange(false);
      onSaved();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save academic period");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Sheet
      open={Boolean(target)}
      onOpenChange={onOpenChange}
      title={editing ? "Edit Academic Period" : "New Academic Period"}
      description="Define semester start and end dates."
      footer={
        <>
          <SheetClose asChild>
            <Button variant="secondary" disabled={saving}>
              Cancel
            </Button>
          </SheetClose>
          <Button loading={saving} onClick={(e) => void submit(e)}>
            {editing ? "Save Changes" : "Create Period"}
          </Button>
        </>
      }
    >
      <form onSubmit={submit} className="flex flex-col gap-4">
        <Input
          label="Period / Semester Name"
          required
          placeholder="e.g. 2026/2027 — Semester 2"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <DatePicker
          label="Start Date"
          required
          value={parseIsoDate(startDate)}
          onChange={(d) => d && setStartDate(toIsoDate(d))}
        />
        <DatePicker
          label="End Date"
          required
          minDate={parseIsoDate(startDate)}
          value={parseIsoDate(endDate)}
          onChange={(d) => d && setEndDate(toIsoDate(d))}
        />
        <Switch label="Active semester" checked={isActive} onCheckedChange={setIsActive} />
      </form>
    </Sheet>
  );
}
