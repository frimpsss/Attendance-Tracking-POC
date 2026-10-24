import * as React from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ArrowLeft, QrCode } from "lucide-react";
import {
  Button,
  DatePicker,
  Input,
  NumberInput,
  Select,
  Skeleton,
  Switch,
  Textarea,
  toast,
} from "@attendance/ui";
import { createAttendanceSession, useAuth } from "@attendance/supabase";
import { formatTimeSlot, getWeekdayName } from "@attendance/utils";
import { useNewSessionFormData } from "./hooks/use-lecturer-sessions";

export default function NewLecturerSessionPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const { courses, timetables, defaultWindow, loading } = useNewSessionFormData();

  const preselectedCourseId = searchParams.get("courseId") ?? "";
  const [courseId, setCourseId] = React.useState(preselectedCourseId);
  const [timetableId, setTimetableId] = React.useState("none");
  const [title, setTitle] = React.useState("Lecture Session");
  const [notes, setNotes] = React.useState("");
  const [scheduledDate, setScheduledDate] = React.useState<Date | undefined>(() => new Date());
  const [scheduledTime, setScheduledTime] = React.useState(() => {
    const now = new Date();
    const pad = (n: number) => String(n).padStart(2, "0");
    return `${pad(now.getHours())}:${pad(now.getMinutes())}`;
  });
  const [windowMinutes, setWindowMinutes] = React.useState<number>(defaultWindow);
  const [openImmediately, setOpenImmediately] = React.useState(true);
  const [saving, setSaving] = React.useState(false);

  React.useEffect(() => {
    if (!courseId && courses.length > 0) {
      setCourseId(preselectedCourseId || courses[0].id);
    }
  }, [courses, courseId, preselectedCourseId]);

  React.useEffect(() => {
    setWindowMinutes(defaultWindow);
  }, [defaultWindow]);

  const courseTimetables = timetables.filter((t) => t.course_id === courseId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !courseId) return;
    setSaving(true);
    try {
      const baseDate = scheduledDate ?? new Date();
      const [hh = "9", mm = "0"] = scheduledTime.split(":");
      const combined = new Date(
        baseDate.getFullYear(),
        baseDate.getMonth(),
        baseDate.getDate(),
        Number(hh),
        Number(mm),
      );

      const { session } = await createAttendanceSession({
        courseId,
        lecturerId: user.id,
        timetableId: timetableId !== "none" ? timetableId : null,
        title: title.trim() || "Lecture Session",
        notes: notes.trim() || null,
        scheduledAt: combined.toISOString(),
        openImmediately,
        windowMinutes: windowMinutes || defaultWindow,
      });

      toast.success(
        openImmediately
          ? "Session opened with active QR & check-in code"
          : "Attendance session scheduled",
      );
      navigate(`/sessions/${session.id}`, { replace: true });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to create session");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex flex-col gap-6 py-2">
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="sm"
          leadingIcon={<ArrowLeft />}
          onClick={() => navigate(-1)}
        >
          Back
        </Button>
      </div>

      <div>
        <h1 className="text-v2-2xl font-semibold text-v2-ink">Open Attendance Session</h1>
        <p className="mt-1 text-v2-sm text-v2-ink-secondary">
          Configure the session and generate an active classroom QR code and 6-character code.
        </p>
      </div>

      {loading ? (
        <div className="flex flex-col gap-4">
          <Skeleton className="h-14" />
          <Skeleton className="h-14" />
          <Skeleton className="h-14" />
          <Skeleton className="h-24" />
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <Select
            label="Assigned Course"
            value={courseId}
            onValueChange={(v) => {
              setCourseId(v);
              setTimetableId("none");
            }}
            options={courses.map((c) => ({
              value: c.id,
              label: `${c.code} — ${c.title}`,
            }))}
          />

          <Select
            label="Timetable Slot (Optional)"
            value={timetableId}
            onValueChange={setTimetableId}
            options={[
              { value: "none", label: "Ad-hoc / Custom Session" },
              ...courseTimetables.map((t) => ({
                value: t.id,
                label: `${getWeekdayName(t.weekday)} ${formatTimeSlot(t.start_time, t.end_time)} (${t.venue})`,
              })),
            ]}
          />

          <Input
            label="Session Title / Topic"
            required
            placeholder="Week 7 Lecture: Indexing & Query Plans"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <DatePicker
              label="Session Date"
              value={scheduledDate}
              onChange={setScheduledDate}
            />
            <Input
              label="Start Time"
              type="time"
              required
              value={scheduledTime}
              onChange={(e) => setScheduledTime(e.target.value)}
            />
            <NumberInput
              label="Check-in window (mins)"
              min={1}
              max={240}
              value={windowMinutes}
              onChange={setWindowMinutes}
            />
          </div>

          <Textarea
            label="Notes (Optional)"
            rows={2}
            placeholder="Lab Hall B2 or special instructions…"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />

          <div className="rounded-v2-md bg-v2-surface p-4">
            <Switch
              label="Open Session Immediately"
              description="Immediately issue a live QR code and 6-character code for students."
              checked={openImmediately}
              onCheckedChange={setOpenImmediately}
            />
          </div>

          <Button
            type="submit"
            size="lg"
            fullWidth
            loading={saving}
            leadingIcon={<QrCode />}
          >
            {openImmediately ? "Open Live Session & Generate QR" : "Schedule Session"}
          </Button>
        </form>
      )}
    </div>
  );
}
