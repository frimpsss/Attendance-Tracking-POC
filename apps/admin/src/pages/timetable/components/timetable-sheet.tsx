import * as React from "react";
import { Trash2 } from "lucide-react";
import { Button, DatePicker, Input, Select, Sheet, SheetClose, toast } from "@attendance/ui";
import {
  deleteTimetableEntry,
  saveTimetableEntry,
  type CourseSummaryRow,
  type DetailedTimetableRow,
} from "@attendance/supabase";
import { WEEKDAY_NAMES } from "@attendance/utils";

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

export type TimetableSheetTarget =
  | { mode: "create"; defaultWeekday?: number; defaultStartTime?: string }
  | { mode: "edit"; entry: DetailedTimetableRow }
  | null;

export function TimetableSheet({
  target,
  courses,
  onOpenChange,
  onSaved,
}: {
  target: TimetableSheetTarget;
  courses: CourseSummaryRow[];
  onOpenChange: (open: boolean) => void;
  onSaved: () => void;
}) {
  const editing = target?.mode === "edit" ? target.entry : null;
  const [courseId, setCourseId] = React.useState("");
  const [weekday, setWeekday] = React.useState("1");
  const [startTime, setStartTime] = React.useState("09:00");
  const [endTime, setEndTime] = React.useState("11:00");
  const [venue, setVenue] = React.useState("");
  const [effectiveFrom, setEffectiveFrom] = React.useState("2026-09-01");
  const [effectiveTo, setEffectiveTo] = React.useState("2027-01-31");
  const [saving, setSaving] = React.useState(false);
  const [deleting, setDeleting] = React.useState(false);

  React.useEffect(() => {
    if (editing) {
      setCourseId(editing.course_id);
      setWeekday(String(editing.weekday));
      setStartTime(editing.start_time.slice(0, 5));
      setEndTime(editing.end_time.slice(0, 5));
      setVenue(editing.venue);
      setEffectiveFrom(editing.effective_from);
      setEffectiveTo(editing.effective_to ?? "");
    } else if (target?.mode === "create") {
      setCourseId(courses[0]?.id ?? "");
      setWeekday(String(target.defaultWeekday ?? 1));
      const defaultStart = target.defaultStartTime ?? "09:00";
      const startHour = Number(defaultStart.split(":")[0] || 9);
      const computedEnd = `${String(Math.min(startHour + 2, 20)).padStart(2, "0")}:00`;
      setStartTime(defaultStart);
      setEndTime(computedEnd);
      setVenue("");
      setEffectiveFrom("2026-09-01");
      setEffectiveTo("2027-01-31");
    }
  }, [editing, target, courses]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (endTime <= startTime) {
      toast.error("End time must be after start time");
      return;
    }
    setSaving(true);
    try {
      await saveTimetableEntry({
        id: editing?.id,
        course_id: courseId,
        weekday: Number(weekday),
        start_time: startTime,
        end_time: endTime,
        venue,
        effective_from: effectiveFrom,
        effective_to: effectiveTo || null,
      });
      toast.success(editing ? "Schedule updated" : "Schedule slot added");
      onOpenChange(false);
      onSaved();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save schedule");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!editing) return;
    setDeleting(true);
    try {
      await deleteTimetableEntry(editing.id);
      toast.success("Schedule slot removed");
      onOpenChange(false);
      onSaved();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to remove slot");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <Sheet
      open={Boolean(target)}
      onOpenChange={onOpenChange}
      title={editing ? "Edit Timetable Slot" : "Add Timetable Slot"}
      description="Editing schedules never rewrites historical session timestamps."
      footer={
        <div className="flex w-full items-center justify-between gap-2">
          <div>
            {editing && (
              <Button
                variant="danger-ghost"
                size="sm"
                loading={deleting}
                leadingIcon={<Trash2 />}
                onClick={() => void handleDelete()}
              >
                Delete Slot
              </Button>
            )}
          </div>
          <div className="flex items-center gap-2">
            <SheetClose asChild>
              <Button variant="secondary" disabled={saving || deleting}>
                Cancel
              </Button>
            </SheetClose>
            <Button loading={saving} onClick={(e) => void submit(e)}>
              {editing ? "Save Changes" : "Add Schedule"}
            </Button>
          </div>
        </div>
      }
    >
      <form onSubmit={submit} className="flex flex-col gap-4">
        <Select
          label="Course"
          required
          value={courseId}
          onValueChange={setCourseId}
          options={courses.map((c) => ({
            value: c.id,
            label: `${c.code} — ${c.title}`,
          }))}
        />
        <Select
          label="Day of Week"
          required
          value={weekday}
          onValueChange={setWeekday}
          options={WEEKDAY_NAMES.map((day, idx) => ({
            value: String(idx),
            label: day,
          }))}
        />
        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Start Time"
            type="time"
            required
            value={startTime}
            onChange={(e) => setStartTime(e.target.value)}
          />
          <Input
            label="End Time"
            type="time"
            required
            value={endTime}
            onChange={(e) => setEndTime(e.target.value)}
          />
        </div>
        <Input
          label="Venue / Lecture Room"
          required
          placeholder="e.g. Engineering Block — Lecture Hall A"
          value={venue}
          onChange={(e) => setVenue(e.target.value)}
        />
        <div className="grid grid-cols-2 gap-3">
          <DatePicker
            label="Effective From"
            required
            value={parseIsoDate(effectiveFrom)}
            onChange={(d) => d && setEffectiveFrom(toIsoDate(d))}
          />
          <DatePicker
            label="Effective To"
            minDate={parseIsoDate(effectiveFrom)}
            value={parseIsoDate(effectiveTo)}
            onChange={(d) => setEffectiveTo(d ? toIsoDate(d) : "")}
          />
        </div>
      </form>
    </Sheet>
  );
}
