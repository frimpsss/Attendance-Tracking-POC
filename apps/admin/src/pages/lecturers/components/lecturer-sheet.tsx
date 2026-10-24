import * as React from "react";
import { Button, Input, Select, Sheet, SheetClose, toast } from "@attendance/ui";
import { adminCreateUserAccount, useAuth } from "@attendance/supabase";
import type { Department } from "@attendance/types";

export function LecturerSheet({
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
  const [staffNumber, setStaffNumber] = React.useState("");
  const [departmentId, setDepartmentId] = React.useState("");
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
        role: "lecturer",
        fullName,
        email,
        phone,
        departmentId,
        staffNumber,
        password,
      });
      toast.success("Lecturer account created");
      setFullName("");
      setEmail("");
      setPhone("");
      setStaffNumber("");
      onOpenChange(false);
      onCreated();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to create lecturer");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Sheet
      open={open}
      onOpenChange={onOpenChange}
      title="Create / Invite Lecturer Account"
      description="Provision a faculty identity in Supabase Auth and link their department."
      footer={
        <>
          <SheetClose asChild>
            <Button variant="secondary" disabled={saving}>
              Cancel
            </Button>
          </SheetClose>
          <Button loading={saving} onClick={(e) => void submit(e)}>
            Create Lecturer
          </Button>
        </>
      }
    >
      <form onSubmit={submit} className="flex flex-col gap-4">
        <Input
          label="Full name"
          required
          placeholder="e.g. Dr. Kofi Boateng"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
        />
        <Input
          label="Staff ID Number"
          required
          placeholder="e.g. STF-2026-005"
          value={staffNumber}
          onChange={(e) => setStaffNumber(e.target.value)}
        />
        <Input
          label="University Email"
          type="email"
          required
          placeholder="lecturer@university.edu.gh"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <Input
          label="Phone Number"
          type="tel"
          placeholder="+233 24 000 0000"
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
        <Input
          label="Initial Password"
          type="text"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
      </form>
    </Sheet>
  );
}
