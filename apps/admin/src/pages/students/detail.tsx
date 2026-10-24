import * as React from "react";
import { useLocation, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { BookOpen, KeyRound, Plus, Save, UserCheck, UserMinus, UserPlus, UserX } from "lucide-react";
import {
  Avatar,
  Button,
  CopyText,
  EmptyState,
  FocusLayout,
  FormSection,
  Input,
  Modal,
  MultiSelect,
  Select,
  Skeleton,
  StatCards,
  Status,
  Table,
  Tabs,
  toast,
  type TableBulkAction,
} from "@attendance/ui";
import {
  adminSetUserAccess,
  adminUpdateUserProfile,
  queryCoursesPage,
  queryDepartmentsList,
  queryStudentById,
  queryStudentCourseStatsPage,
  querySystemSettings,
  subscribeToAttendanceChanges,
  updateCourseEnrollments,
  useAuth,
  type CourseSummaryRow,
  type StudentCourseStatsRow,
  type StudentSummaryRow,
} from "@attendance/supabase";
import type { Department } from "@attendance/types";
import { ACADEMIC_LEVEL_OPTIONS } from "./utils/constants";

const TABS = ["details", "courses"];

export default function StudentDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const [params, setParams] = useSearchParams();
  const { user, sendPasswordReset } = useAuth();

  const requestedTab = params.get("tab") ?? "";
  const tab = TABS.includes(requestedTab) ? requestedTab : "details";

  const [student, setStudent] = React.useState<StudentSummaryRow | null>(null);
  const [departments, setDepartments] = React.useState<Department[]>([]);
  const [courses, setCourses] = React.useState<CourseSummaryRow[]>([]);
  const [courseStats, setCourseStats] = React.useState<StudentCourseStatsRow[]>([]);
  const [threshold, setThreshold] = React.useState(75);
  const [loading, setLoading] = React.useState(true);

  const [fullName, setFullName] = React.useState("");
  const [phone, setPhone] = React.useState("");
  const [studentNumber, setStudentNumber] = React.useState("");
  const [departmentId, setDepartmentId] = React.useState("");
  const [academicLevel, setAcademicLevel] = React.useState("300");
  const [savingProfile, setSavingProfile] = React.useState(false);

  const [selectedCourses, setSelectedCourses] = React.useState<string[]>([]);
  const [enrollmentFilter, setEnrollmentFilter] = React.useState<string[]>([]);
  const [courseSearch, setCourseSearch] = React.useState("");
  const [enrollModalOpen, setEnrollModalOpen] = React.useState(false);
  const [draftCourseIds, setDraftCourseIds] = React.useState<string[]>([]);
  const [savingCourses, setSavingCourses] = React.useState(false);

  const exit = () => (location.key !== "default" ? navigate(-1) : navigate("/students"));

  const load = React.useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      const [stu, depts, crs, stats, sys] = await Promise.all([
        queryStudentById(id),
        queryDepartmentsList(),
        queryCoursesPage({ page: 1, pageSize: 200 }),
        queryStudentCourseStatsPage({
          page: 1,
          pageSize: 200,
          studentId: id,
          onlyActiveEnrollments: false,
        }),
        querySystemSettings(),
      ]);
      setStudent(stu);
      setDepartments(depts);
      setCourses(crs.items);
      setCourseStats(stats.items);
      setThreshold(sys.low_attendance_threshold);
      if (stu) {
        setFullName(stu.full_name);
        setPhone(stu.phone ?? "");
        setStudentNumber(stu.student_number);
        setDepartmentId(stu.department_id);
        setAcademicLevel(stu.academic_level);
      }
      setDraftCourseIds(
        stats.items.filter((s) => s.enrollment_active).map((s) => s.course_id),
      );
    } finally {
      setLoading(false);
    }
  }, [id]);

  React.useEffect(() => {
    void load();
    return subscribeToAttendanceChanges(() => void load());
  }, [load]);

  const handleSaveProfile = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!user || !student) return;
    setSavingProfile(true);
    try {
      await adminUpdateUserProfile({
        actorId: user.id,
        userId: student.user_id,
        fullName,
        phone,
        studentNumber,
        departmentId,
        academicLevel,
      });
      toast.success("Student profile updated");
      await load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update profile");
    } finally {
      setSavingProfile(false);
    }
  };

  const setEnrollmentForCourses = async (courseIds: string[], enroll: boolean) => {
    if (!student || courseIds.length === 0) return;
    try {
      await Promise.all(
        courseIds.map(async (courseId) => {
          const existingCourseStudents = await queryStudentCourseStatsPage({
            page: 1,
            pageSize: 500,
            courseId,
            onlyActiveEnrollments: true,
          });
          const currentIds = existingCourseStudents.items.map((r) => r.student_id);
          const nextStudents = enroll
            ? Array.from(new Set([...currentIds, student.user_id]))
            : currentIds.filter((sid) => sid !== student.user_id);
          await updateCourseEnrollments(courseId, nextStudents);
        }),
      );
      toast.success(
        enroll
          ? `Enrolled in ${courseIds.length} course(s)`
          : `Unenrolled from ${courseIds.length} course(s)`,
      );
      setSelectedCourses([]);
      await load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update enrollment");
    }
  };

  const handleSaveModalEnrollments = async () => {
    if (!student) return;
    setSavingCourses(true);
    try {
      const activeSet = new Set(
        courseStats.filter((s) => s.enrollment_active).map((s) => s.course_id),
      );
      const nextSet = new Set(draftCourseIds);
      const toEnroll = courses
        .filter((c) => nextSet.has(c.id) && !activeSet.has(c.id))
        .map((c) => c.id);
      const toUnenroll = courses
        .filter((c) => !nextSet.has(c.id) && activeSet.has(c.id))
        .map((c) => c.id);

      if (toEnroll.length > 0) await setEnrollmentForCourses(toEnroll, true);
      if (toUnenroll.length > 0) await setEnrollmentForCourses(toUnenroll, false);
      setEnrollModalOpen(false);
      await load();
    } finally {
      setSavingCourses(false);
    }
  };

  const filteredCourses = React.useMemo(() => {
    const q = courseSearch.trim().toLowerCase();
    return courses.filter((c) => {
      const st = courseStats.find((s) => s.course_id === c.id);
      const isEnrolled = Boolean(st?.enrollment_active);
      if (enrollmentFilter.length === 1) {
        if (enrollmentFilter[0] === "enrolled" && !isEnrolled) return false;
        if (enrollmentFilter[0] === "not_enrolled" && isEnrolled) return false;
      }
      if (q && !`${c.code} ${c.title} ${c.department_name}`.toLowerCase().includes(q)) {
        return false;
      }
      return true;
    });
  }, [courses, courseStats, courseSearch, enrollmentFilter]);

  return (
    <div className="h-dvh">
      <FocusLayout
        width="xl"
        title={student ? student.full_name : "Student"}
        status={student && <Status value={student.is_active ? "active" : "inactive"} size="sm" />}
        subtitle={
          student
            ? [
                student.student_number,
                `${student.department_code} — ${student.department_name}`,
                `Level ${student.academic_level}`,
              ]
                .filter(Boolean)
                .join(" · ")
            : undefined
        }
        onBack={exit}
        actions={
          student && (
            <>
              <Button
                variant="secondary"
                size="sm"
                leadingIcon={<KeyRound />}
                onClick={async () => {
                  await sendPasswordReset(student.email);
                  toast.success("Password reset link dispatched");
                }}
              >
                Reset Password
              </Button>
              <Button
                variant="secondary"
                size="sm"
                leadingIcon={student.is_active ? <UserX /> : <UserCheck />}
                onClick={async () => {
                  if (!user) return;
                  await adminSetUserAccess({
                    actorId: user.id,
                    targetUserId: student.user_id,
                    isActive: !student.is_active,
                    reason: !student.is_active ? "Reactivated" : "Deactivated",
                  });
                  toast.success("Account status updated");
                  await load();
                }}
              >
                {student.is_active ? "Deactivate" : "Reactivate"}
              </Button>
            </>
          )
        }
        footer={
          tab === "details" &&
          student && (
            <>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setFullName(student.full_name);
                  setPhone(student.phone ?? "");
                  setStudentNumber(student.student_number);
                  setDepartmentId(student.department_id);
                  setAcademicLevel(student.academic_level);
                }}
              >
                Reset
              </Button>
              <Button
                size="sm"
                loading={savingProfile}
                leadingIcon={<Save />}
                onClick={() => void handleSaveProfile()}
              >
                Save changes
              </Button>
            </>
          )
        }
      >
        {!loading && !student ? (
          <EmptyState
            illustration="search"
            title="Student not found"
            description="Go back to the students directory and try again."
            action={<Button onClick={exit}>Back to Students</Button>}
          />
        ) : loading || !student ? (
          <div className="flex flex-col gap-6">
            <Skeleton className="h-24" />
            <Skeleton className="h-20" />
            <Skeleton className="h-10" />
            <Skeleton className="h-72" />
          </div>
        ) : (
          <div className="flex flex-col gap-12">
            <section className="flex flex-col gap-8 lg:flex-row lg:items-start lg:gap-12">
              <div className="flex items-center gap-4 lg:w-72 lg:shrink-0">
                <Avatar size="xl" name={student.full_name} className="!size-16 text-v2-xl" />
                <div className="min-w-0">
                  <p className="truncate text-v2-lg font-semibold text-v2-ink">
                    {student.full_name}
                  </p>
                  <p className="truncate text-v2-meta text-v2-ink-tertiary">{student.email}</p>
                </div>
              </div>
              <div className="grid flex-1 grid-cols-2 gap-6 sm:grid-cols-4">
                <div>
                  <p className="text-v2-xs text-v2-ink-tertiary">Student ID</p>
                  <div className="mt-1">
                    <CopyText value={student.student_number} variant="code" />
                  </div>
                </div>
                <div>
                  <p className="text-v2-xs text-v2-ink-tertiary">Department</p>
                  <p className="mt-1 text-v2-base font-medium text-v2-ink">
                    {student.department_code} — {student.department_name}
                  </p>
                </div>
                <div>
                  <p className="text-v2-xs text-v2-ink-tertiary">Academic Level</p>
                  <p className="mt-1 text-v2-base font-medium text-v2-ink">
                    Level {student.academic_level}
                  </p>
                </div>
                <div>
                  <p className="text-v2-xs text-v2-ink-tertiary">Standing</p>
                  <div className="mt-1">
                    <Status
                      value={student.is_below_threshold ? "below threshold" : "good standing"}
                      label={student.is_below_threshold ? "Below Threshold" : "Good Standing"}
                      size="sm"
                    />
                  </div>
                </div>
              </div>
            </section>

            <StatCards
              columns={4}
              items={[
                {
                  label: "Overall Attendance",
                  value:
                    student.attendance_percentage !== null
                      ? `${student.attendance_percentage}%`
                      : "N/A",
                  caption:
                    student.eligible_sessions > 0 &&
                    (student.attendance_percentage ?? 100) < threshold
                      ? `Below ${threshold}% threshold`
                      : "Meets threshold",
                },
                {
                  label: "Eligible Sessions",
                  value: String(student.eligible_sessions),
                  caption: `${student.attended_count} attended (${student.present_count} P, ${student.late_count} L)`,
                },
                {
                  label: "Missed Sessions",
                  value: String(student.absent_count),
                  caption: "Finalized absences",
                },
                {
                  label: "Active Courses",
                  value: String(student.active_course_count),
                  caption: `Level ${student.academic_level}`,
                },
              ]}
            />

            <Tabs
              value={tab}
              onValueChange={(next) =>
                setParams(
                  (current) => {
                    const updated = new URLSearchParams(current);
                    updated.set("tab", next);
                    return updated;
                  },
                  { replace: true },
                )
              }
              contentClassName="mt-8"
              items={[
                {
                  value: "details",
                  label: "Profile Details",
                  content: (
                    <form onSubmit={handleSaveProfile} className="max-w-4xl">
                      <FormSection
                        title="Academic Identity"
                        description="Student name, matriculation ID, department placement, and level."
                      >
                        <div className="grid max-w-xl grid-cols-1 gap-6 sm:grid-cols-2">
                          <Input
                            label="Full name"
                            required
                            value={fullName}
                            onChange={(e) => setFullName(e.target.value)}
                          />
                          <Input label="Email" value={student.email} disabled />
                          <Input
                            label="Student ID"
                            required
                            value={studentNumber}
                            onChange={(e) => setStudentNumber(e.target.value)}
                          />
                          <Input
                            label="Phone"
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                          />
                          <Select
                            label="Department"
                            value={departmentId}
                            onValueChange={setDepartmentId}
                            options={departments.map((d) => ({
                              value: d.id,
                              label: `${d.code} — ${d.name}`,
                            }))}
                          />
                          <Select
                            label="Academic level"
                            value={academicLevel}
                            onValueChange={setAcademicLevel}
                            options={ACADEMIC_LEVEL_OPTIONS}
                          />
                        </div>
                      </FormSection>
                    </form>
                  ),
                },
                {
                  value: "courses",
                  label: "Course Enrollments",
                  count: student.active_course_count || undefined,
                  content: (
                    <Table
                      loading={loading}
                      data={filteredCourses}
                      rowKey={(c) => c.id}
                      onRowClick={(c) => navigate(`/courses/${c.id}`)}
                      selectedKeys={selectedCourses}
                      onSelectionChange={setSelectedCourses}
                      bulkNoun={["course", "courses"]}
                      bulkActions={(keys): TableBulkAction[] => {
                        const picked = courses.filter((c) => keys.includes(c.id));
                        const anyUnenrolled = picked.some(
                          (c) =>
                            !courseStats.find((s) => s.course_id === c.id)?.enrollment_active,
                        );
                        const anyEnrolled = picked.some(
                          (c) =>
                            Boolean(
                              courseStats.find((s) => s.course_id === c.id)?.enrollment_active,
                            ),
                        );
                        return [
                          ...(anyUnenrolled
                            ? [
                                {
                                  label: "Enroll Student",
                                  icon: <UserPlus />,
                                  onClick: (k: string[]) =>
                                    void setEnrollmentForCourses(k, true),
                                },
                              ]
                            : []),
                          ...(anyEnrolled
                            ? [
                                {
                                  label: "Unenroll",
                                  icon: <UserMinus />,
                                  tone: "danger" as const,
                                  onClick: (k: string[]) =>
                                    void setEnrollmentForCourses(k, false),
                                },
                              ]
                            : []),
                        ];
                      }}
                      search={{
                        value: courseSearch,
                        onChange: setCourseSearch,
                        placeholder: "Search course code or title…",
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
                      actions={
                        <Button
                          variant="secondary"
                          size="sm"
                          leadingIcon={<Plus />}
                          onClick={() => {
                            setDraftCourseIds(
                              courseStats
                                .filter((s) => s.enrollment_active)
                                .map((s) => s.course_id),
                            );
                            setEnrollModalOpen(true);
                          }}
                        >
                          Manage Enrollments
                        </Button>
                      }
                      columns={[
                        {
                          key: "course",
                          header: "Course",
                          cell: (c) => (
                            <div>
                              <p className="font-semibold text-v2-ink">
                                {c.code} — {c.title}
                              </p>
                              <p className="text-v2-xs text-v2-ink-secondary">
                                {c.department_name} · {c.academic_period_name}
                              </p>
                            </div>
                          ),
                        },
                        {
                          key: "sessions",
                          header: "Attended / Eligible",
                          cell: (c) => {
                            const st = courseStats.find((s) => s.course_id === c.id);
                            return (
                              <span className="text-v2-sm tabular-nums text-v2-ink-secondary">
                                {st?.attended_count ?? 0} / {st?.eligible_sessions ?? 0}
                              </span>
                            );
                          },
                        },
                        {
                          key: "rate",
                          header: "Attendance %",
                          cell: (c) => {
                            const st = courseStats.find((s) => s.course_id === c.id);
                            const pct = st ? st.attendance_percentage : null;
                            return (
                              <span className="font-semibold tabular-nums text-v2-ink">
                                {pct !== null ? `${pct}%` : "N/A"}
                              </span>
                            );
                          },
                        },
                        {
                          key: "status",
                          header: "Enrollment",
                          align: "right",
                          cell: (c) => {
                            const st = courseStats.find((s) => s.course_id === c.id);
                            const enrolled = Boolean(st?.enrollment_active);
                            return (
                              <Status
                                value={enrolled ? "active" : "inactive"}
                                label={enrolled ? "Enrolled" : "Not Enrolled"}
                                size="sm"
                              />
                            );
                          },
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
        open={enrollModalOpen}
        onOpenChange={setEnrollModalOpen}
        title="Manage Course Enrollments"
        description={
          student
            ? `Select the semester courses ${student.full_name} is enrolled in.`
            : undefined
        }
        footer={
          <>
            <Button variant="secondary" size="sm" onClick={() => setEnrollModalOpen(false)}>
              Cancel
            </Button>
            <Button
              size="sm"
              loading={savingCourses}
              leadingIcon={<BookOpen />}
              onClick={() => void handleSaveModalEnrollments()}
            >
              Save Enrollments ({draftCourseIds.length})
            </Button>
          </>
        }
      >
        <MultiSelect
          label="Enrolled Courses"
          placeholder="Select courses…"
          value={draftCourseIds}
          onValueChange={setDraftCourseIds}
          options={courses.map((c) => ({
            value: c.id,
            label: `${c.code} — ${c.title}`,
          }))}
        />
      </Modal>
    </div>
  );
}
