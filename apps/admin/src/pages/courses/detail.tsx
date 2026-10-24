import * as React from "react";
import { useLocation, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { Plus, UserMinus, UserPlus, Users } from "lucide-react";
import {
  Button,
  CopyText,
  EmptyState,
  FocusLayout,
  Modal,
  MultiSelect,
  Skeleton,
  StatCards,
  Status,
  Table,
  Tabs,
  toast,
  type TableBulkAction,
} from "@attendance/ui";
import {
  queryCourseById,
  queryLecturersPage,
  querySessionsPage,
  queryStudentCourseStatsPage,
  queryStudentsPage,
  saveCourse,
  subscribeToAttendanceChanges,
  updateCourseEnrollments,
  type CourseSummaryRow,
  type LecturerSummaryRow,
  type SessionSummaryRow,
  type StudentSummaryRow,
} from "@attendance/supabase";
import { formatDateTime } from "@attendance/utils";

const TABS = ["roster", "lecturers", "sessions"];

export default function CourseDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const [params, setParams] = useSearchParams();

  const requestedTab = params.get("tab") ?? "";
  const tab = TABS.includes(requestedTab) ? requestedTab : "roster";

  const [course, setCourse] = React.useState<CourseSummaryRow | null>(null);
  const [lecturers, setLecturers] = React.useState<LecturerSummaryRow[]>([]);
  const [students, setStudents] = React.useState<StudentSummaryRow[]>([]);
  const [totalStudents, setTotalStudents] = React.useState(0);
  const [sessions, setSessions] = React.useState<SessionSummaryRow[]>([]);
  const [loading, setLoading] = React.useState(true);

  const [lecturerIds, setLecturerIds] = React.useState<string[]>([]);
  const [enrolledStudentIds, setEnrolledStudentIds] = React.useState<string[]>([]);
  const [searchInput, setSearchInput] = React.useState("");
  const [search, setSearch] = React.useState("");
  const [enrollmentFilter, setEnrollmentFilter] = React.useState<string[]>([]);
  const [page, setPage] = React.useState(1);
  const [pageSize, setPageSize] = React.useState(15);

  const [selectedStudents, setSelectedStudents] = React.useState<string[]>([]);
  const [selectedLecturers, setSelectedLecturers] = React.useState<string[]>([]);
  const [lecturerModalOpen, setLecturerModalOpen] = React.useState(false);
  const [draftLecturerIds, setDraftLecturerIds] = React.useState<string[]>([]);
  const [savingLecs, setSavingLecs] = React.useState(false);

  const exit = () => (location.key !== "default" ? navigate(-1) : navigate("/courses"));

  React.useEffect(() => {
    const t = setTimeout(() => {
      setSearch(searchInput.trim());
      setPage(1);
    }, 250);
    return () => clearTimeout(t);
  }, [searchInput]);

  const load = React.useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      const [crs, lecs, stus, enrolledStats, sess] = await Promise.all([
        queryCourseById(id),
        queryLecturersPage({ page: 1, pageSize: 200 }),
        queryStudentsPage({ page, pageSize, search }),
        queryStudentCourseStatsPage({
          page: 1,
          pageSize: 500,
          courseId: id,
          onlyActiveEnrollments: true,
        }),
        querySessionsPage({ page: 1, pageSize: 50, courseIds: [id] }),
      ]);
      setCourse(crs);
      setLecturers(lecs.items);
      setStudents(stus.items);
      setTotalStudents(stus.total);
      setSessions(sess.items);
      if (crs) {
        setLecturerIds(crs.lecturer_ids);
        setDraftLecturerIds(crs.lecturer_ids);
      }
      setEnrolledStudentIds(enrolledStats.items.map((r) => r.student_id));
    } finally {
      setLoading(false);
    }
  }, [id, page, pageSize, search]);

  React.useEffect(() => {
    void load();
    return subscribeToAttendanceChanges(() => void load());
  }, [load]);

  const applyStudentEnrollments = async (nextIds: string[], message: string) => {
    if (!course) return;
    try {
      await updateCourseEnrollments(course.id, nextIds);
      setEnrolledStudentIds(nextIds);
      setSelectedStudents([]);
      toast.success(message);
      await load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update enrollments");
    }
  };

  const applyLecturerAssignments = async (nextLecIds: string[]) => {
    if (!course) return;
    setSavingLecs(true);
    try {
      await saveCourse({
        id: course.id,
        code: course.code,
        title: course.title,
        department_id: course.department_id,
        academic_period_id: course.academic_period_id,
        is_active: course.is_active,
        lecturer_ids: nextLecIds,
      });
      setLecturerIds(nextLecIds);
      setSelectedLecturers([]);
      setLecturerModalOpen(false);
      toast.success("Lecturer assignments updated");
      await load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save lecturers");
    } finally {
      setSavingLecs(false);
    }
  };

  const filteredStudents = React.useMemo(() => {
    if (enrollmentFilter.length !== 1) return students;
    return students.filter((s) => {
      const isEnrolled = enrolledStudentIds.includes(s.user_id);
      return enrollmentFilter[0] === "enrolled" ? isEnrolled : !isEnrolled;
    });
  }, [students, enrolledStudentIds, enrollmentFilter]);

  return (
    <div className="h-dvh">
      <FocusLayout
        width="xl"
        title={course ? `${course.code} — ${course.title}` : "Course"}
        status={course && <Status value={course.is_active ? "active" : "archived"} size="sm" />}
        subtitle={
          course
            ? [course.department_name, course.academic_period_name].filter(Boolean).join(" · ")
            : undefined
        }
        onBack={exit}
        actions={
          course &&
          tab === "roster" && (
            <Button
              variant="secondary"
              size="sm"
              leadingIcon={<Users />}
              onClick={async () => {
                const deptStudents = await queryStudentsPage({
                  page: 1,
                  pageSize: 500,
                  departmentIds: [course.department_id],
                });
                const ids = deptStudents.items.map((s) => s.user_id);
                const merged = Array.from(new Set([...enrolledStudentIds, ...ids]));
                await applyStudentEnrollments(
                  merged,
                  `Enrolled all ${course.department_code} students`,
                );
              }}
            >
              Enroll All {course.department_code} Students
            </Button>
          )
        }
      >
        {!loading && !course ? (
          <EmptyState
            illustration="search"
            title="Course not found"
            description="Go back to the courses directory and try again."
            action={<Button onClick={exit}>Back to Courses</Button>}
          />
        ) : loading || !course ? (
          <div className="flex flex-col gap-6">
            <Skeleton className="h-24" />
            <Skeleton className="h-20" />
            <Skeleton className="h-10" />
            <Skeleton className="h-72" />
          </div>
        ) : (
          <div className="flex flex-col gap-12">
            <section className="grid grid-cols-2 gap-6 sm:grid-cols-4">
              <div>
                <p className="text-v2-xs text-v2-ink-tertiary">Course Code</p>
                <div className="mt-1">
                  <CopyText value={course.code} variant="code" />
                </div>
              </div>
              <div>
                <p className="text-v2-xs text-v2-ink-tertiary">Department</p>
                <p className="mt-1 text-v2-base font-medium text-v2-ink">
                  {course.department_code} — {course.department_name}
                </p>
              </div>
              <div>
                <p className="text-v2-xs text-v2-ink-tertiary">Academic Period</p>
                <p className="mt-1 text-v2-base font-medium text-v2-ink">
                  {course.academic_period_name}
                </p>
              </div>
              <div>
                <p className="text-v2-xs text-v2-ink-tertiary">Instructors</p>
                <p className="mt-1 text-v2-base font-medium text-v2-ink">
                  {course.lecturer_names.length > 0
                    ? course.lecturer_names.join(", ")
                    : "Unassigned"}
                </p>
              </div>
            </section>

            <StatCards
              columns={4}
              items={[
                {
                  label: "Enrolled Students",
                  value: String(enrolledStudentIds.length),
                  caption: "Active roster",
                },
                {
                  label: "Assigned Lecturers",
                  value: String(lecturerIds.length),
                  caption: "Course instructors",
                },
                {
                  label: "Finalized Sessions",
                  value: String(course.closed_session_count),
                  caption: `${course.open_session_count} open`,
                },
                {
                  label: "Avg Attendance",
                  value:
                    course.attendance_percentage !== null
                      ? `${course.attendance_percentage}%`
                      : "N/A",
                  caption: course.academic_period_name,
                },
              ]}
            />

            <Tabs
              value={tab}
              onValueChange={(next) => {
                setSelectedStudents([]);
                setSelectedLecturers([]);
                setParams(
                  (current) => {
                    const updated = new URLSearchParams(current);
                    updated.set("tab", next);
                    return updated;
                  },
                  { replace: true },
                );
              }}
              contentClassName="mt-8"
              items={[
                {
                  value: "roster",
                  label: "Student Enrollments",
                  count: enrolledStudentIds.length || undefined,
                  content: (
                    <Table
                      loading={loading}
                      data={filteredStudents}
                      rowKey={(s) => s.user_id}
                      onRowClick={(s) => navigate(`/students/${s.user_id}`)}
                      selectedKeys={selectedStudents}
                      onSelectionChange={setSelectedStudents}
                      bulkNoun={["student", "students"]}
                      bulkActions={(keys): TableBulkAction[] => {
                        const anyUnenrolled = keys.some(
                          (k) => !enrolledStudentIds.includes(k),
                        );
                        const anyEnrolled = keys.some((k) => enrolledStudentIds.includes(k));
                        return [
                          ...(anyUnenrolled
                            ? [
                                {
                                  label: "Enroll Selected",
                                  icon: <UserPlus />,
                                  onClick: (k: string[]) => {
                                    const next = Array.from(
                                      new Set([...enrolledStudentIds, ...k]),
                                    );
                                    void applyStudentEnrollments(
                                      next,
                                      `Enrolled ${k.length} student(s)`,
                                    );
                                  },
                                },
                              ]
                            : []),
                          ...(anyEnrolled
                            ? [
                                {
                                  label: "Unenroll Selected",
                                  icon: <UserMinus />,
                                  tone: "danger" as const,
                                  onClick: (k: string[]) => {
                                    const removeSet = new Set(k);
                                    const next = enrolledStudentIds.filter(
                                      (sid) => !removeSet.has(sid),
                                    );
                                    void applyStudentEnrollments(
                                      next,
                                      `Unenrolled ${k.length} student(s)`,
                                    );
                                  },
                                },
                              ]
                            : []),
                        ];
                      }}
                      search={{
                        value: searchInput,
                        onChange: setSearchInput,
                        placeholder: "Search students by ID, name, or email…",
                      }}
                      filters={[
                        {
                          key: "enrollment",
                          label: "Enrollment",
                          options: [
                            { value: "enrolled", label: "Enrolled" },
                            { value: "not_enrolled", label: "Not Enrolled" },
                          ],
                          value: enrollmentFilter,
                          onChange: setEnrollmentFilter,
                        },
                      ]}
                      pagination={{
                        page,
                        pageCount: Math.max(1, Math.ceil(totalStudents / pageSize)),
                        onPageChange: setPage,
                        pageSize,
                        onPageSizeChange: (v) => {
                          setPageSize(v);
                          setPage(1);
                        },
                        total: totalStudents,
                      }}
                      columns={[
                        {
                          key: "id",
                          header: "Student ID",
                          cell: (s) => (
                            <span className="font-v2-mono text-v2-sm font-semibold">
                              {s.student_number}
                            </span>
                          ),
                        },
                        {
                          key: "name",
                          header: "Full Name",
                          cell: (s) => (
                            <div>
                              <p className="font-semibold text-v2-ink">{s.full_name}</p>
                              <p className="text-v2-xs text-v2-ink-secondary">{s.email}</p>
                            </div>
                          ),
                        },
                        {
                          key: "dept",
                          header: "Department",
                          cell: (s) => <span className="text-v2-sm">{s.department_code}</span>,
                        },
                        {
                          key: "attendance",
                          header: "Overall Attendance",
                          cell: (s) => (
                            <span className="font-semibold tabular-nums text-v2-ink">
                              {s.attendance_percentage !== null
                                ? `${s.attendance_percentage}%`
                                : "N/A"}
                            </span>
                          ),
                        },
                        {
                          key: "enrollment",
                          header: "Enrollment",
                          align: "right",
                          cell: (s) => {
                            const isEnrolled = enrolledStudentIds.includes(s.user_id);
                            return (
                              <Status
                                value={isEnrolled ? "active" : "inactive"}
                                label={isEnrolled ? "Enrolled" : "Not Enrolled"}
                                size="sm"
                              />
                            );
                          },
                        },
                      ]}
                    />
                  ),
                },
                {
                  value: "lecturers",
                  label: "Assigned Lecturers",
                  count: lecturerIds.length || undefined,
                  content: (
                    <Table
                      loading={loading}
                      data={lecturers}
                      rowKey={(l) => l.user_id}
                      onRowClick={(l) => navigate(`/lecturers/${l.user_id}`)}
                      selectedKeys={selectedLecturers}
                      onSelectionChange={setSelectedLecturers}
                      bulkNoun={["lecturer", "lecturers"]}
                      bulkActions={(keys): TableBulkAction[] => {
                        const anyUnassigned = keys.some((k) => !lecturerIds.includes(k));
                        const anyAssigned = keys.some((k) => lecturerIds.includes(k));
                        return [
                          ...(anyUnassigned
                            ? [
                                {
                                  label: "Assign to Course",
                                  icon: <UserPlus />,
                                  onClick: (k: string[]) => {
                                    const next = Array.from(new Set([...lecturerIds, ...k]));
                                    void applyLecturerAssignments(next);
                                  },
                                },
                              ]
                            : []),
                          ...(anyAssigned
                            ? [
                                {
                                  label: "Unassign",
                                  icon: <UserMinus />,
                                  tone: "danger" as const,
                                  onClick: (k: string[]) => {
                                    const removeSet = new Set(k);
                                    const next = lecturerIds.filter(
                                      (lid) => !removeSet.has(lid),
                                    );
                                    void applyLecturerAssignments(next);
                                  },
                                },
                              ]
                            : []),
                        ];
                      }}
                      actions={
                        <Button
                          variant="secondary"
                          size="sm"
                          leadingIcon={<Plus />}
                          onClick={() => {
                            setDraftLecturerIds(lecturerIds);
                            setLecturerModalOpen(true);
                          }}
                        >
                          Manage Lecturers
                        </Button>
                      }
                      columns={[
                        {
                          key: "staff",
                          header: "Staff ID",
                          cell: (l) => (
                            <span className="font-v2-mono text-v2-sm font-semibold">
                              {l.staff_number}
                            </span>
                          ),
                        },
                        {
                          key: "name",
                          header: "Lecturer",
                          cell: (l) => (
                            <div>
                              <p className="font-semibold text-v2-ink">{l.full_name}</p>
                              <p className="text-v2-xs text-v2-ink-secondary">{l.email}</p>
                            </div>
                          ),
                        },
                        {
                          key: "dept",
                          header: "Department",
                          cell: (l) => (
                            <span className="text-v2-sm">
                              {l.department_code} — {l.department_name}
                            </span>
                          ),
                        },
                        {
                          key: "status",
                          header: "Assignment",
                          align: "right",
                          cell: (l) => {
                            const isAssigned = lecturerIds.includes(l.user_id);
                            return (
                              <Status
                                value={isAssigned ? "active" : "inactive"}
                                label={isAssigned ? "Assigned" : "Unassigned"}
                                size="sm"
                              />
                            );
                          },
                        },
                      ]}
                    />
                  ),
                },
                {
                  value: "sessions",
                  label: "Attendance Sessions",
                  count: sessions.length || undefined,
                  content: (
                    <Table
                      data={sessions}
                      rowKey={(s) => s.id}
                      onRowClick={(s) => navigate(`/attendance/sessions/${s.id}`)}
                      empty={<EmptyState size="sm" title="No sessions recorded for this course" />}
                      columns={[
                        {
                          key: "title",
                          header: "Session Title",
                          cell: (s) => (
                            <span className="font-semibold text-v2-ink">{s.title}</span>
                          ),
                        },
                        {
                          key: "scheduled",
                          header: "Scheduled Time",
                          cell: (s) => (
                            <span className="text-v2-sm text-v2-ink-secondary">
                              {formatDateTime(s.scheduled_at)}
                            </span>
                          ),
                        },
                        {
                          key: "counts",
                          header: "Present / Late / Absent",
                          cell: (s) => (
                            <span className="text-v2-sm tabular-nums text-v2-ink">
                              {s.present_count} P · {s.late_count} L · {s.absent_count} A
                            </span>
                          ),
                        },
                        {
                          key: "status",
                          header: "Status",
                          align: "right",
                          cell: (s) => <Status value={s.status} size="sm" />,
                        },
                      ]}
                    />
                  ),
                },
              ]}
            />
          </div>
        )}
      </FocusLayout>

      <Modal
        open={lecturerModalOpen}
        onOpenChange={setLecturerModalOpen}
        title="Manage Course Lecturers"
        description={
          course
            ? `Assign one or more faculty members to ${course.code} — ${course.title}.`
            : undefined
        }
        footer={
          <>
            <Button variant="secondary" size="sm" onClick={() => setLecturerModalOpen(false)}>
              Cancel
            </Button>
            <Button
              size="sm"
              loading={savingLecs}
              onClick={() => void applyLecturerAssignments(draftLecturerIds)}
            >
              Save Lecturers ({draftLecturerIds.length})
            </Button>
          </>
        }
      >
        <MultiSelect
          label="Course Instructors"
          placeholder="Select lecturers…"
          value={draftLecturerIds}
          onValueChange={setDraftLecturerIds}
          options={lecturers.map((l) => ({
            value: l.user_id,
            label: `${l.full_name} (${l.staff_number})`,
          }))}
        />
      </Modal>
    </div>
  );
}
