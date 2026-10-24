import * as React from "react";
import { Button, Input, Select, Sheet, SheetClose, toast } from "@attendance/ui";
import { adminCreateUserAccount, useAuth } from "@attendance/supabase";
import type { Department } from "@attendance/types";
import { ACADEMIC_LEVEL_OPTIONS } from "../utils/constants";

export function StudentSheet({
  open,
  onOpenChange,
  departments,
  onCreated,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  departments: Department[];
  onCreated: () => void;
}) {
  const { user } = useAuth();
  const [fullName, setFullName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [phone, setPhone] = React.useState("");
  const [studentNumber, setStudentNumber] = React.useState("");
  const [departmentId, setDepartmentId] = React.useState("");
  const [academicLevel, setAcademicLevel] = React.useState("300");
  const [password, setPassword] = React.useState("ChangeMe123!");
  const [saving, setSaving] = React.useState(false);

  React.useEffect(() => {
    if (departments.length > 0 && !departmentId) {
      setDepartmentId(departments[0].id);
    }
  }, [departments, departmentId]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setSaving(true);
    try {
      await adminCreateUserAccount({
        actorId: user.id,
        role: "student",
        fullName,
        email,
        phone,
        departmentId,
        studentNumber,
        academicLevel,
        password,
      });
      toast.success("Student account created");
      setFullName("");
      setEmail("");
      setPhone("");
      setStudentNumber("");
      onOpenChange(false);
      onCreated();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to create student");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Sheet
      open={open}
      onOpenChange={onOpenChange}
      title="Create / Invite Student Account"
      description="Provision a student identity in Supabase Auth and link their academic record."
      footer={
        <>
          <SheetClose asChild>
            <Button variant="secondary" disabled={saving}>
              Cancel
            </Button>
          </SheetClose>
          <Button loading={saving} onClick={(e) => void submit(e)}>
            Create Student
          </Button>
        </>
      }
    >
      <form onSubmit={submit} className="flex flex-col gap-4">
        <Input
          label="Full name"
          required
          placeholder="e.g. Abena Asante"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
        />
        <Input
          label="Student ID Number"
          required
          placeholder="e.g. STU-109015"
          value={studentNumber}
          onChange={(e) => setStudentNumber(e.target.value)}
        />
        <Input
          label="University Email"
          type="email"
          required
          placeholder="student@st.university.edu.gh"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <Input
          label="Phone Number"
          type="tel"
          placeholder="+233 50 000 0000"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
        />
        <Select
          label="Department"
          required
          value={departmentId}
          onValueChange={setDepartmentId}
          options={departments.map((d) => ({
            value: d.id,
            label: `${d.code} — ${d.name}`,
          }))}
        />
        <Select
          label="Academic Level"
          required
          value={academicLevel}
          onValueChange={setAcademicLevel}
          options={ACADEMIC_LEVEL_OPTIONS}
        />
        <Input
          label="Initial Password"
          type="text"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          hint="Student can change or reset their password anytime."
        />
      </form>
    </Sheet>
  );
}
