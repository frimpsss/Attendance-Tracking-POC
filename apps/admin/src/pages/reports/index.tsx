import * as React from "react";
import { useNavigate } from "react-router-dom";
import {
  EmptyState,
  ExportButton,
  PageHeader,
  StatCards,
  Status,
  Table,
  Tabs,
} from "@attendance/ui";
import { exportToCsv, exportToPdf } from "@attendance/utils";
import { useReports } from "./hooks/use-reports";

export default function ReportsPage() {
  const navigate = useNavigate();
  const report = useReports();
  const [tab, setTab] = React.useState("students");
  const threshold = report.settings?.low_attendance_threshold ?? 75;

  const handleExportCsv = () => {
    if (tab === "students") {
      exportToCsv(
        "student-attendance-report.csv",
        [
          "Student ID",
          "Full Name",
          "Email",
          "Department",
          "Level",
          "Eligible Sessions",
          "Present",
          "Late",
          "Attended",
          "Absent",
          "Attendance %",
          "Below Threshold",
        ],
        report.students.map((s) => [
          s.student_number,
          s.full_name,
          s.email,
          s.department_code,
          s.academic_level,
          s.eligible_sessions_count,
          s.present_count,
          s.late_count,
          s.attended_count,
          s.absent_count,
          s.attendance_percentage !== null ? `${s.attendance_percentage}%` : "N/A",
          s.is_below_threshold ? "YES" : "NO",
        ]),
      );
    } else {
      exportToCsv(
        "course-attendance-report.csv",
        [
          "Course Code",
          "Course Title",
          "Department",
          "Academic Period",
          "Lecturers",
          "Enrolled Students",
          "Closed Sessions",
          "Average Attendance %",
        ],
        report.courses.map((c) => [
          c.code,
          c.title,
          c.department_code,
          c.academic_period_name,
          c.lecturer_names.join("; "),
          c.enrolled_students_count,
          c.closed_sessions_count,
          c.attendance_percentage !== null ? `${c.attendance_percentage}%` : "N/A",
        ]),
      );
    }
  };

  const handleExportPdf = () => {
    if (tab === "students") {
      exportToPdf({
        title: "Student Attendance Performance Report",
        subtitle: `Institution Threshold: ${threshold}% (Present + Late count as attended)`,
        summaryItems: [
          { label: "Total Students", value: String(report.studentsTotal) },
          {
            label: "Below Threshold",
            value: String(report.students.filter((s) => s.is_below_threshold).length),
          },
          { label: "Threshold Policy", value: `${threshold}%` },
        ],
        headers: [
          "Student ID",
          "Student Name",
          "Department",
          "Attended / Eligible",
          "Absent",
          "Attendance %",
          "Standing",
        ],
        rows: report.students.map((s) => [
          s.student_number,
          s.full_name,
          s.department_code,
          `${s.attended_count} / ${s.eligible_sessions_count}`,
          s.absent_count,
          s.attendance_percentage !== null ? `${s.attendance_percentage}%` : "N/A",
          s.is_below_threshold ? "Below Threshold" : "Good Standing",
        ]),
      });
    } else {
      exportToPdf({
        title: "Course & Department Attendance Summary",
        subtitle: "Server-backed canonical session and attendance summary",
        summaryItems: [
          { label: "Courses", value: String(report.courses.length) },
          { label: "Departments", value: String(report.departments.length) },
        ],
        headers: [
          "Code",
          "Course Title",
          "Department",
          "Lecturers",
          "Enrolled",
          "Closed Sessions",
          "Attendance %",
        ],
        rows: report.courses.map((c) => [
          c.code,
          c.title,
          c.department_code,
          c.lecturer_names.join(", "),
          c.enrolled_students_count,
          c.closed_sessions_count,
          c.attendance_percentage !== null ? `${c.attendance_percentage}%` : "N/A",
        ]),
      });
    }
  };

  const exportControl = (
    <ExportButton
      size="sm"
      formats={["csv", "pdf"]}
      onExport={(format) => {
        if (format === "csv") handleExportCsv();
        else handleExportPdf();
      }}
    />
  );

  return (
    <div className="flex flex-col gap-10">
      <PageHeader
        title="Reports & Exports"
        description="Institution, department, course, and student attendance summaries with CSV and PDF export."
      />

      <StatCards
        columns={4}
        loading={report.isPending && report.students.length === 0}
        items={[
          {
            label: "Students in Scope",
            value: String(report.studentsTotal),
            caption: `${report.students.filter((s) => s.is_below_threshold).length} below ${threshold}%`,
          },
          {
            label: "Courses in Scope",
            value: String(report.courses.length),
            caption: "Active & archived courses",
          },
          {
            label: "Departments",
            value: String(report.departments.length),
            caption: "Academic faculties",
          },
          {
            label: "Policy Threshold",
            value: `${threshold}%`,
            caption: "Late counts as attended",
          },
        ]}
      />

      <Tabs
        value={tab}
        onValueChange={setTab}
        contentClassName="mt-8"
        items={[
          {
            value: "students",
            label: "Student Attendance Report",
            count: report.studentsTotal,
            content: (
              <Table
                loading={report.isPending}
                data={report.students}
                rowKey={(s) => s.user_id}
                onRowClick={(s) => navigate(`/students/${s.user_id}`)}
                search={{
                  value: report.searchInput,
                  onChange: report.setSearchInput,
                  placeholder: "Search Student ID, name, or email…",
                }}
                filters={[
                  {
                    key: "department",
                    label: "Department",
                    options: report.departments.map((d) => ({
                      value: d.id,
                      label: `${d.code} — ${d.name}`,
                    })),
                    value: report.departmentIds,
                    onChange: report.setDepartmentIds,
                  },
                  {
                    key: "course",
                    label: "Course",
                    options: report.courses.map((c) => ({
                      value: c.id,
                      label: `${c.code} — ${c.title}`,
                    })),
                    value: report.courseIds,
                    onChange: report.setCourseIds,
                  },
                  {
                    key: "standing",
                    label: "Standing",
                    options: [
                      { value: "below", label: `Below ${threshold}% Threshold` },
                      { value: "good", label: "Good Standing" },
                    ],
                    value: report.standings,
                    onChange: report.setStandings,
                  },
                ]}
                actions={exportControl}
                onRefresh={() => void report.refetch()}
                pagination={{
                  page: report.page,
                  pageCount: Math.max(1, Math.ceil(report.studentsTotal / report.pageSize)),
                  onPageChange: report.setPage,
                  pageSize: report.pageSize,
                  onPageSizeChange: report.setPageSize,
                  total: report.studentsTotal,
                }}
                empty={<EmptyState size="sm" title="No student records match filters" />}
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
                    header: "Student",
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
                    cell: (s) => (
                      <span className="text-v2-sm">
                        {s.department_code} (L{s.academic_level})
                      </span>
                    ),
                  },
                  {
                    key: "breakdown",
                    header: "P / L / A (Eligible)",
                    cell: (s) => (
                      <span className="text-v2-sm tabular-nums text-v2-ink-secondary">
                        {s.present_count} P · {s.late_count} L · {s.absent_count} A (
                        {s.eligible_sessions_count})
                      </span>
                    ),
                  },
                  {
                    key: "pct",
                    header: "Attendance %",
                    cell: (s) => (
                      <span className="font-semibold tabular-nums text-v2-ink">
                        {s.attendance_percentage !== null
                          ? `${s.attendance_percentage}%`
                          : "N/A"}
                      </span>
                    ),
                  },
                  {
                    key: "standing",
                    header: "Standing",
                    align: "right",
                    cell: (s) => (
                      <Status
                        value={s.is_below_threshold ? "below threshold" : "good standing"}
                        label={s.is_below_threshold ? "Below Threshold" : "Good Standing"}
                        size="sm"
                      />
                    ),
                  },
                ]}
              />
            ),
          },
          {
            value: "courses",
            label: "Course & Department Summary",
            count: report.courses.length,
            content: (
              <Table
                loading={report.isPending}
                data={report.courses}
                rowKey={(c) => c.id}
                onRowClick={(c) => navigate(`/courses/${c.id}`)}
                filters={[
                  {
                    key: "department",
                    label: "Department",
                    options: report.departments.map((d) => ({
                      value: d.id,
                      label: `${d.code} — ${d.name}`,
                    })),
                    value: report.departmentIds,
                    onChange: report.setDepartmentIds,
                  },
                  {
                    key: "period",
                    label: "Academic Period",
                    options: report.periods.map((p) => ({
                      value: p.id,
                      label: p.name,
                    })),
                    value: report.periodIds,
                    onChange: report.setPeriodIds,
                  },
                ]}
                actions={exportControl}
                onRefresh={() => void report.refetch()}
                columns={[
                  {
                    key: "code",
                    header: "Code",
                    cell: (c) => (
                      <span className="font-v2-mono text-v2-sm font-semibold">{c.code}</span>
                    ),
                  },
                  {
                    key: "title",
                    header: "Course Title",
                    cell: (c) => (
                      <div>
                        <p className="font-semibold text-v2-ink">{c.title}</p>
                        <p className="text-v2-xs text-v2-ink-secondary">
                          {c.department_name} · {c.academic_period_name}
                        </p>
                      </div>
                    ),
                  },
                  {
                    key: "lecturers",
                    header: "Lecturers",
                    cell: (c) => (
                      <span className="text-v2-sm">{c.lecturer_names.join(", ") || "—"}</span>
                    ),
                  },
                  {
                    key: "enrolled",
                    header: "Enrolled",
                    cell: (c) => (
                      <span className="text-v2-sm tabular-nums">
                        {c.enrolled_students_count} students
                      </span>
                    ),
                  },
                  {
                    key: "sessions",
                    header: "Finalized Sessions",
                    cell: (c) => (
                      <span className="text-v2-sm tabular-nums">
                        {c.closed_sessions_count} closed
                      </span>
                    ),
                  },
                  {
                    key: "rate",
                    header: "Avg Attendance",
                    align: "right",
                    cell: (c) => (
                      <span className="font-semibold tabular-nums text-v2-ink">
                        {c.attendance_percentage !== null
                          ? `${c.attendance_percentage}%`
                          : "N/A"}
                      </span>
                    ),
                  },
                ]}
              />
            ),
          },
        ]}
      />
    </div>
  );
}
