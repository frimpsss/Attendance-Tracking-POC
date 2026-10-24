import * as React from "react";
import { useSearchParams } from "react-router-dom";
import { Plus } from "lucide-react";
import { Button, PageHeader } from "@attendance/ui";
import { LecturerSheet } from "./components/lecturer-sheet";
import { LecturersTable } from "./components/lecturers-table";
import { useLecturers } from "./hooks/use-lecturers";

export default function LecturersPage() {
  const list = useLecturers();
  const [params, setParams] = useSearchParams();
  const [creating, setCreating] = React.useState(params.get("action") === "create");

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Lecturers"
        description="Manage faculty accounts, department affiliations, and course assignments."
      />
      <LecturersTable
        list={list}
        actions={
          <Button variant="ghost" size="sm" leadingIcon={<Plus />} onClick={() => setCreating(true)}>
            New Lecturer
          </Button>
        }
      />
      <LecturerSheet
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
