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
  queryLecturerById,
  saveCourse,
  subscribeToAttendanceChanges,
  useAuth,
  type CourseSummaryRow,
  type LecturerSummaryRow,
} from "@attendance/supabase";
import type { Department } from "@attendance/types";

const TABS = ["details", "courses"];

export default function LecturerDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const [params, setParams] = useSearchParams();
  const { user, sendPasswordReset } = useAuth();

  const requestedTab = params.get("tab") ?? "";
  const tab = TABS.includes(requestedTab) ? requestedTab : "details";

  const [lecturer, setLecturer] = React.useState<LecturerSummaryRow | null>(null);
  const [departments, setDepartments] = React.useState<Department[]>([]);
  const [courses, setCourses] = React.useState<CourseSummaryRow[]>([]);
  const [loading, setLoading] = React.useState(true);

  const [fullName, setFullName] = React.useState("");
  const [phone, setPhone] = React.useState("");
  const [staffNumber, setStaffNumber] = React.useState("");
  const [departmentId, setDepartmentId] = React.useState("");
  const [saving, setSaving] = React.useState(false);

  const [selectedCourses, setSelectedCourses] = React.useState<string[]>([]);
  const [assignmentFilter, setAssignmentFilter] = React.useState<string[]>([]);
  const [courseSearch, setCourseSearch] = React.useState("");
  const [assignModalOpen, setAssignModalOpen] = React.useState(false);
  const [draftCourseIds, setDraftCourseIds] = React.useState<string[]>([]);
  const [savingCourses, setSavingCourses] = React.useState(false);

  const exit = () => (location.key !== "default" ? navigate(-1) : navigate("/lecturers"));

  const load = React.useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      const [lec, depts, crs] = await Promise.all([
        queryLecturerById(id),
        queryDepartmentsList(),
        queryCoursesPage({ page: 1, pageSize: 200 }),
      ]);
      setLecturer(lec);
      setDepartments(depts);
      setCourses(crs.items);
      if (lec) {
        setFullName(lec.full_name);
        setPhone(lec.phone ?? "");
        setStaffNumber(lec.staff_number);
        setDepartmentId(lec.department_id);
        setDraftCourseIds(
          crs.items.filter((c) => c.lecturer_ids.includes(lec.user_id)).map((c) => c.id),
        );
      }
    } finally {
      setLoading(false);
    }
  }, [id]);

  React.useEffect(() => {
    void load();
    return subscribeToAttendanceChanges(() => void load());
  }, [load]);

  const handleSave = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!user || !lecturer) return;
    setSaving(true);
    try {
      await adminUpdateUserProfile({
        actorId: user.id,
        userId: lecturer.user_id,
        fullName,
        phone,
        staffNumber,
        departmentId,
      });
      toast.success("Lecturer profile updated");
      await load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update lecturer");
    } finally {
      setSaving(false);
    }
  };

  const setCourseAssignments = async (courseIds: string[], assign: boolean) => {
    if (!lecturer || courseIds.length === 0) return;
    try {
      const targetCourses = courses.filter((c) => courseIds.includes(c.id));
      await Promise.all(
        targetCourses.map((course) => {
          const nextLecs = assign
            ? Array.from(new Set([...course.lecturer_ids, lecturer.user_id]))
            : course.lecturer_ids.filter((lid) => lid !== lecturer.user_id);
          return saveCourse({
            id: course.id,
            code: course.code,
            title: course.title,
            department_id: course.department_id,
            academic_period_id: course.academic_period_id,
            is_active: course.is_active,
            lecturer_ids: nextLecs,
          });
        }),
      );
      toast.success(
        assign
          ? `Assigned to ${targetCourses.length} course(s)`
          : `Unassigned from ${targetCourses.length} course(s)`,
      );
      setSelectedCourses([]);
      await load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update course assignment");
    }
  };

  const handleSaveModalAssignments = async () => {
    if (!lecturer) return;
    setSavingCourses(true);
    try {
      const nextSet = new Set(draftCourseIds);
      const toAssign = courses
        .filter((c) => nextSet.has(c.id) && !c.lecturer_ids.includes(lecturer.user_id))
        .map((c) => c.id);
      const toUnassign = courses
        .filter((c) => !nextSet.has(c.id) && c.lecturer_ids.includes(lecturer.user_id))
        .map((c) => c.id);

      if (toAssign.length > 0) await setCourseAssignments(toAssign, true);
      if (toUnassign.length > 0) await setCourseAssignments(toUnassign, false);
      setAssignModalOpen(false);
      await load();
    } finally {
      setSavingCourses(false);
    }
  };

  const filteredCourses = React.useMemo(() => {
    if (!lecturer) return [];
    const q = courseSearch.trim().toLowerCase();
    return courses.filter((c) => {
      const isAssigned = c.lecturer_ids.includes(lecturer.user_id);
      if (assignmentFilter.length === 1) {
        if (assignmentFilter[0] === "assigned" && !isAssigned) return false;
        if (assignmentFilter[0] === "unassigned" && isAssigned) return false;
      }
      if (q && !`${c.code} ${c.title} ${c.department_name}`.toLowerCase().includes(q)) {
        return false;
      }
      return true;
    });
  }, [courses, lecturer, courseSearch, assignmentFilter]);

  return (
    <div className="h-dvh">
      <FocusLayout
        width="xl"
        title={lecturer ? lecturer.full_name : "Lecturer"}
        status={lecturer && <Status value={lecturer.is_active ? "active" : "inactive"} size="sm" />}
        subtitle={
          lecturer
            ? [lecturer.staff_number, `${lecturer.department_code} — ${lecturer.department_name}`]
                .filter(Boolean)
                .join(" · ")
            : undefined
        }
        onBack={exit}
        actions={
          lecturer && (
            <>
              <Button
                variant="secondary"
                size="sm"
                leadingIcon={<KeyRound />}
                onClick={async () => {
                  await sendPasswordReset(lecturer.email);
                  toast.success("Password reset link dispatched");
                }}
              >
                Reset Password
              </Button>
              <Button
                variant="secondary"
                size="sm"
                leadingIcon={lecturer.is_active ? <UserX /> : <UserCheck />}
                onClick={async () => {
                  if (!user) return;
                  await adminSetUserAccess({
                    actorId: user.id,
                    targetUserId: lecturer.user_id,
                    isActive: !lecturer.is_active,
                    reason: !lecturer.is_active ? "Reactivated" : "Deactivated",
                  });
                  toast.success("Account status updated");
                  await load();
                }}
              >
                {lecturer.is_active ? "Deactivate" : "Reactivate"}
              </Button>
            </>
          )
        }
        footer={
          tab === "details" &&
          lecturer && (
            <>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setFullName(lecturer.full_name);
                  setPhone(lecturer.phone ?? "");
                  setStaffNumber(lecturer.staff_number);
                  setDepartmentId(lecturer.department_id);
                }}
              >
                Reset
              </Button>
              <Button
                size="sm"
                loading={saving}
                leadingIcon={<Save />}
                onClick={() => void handleSave()}
              >
                Save changes
              </Button>
            </>
          )
        }
      >
        {!loading && !lecturer ? (
          <EmptyState
            illustration="search"
            title="Lecturer not found"
            description="Go back to the lecturers directory and try again."
            action={<Button onClick={exit}>Back to Lecturers</Button>}
          />
        ) : loading || !lecturer ? (
          <div className="flex flex-col gap-6">
            <Skeleton className="h-24" />
            <Skeleton className="h-10" />
            <Skeleton className="h-72" />
          </div>
        ) : (
          <div className="flex flex-col gap-12">
            <section className="flex flex-col gap-8 lg:flex-row lg:items-start lg:gap-12">
              <div className="flex items-center gap-4 lg:w-72 lg:shrink-0">
                <Avatar size="xl" name={lecturer.full_name} className="!size-16 text-v2-xl" />
                <div className="min-w-0">
                  <p className="truncate text-v2-lg font-semibold text-v2-ink">
                    {lecturer.full_name}
                  </p>
                  <p className="truncate text-v2-meta text-v2-ink-tertiary">{lecturer.email}</p>
                </div>
              </div>
              <div className="grid flex-1 grid-cols-2 gap-6 sm:grid-cols-3">
                <div>
                  <p className="text-v2-xs text-v2-ink-tertiary">Staff ID</p>
                  <div className="mt-1">
                    <CopyText value={lecturer.staff_number} variant="code" />
                  </div>
                </div>
                <div>
                  <p className="text-v2-xs text-v2-ink-tertiary">Department</p>
                  <p className="mt-1 text-v2-base font-medium text-v2-ink">
                    {lecturer.department_code} — {lecturer.department_name}
                  </p>
                </div>
                <div>
                  <p className="text-v2-xs text-v2-ink-tertiary">Assigned Courses</p>
                  <p className="mt-1 text-v2-base font-medium text-v2-ink">
                    {lecturer.course_codes.length > 0
                      ? lecturer.course_codes.join(", ")
                      : "Unassigned"}
                  </p>
                </div>
              </div>
            </section>

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
                  label: "Faculty Details",
                  content: (
                    <form onSubmit={handleSave} className="max-w-4xl">
                      <FormSection
                        title="Faculty Profile"
                        description="Staff identification, contact details, and primary academic department."
                      >
                        <div className="grid max-w-xl grid-cols-1 gap-6 sm:grid-cols-2">
                          <Input
                            label="Full name"
                            required
                            value={fullName}
                            onChange={(e) => setFullName(e.target.value)}
                          />
                          <Input label="Email" value={lecturer.email} disabled />
                          <Input
                            label="Staff ID"
                            required
                            value={staffNumber}
                            onChange={(e) => setStaffNumber(e.target.value)}
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
                        </div>
                      </FormSection>
                    </form>
                  ),
                },
                {
                  value: "courses",
                  label: "Course Assignments",
                  count: lecturer.course_codes.length || undefined,
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
                        const anyUnassigned = picked.some(
                          (c) => !c.lecturer_ids.includes(lecturer.user_id),
                        );
                        const anyAssigned = picked.some((c) =>
                          c.lecturer_ids.includes(lecturer.user_id),
                        );
                        return [
                          ...(anyUnassigned
                            ? [
                                {
                                  label: "Assign Lecturer",
                                  icon: <UserPlus />,
                                  onClick: (k: string[]) => void setCourseAssignments(k, true),
                                },
                              ]
                            : []),
                          ...(anyAssigned
                            ? [
                                {
                                  label: "Unassign",
                                  icon: <UserMinus />,
                                  tone: "danger" as const,
                                  onClick: (k: string[]) => void setCourseAssignments(k, false),
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
                          key: "assignment",
                          label: "Assignment",
                          options: [
                            { value: "assigned", label: "Assigned" },
                            { value: "unassigned", label: "Unassigned" },
                          ],
                          value: assignmentFilter,
                          onChange: setAssignmentFilter,
                        },
                      ]}
                      actions={
                        <Button
                          variant="secondary"
                          size="sm"
                          leadingIcon={<Plus />}
                          onClick={() => {
                            setDraftCourseIds(
                              courses
                                .filter((c) => c.lecturer_ids.includes(lecturer.user_id))
                                .map((c) => c.id),
                            );
                            setAssignModalOpen(true);
                          }}
                        >
                          Manage Courses
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
                          key: "roster",
                          header: "Enrolled Roster",
                          cell: (c) => (
                            <span className="text-v2-sm tabular-nums text-v2-ink-secondary">
                              {c.enrolled_count} students
                            </span>
                          ),
                        },
                        {
                          key: "assignment",
                          header: "Assignment",
                          align: "right",
                          cell: (c) => {
                            const isAssigned = c.lecturer_ids.includes(lecturer.user_id);
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
              ]}
            />
          </div>
        )}
      </FocusLayout>

      <Modal
        open={assignModalOpen}
        onOpenChange={setAssignModalOpen}
        title="Manage Assigned Courses"
        description={
          lecturer ? `Select courses taught by ${lecturer.full_name}.` : undefined
        }
        footer={
          <>
            <Button variant="secondary" size="sm" onClick={() => setAssignModalOpen(false)}>
              Cancel
            </Button>
            <Button
              size="sm"
              loading={savingCourses}
              leadingIcon={<BookOpen />}
              onClick={() => void handleSaveModalAssignments()}
            >
              Save Assignments ({draftCourseIds.length})
            </Button>
          </>
        }
      >
        <MultiSelect
          label="Assigned Courses"
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
