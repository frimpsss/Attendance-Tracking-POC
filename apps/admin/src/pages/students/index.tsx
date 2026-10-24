import * as React from "react";
import { useSearchParams } from "react-router-dom";
import { Plus } from "lucide-react";
import { Button, PageHeader } from "@attendance/ui";
import { StudentSheet } from "./components/student-sheet";
import { StudentsTable } from "./components/students-table";
import { useStudents } from "./hooks/use-students";

export default function StudentsPage() {
  const list = useStudents();
  const [params, setParams] = useSearchParams();
  const [creating, setCreating] = React.useState(params.get("action") === "create");

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Students"
        description="Manage student profiles, department placements, enrollments, and attendance standing."
      />
      <StudentsTable
        list={list}
        actions={
          <Button variant="ghost" size="sm" leadingIcon={<Plus />} onClick={() => setCreating(true)}>
            New Student
          </Button>
        }
      />
      <StudentSheet
        open={creating}
        onOpenChange={(next) => {
          setCreating(next);
          if (!next) setParams({});
        }}
        departments={list.departments}
        onCreated={() => void list.refetch()}
      />
    </div>
  );
}
