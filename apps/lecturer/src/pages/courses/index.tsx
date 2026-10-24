import * as React from "react";
import { useNavigate } from "react-router-dom";
import { BookOpen, ChevronRight, Plus, Users } from "lucide-react";
import {
  Badge,
  Button,
  EmptyState,
  SearchInput,
  Skeleton,
  Status,
} from "@attendance/ui";
import { useLecturerCoursesList } from "./hooks/use-lecturer-courses";

export default function LecturerCoursesPage() {
  const navigate = useNavigate();
  const { items, loading, searchInput, setSearchInput } = useLecturerCoursesList();

  return (
    <div className="flex flex-col gap-6 py-2">
      <div>
        <h1 className="text-v2-xl font-bold tracking-tight text-v2-ink">My Assigned Courses</h1>
        <p className="mt-1 text-v2-sm text-v2-ink-secondary">
          Select a course to view roster, attendance rates, or open a session.
        </p>
      </div>

      <SearchInput
        value={searchInput}
        onValueChange={setSearchInput}
        placeholder="Search course code or title…"
      />

      {loading ? (
        <div className="flex flex-col gap-3">
          {Array.from({ length: 3 }).map((_, idx) => (
            <div key={idx} className="rounded-v2-lg bg-v2-surface p-5">
              <Skeleton className="h-24 w-full" />
            </div>
          ))}
        </div>
      ) : items.length === 0 ? (
        <EmptyState
          icon={<BookOpen />}
          title="No assigned courses found"
          description="Ask an administrator to assign you to your semester courses."
        />
      ) : (
        <div className="flex flex-col gap-4">
          {items.map((course) => (
            <div key={course.id} className="rounded-v2-lg bg-v2-surface p-5">
              <div className="flex flex-col gap-4">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-v2-mono text-v2-sm font-semibold text-v2-ink">
                        {course.code}
                      </span>
                      <Status value={course.is_active ? "active" : "archived"} size="sm" />
                    </div>
                    <h2 className="mt-1 text-v2-base font-semibold text-v2-ink">
                      {course.title}
                    </h2>
                    <p className="mt-0.5 text-v2-xs text-v2-ink-secondary">
                      {course.department_name} · Level {course.level}
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <Badge tone="neutral" size="sm">
                    <Users className="mr-1 h-3 w-3" />
                    {course.enrolled_count} students
                  </Badge>
                  <Badge tone="neutral" size="sm">
                    {course.closed_session_count} finalized sessions
                  </Badge>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-1">
                  <Button
                    variant="secondary"
                    size="sm"
                    trailingIcon={<ChevronRight />}
                    onClick={() => navigate(`/courses/${course.id}`)}
                  >
                    Course Roster
                  </Button>
                  <Button
                    variant="primary"
                    size="sm"
                    leadingIcon={<Plus />}
                    onClick={() => navigate(`/sessions/new?courseId=${course.id}`)}
                  >
                    Open Session
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
