import * as React from "react";
import { LogOut } from "lucide-react";
import { Avatar, Button } from "@attendance/ui";
import {
  queryStudentById,
  useAuth,
  type StudentSummaryRow,
} from "@attendance/supabase";

export default function StudentProfilePage() {
  const { user, profile, signOut } = useAuth();
  const [student, setStudent] = React.useState<StudentSummaryRow | null>(null);

  React.useEffect(() => {
    if (!user) return;
    void queryStudentById(user.id).then(setStudent);
  }, [user]);

  return (
    <div className="flex flex-col gap-6 py-2">
      <div className="rounded-v2-lg bg-v2-surface p-5">
        <div className="flex items-center gap-3.5">
          <Avatar name={profile?.full_name ?? "Student"} size="lg" />
          <div className="min-w-0 flex-1">
            <h1 className="truncate text-v2-lg font-bold text-v2-ink">
              {profile?.full_name}
            </h1>
            <p className="truncate text-v2-sm text-v2-ink-secondary">{profile?.email}</p>
          </div>
        </div>

        <div className="mt-5 flex flex-col gap-3 border-t border-v2-line pt-4 text-v2-sm">
          <div className="flex justify-between">
            <span className="text-v2-ink-secondary">Student ID</span>
            <span className="font-v2-mono font-semibold text-v2-ink">
              {student?.student_number ?? "—"}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-v2-ink-secondary">Department</span>
            <span className="font-medium text-v2-ink">
              {student ? `${student.department_code} — ${student.department_name}` : "—"}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-v2-ink-secondary">Academic Level</span>
            <span className="font-medium text-v2-ink">
              Level {student?.academic_level ?? "—"}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-v2-ink-secondary">Overall Attendance Rate</span>
            <span className="font-semibold text-v2-ink">
              {student?.attendance_percentage ?? 100}%
            </span>
          </div>
        </div>
      </div>

      <Button
        variant="secondary"
        size="lg"
        fullWidth
        leadingIcon={<LogOut />}
        onClick={() => void signOut()}
      >
        Sign Out
      </Button>
    </div>
  );
}
