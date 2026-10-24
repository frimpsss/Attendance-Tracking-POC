import * as React from "react";
import { Plus, RotateCw } from "lucide-react";
import { Button, PageHeader, SearchInput, Select } from "@attendance/ui";
import { TimetableSheet, type TimetableSheetTarget } from "./components/timetable-sheet";
import { WeeklyTimetableGrid } from "./components/weekly-timetable-grid";
import { useTimetable } from "./hooks/use-timetable";

export default function TimetablePage() {
  const list = useTimetable();
  const [target, setTarget] = React.useState<TimetableSheetTarget>(null);

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        title="Timetable"
        description="Interactive weekly schedule grid. Click any class block to edit or click an empty time slot to schedule a lecture."
        actions={
          <>
            <Button
              variant="secondary"
              size="sm"
              leadingIcon={<RotateCw />}
              onClick={() => void list.refetch()}
            >
              Refresh
            </Button>
            <Button
              variant="primary"
              size="sm"
              leadingIcon={<Plus />}
              onClick={() => setTarget({ mode: "create" })}
            >
              Add Schedule Slot
            </Button>
          </>
        }
      />

      <div className="flex flex-wrap items-center gap-2.5">
        <SearchInput
          size="sm"
          value={list.searchInput}
          onValueChange={list.setSearchInput}
          placeholder="Search course, title, or venue…"
          containerClassName="w-full sm:w-72"
        />
        <div className="w-full sm:w-56">
          <Select
            size="sm"
            value={list.courseId || "all"}
            onValueChange={(v) => list.setCourseId(v === "all" ? "" : v)}
            options={[
              { value: "all", label: "All Courses" },
              ...list.courses.map((c) => ({ value: c.id, label: `${c.code} — ${c.title}` })),
            ]}
          />
        </div>
        <div className="w-full sm:w-48">
          <Select
            size="sm"
            value={list.lecturerId || "all"}
            onValueChange={(v) => list.setLecturerId(v === "all" ? "" : v)}
            options={[
              { value: "all", label: "All Lecturers" },
              ...list.lecturers.map((l) => ({ value: l.user_id, label: l.full_name })),
            ]}
          />
        </div>
        <div className="w-full sm:w-56">
          <Select
            size="sm"
            value={list.studentId || "all"}
            onValueChange={(v) => list.setStudentId(v === "all" ? "" : v)}
            options={[
              { value: "all", label: "All Students" },
              ...list.students.map((s) => ({
                value: s.user_id,
                label: `${s.full_name} (${s.student_number})`,
              })),
            ]}
          />
        </div>
      </div>

      <WeeklyTimetableGrid
        items={list.items}
        loading={list.isPending}
        onSelectSlot={(entry) => setTarget({ mode: "edit", entry })}
        onCreateAt={(weekday, startTime) =>
          setTarget({ mode: "create", defaultWeekday: weekday, defaultStartTime: startTime })
        }
      />

      <TimetableSheet
        target={target}
        courses={list.courses}
        onOpenChange={(open) => !open && setTarget(null)}
        onSaved={() => void list.refetch()}
      />
    </div>
  );
}
