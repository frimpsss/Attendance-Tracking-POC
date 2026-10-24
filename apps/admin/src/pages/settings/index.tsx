import * as React from "react";
import { RotateCcw, Save, UserCheck, UserX } from "lucide-react";
import {
  Button,
  FormSection,
  Input,
  NumberInput,
  PageHeader,
  Select,
  Status,
  Switch,
  Table,
  Tabs,
  toast,
  type TableBulkAction,
} from "@attendance/ui";
import {
  adminSetUserAccess,
  resetDemoState,
  updateSystemSettings,
  useAuth,
} from "@attendance/supabase";
import type { AppRole } from "@attendance/types";
import { useSettings } from "./hooks/use-settings";

export default function SettingsPage() {
  const { user, isDemoMode } = useAuth();
  const {
    settings,
    users,
    totalUsers,
    loading,
    searchInput,
    setSearchInput,
    roles,
    setRoles,
    page,
    setPage,
    pageSize,
    setPageSize,
    pageCount,
    refetch,
  } = useSettings();
  const [tab, setTab] = React.useState("policy");
  const [selectedUsers, setSelectedUsers] = React.useState<string[]>([]);

  const [threshold, setThreshold] = React.useState<number>(
    settings.low_attendance_threshold,
  );
  const [lateGrace, setLateGrace] = React.useState<number>(
    settings.late_grace_minutes,
  );
  const [windowMins, setWindowMins] = React.useState<number>(
    settings.checkin_window_minutes,
  );
  const [qrEnabled, setQrEnabled] = React.useState(settings.qr_enabled);
  const [codeEnabled, setCodeEnabled] = React.useState(settings.code_enabled);
  const [manualEnabled, setManualEnabled] = React.useState(settings.manual_enabled);
  const [timezone, setTimezone] = React.useState(settings.timezone);
  const [saving, setSaving] = React.useState(false);

  const syncFromSettings = React.useCallback(() => {
    setThreshold(settings.low_attendance_threshold);
    setLateGrace(settings.late_grace_minutes);
    setWindowMins(settings.checkin_window_minutes);
    setQrEnabled(settings.qr_enabled);
    setCodeEnabled(settings.code_enabled);
    setManualEnabled(settings.manual_enabled);
    setTimezone(settings.timezone);
  }, [settings]);

  React.useEffect(() => {
    syncFromSettings();
  }, [syncFromSettings]);

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setSaving(true);
    try {
      await updateSystemSettings(user.id, {
        low_attendance_threshold: Number(threshold) || 75,
        late_grace_minutes: Number(lateGrace ?? 10),
        checkin_window_minutes: Number(windowMins) || 30,
        qr_enabled: qrEnabled,
        code_enabled: codeEnabled,
        manual_enabled: manualEnabled,
        timezone: timezone.trim() || "Africa/Accra",
      });
      toast.success("Institution attendance policy saved");
      await refetch();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  const handleBulkUserAccess = async (keys: string[], isActive: boolean) => {
    if (!user) return;
    const targets = keys.filter((id) => id !== user.id);
    if (targets.length === 0) return;
    try {
      await Promise.all(
        targets.map((targetUserId) =>
          adminSetUserAccess({
            actorId: user.id,
            targetUserId,
            isActive,
            reason: isActive ? "Activated via Settings" : "Deactivated via Settings",
          }),
        ),
      );
      toast.success("User access updated");
      setSelectedUsers([]);
      await refetch();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update user access");
    }
  };

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        title="Settings & Access"
        description="Configure attendance thresholds, session grace windows, check-in channels, and user role access."
        actions={
          isDemoMode && (
            <Button
              variant="secondary"
              size="sm"
              leadingIcon={<RotateCcw />}
              onClick={async () => {
                resetDemoState();
                toast.success("Demo database reset to initial seed state");
                await refetch();
              }}
            >
              Reset Demo Data
            </Button>
          )
        }
      />

      <Tabs
        value={tab}
        onValueChange={setTab}
        contentClassName="mt-8"
        items={[
          {
            value: "policy",
            label: "Attendance Policy",
            content: (
              <form onSubmit={handleSaveSettings} className="max-w-4xl">
                <FormSection
                  title="Thresholds & Windows"
                  description="Minimum attendance requirement and default session timing rules applied across portals."
                >
                  <div className="grid max-w-xl grid-cols-1 gap-6 sm:grid-cols-2">
                    <NumberInput
                      label="Attendance threshold (%)"
                      min={1}
                      max={100}
                      value={threshold}
                      onChange={setThreshold}
                    />
                    <NumberInput
                      label="Late grace period (mins)"
                      min={0}
                      max={180}
                      value={lateGrace}
                      onChange={setLateGrace}
                    />
                    <NumberInput
                      label="Check-in window (mins)"
                      min={1}
                      max={240}
                      value={windowMins}
                      onChange={setWindowMins}
                    />
                    <Input
                      label="Institution timezone"
                      required
                      value={timezone}
                      onChange={(e) => setTimezone(e.target.value)}
                    />
                  </div>
                </FormSection>

                <FormSection
                  title="Check-In Channels"
                  description="Choose which classroom verification methods are available during live sessions."
                >
                  <div className="flex max-w-xl flex-col gap-5">
                    <Switch
                      label="QR Code Check-In"
                      description="Allow lecturers to display session QR codes for students to scan."
                      checked={qrEnabled}
                      onCheckedChange={setQrEnabled}
                    />
                    <Switch
                      label="Short Check-In Code"
                      description="Allow students to enter a 6-character alphanumeric session code."
                      checked={codeEnabled}
                      onCheckedChange={setCodeEnabled}
                    />
                    <Switch
                      label="Manual Lecturer Marking"
                      description="Allow lecturers to manually mark Present, Late, or Absent on the roster."
                      checked={manualEnabled}
                      onCheckedChange={setManualEnabled}
                    />
                  </div>
                </FormSection>

                <div className="flex items-center justify-end gap-2 pt-6">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={syncFromSettings}
                  >
                    Reset
                  </Button>
                  <Button type="submit" size="sm" loading={saving} leadingIcon={<Save />}>
                    Save changes
                  </Button>
                </div>
              </form>
            ),
          },
          {
            value: "users",
            label: "Users & Role Access",
            count: totalUsers,
            content: (
              <Table
                loading={loading}
                data={users}
                rowKey={(r) => r.id}
                selectedKeys={selectedUsers}
                onSelectionChange={setSelectedUsers}
                bulkNoun={["user", "users"]}
                bulkActions={(keys): TableBulkAction[] => {
                  const picked = users.filter(
                    (u) => keys.includes(u.id) && u.id !== user?.id,
                  );
                  const anyActive = picked.some((u) => u.is_active);
                  const anyInactive = picked.some((u) => !u.is_active);
                  return [
                    ...(anyInactive
                      ? [
                          {
                            label: "Activate",
                            icon: <UserCheck />,
                            onClick: (k: string[]) => void handleBulkUserAccess(k, true),
                          },
                        ]
                      : []),
                    ...(anyActive
                      ? [
                          {
                            label: "Deactivate",
                            icon: <UserX />,
                            tone: "danger" as const,
                            onClick: (k: string[]) => void handleBulkUserAccess(k, false),
                          },
                        ]
                      : []),
                  ];
                }}
                search={{
                  value: searchInput,
                  onChange: setSearchInput,
                  placeholder: "Search user name or email…",
                }}
                filters={[
                  {
                    key: "role",
                    label: "Role",
                    options: [
                      { value: "admin", label: "Admin" },
                      { value: "lecturer", label: "Lecturer" },
                      { value: "student", label: "Student" },
                    ],
                    value: roles,
                    onChange: setRoles,
                  },
                ]}
                onRefresh={() => void refetch()}
                pagination={{
                  page,
                  pageCount,
                  onPageChange: setPage,
                  pageSize,
                  onPageSizeChange: setPageSize,
                  total: totalUsers,
                }}
                columns={[
                  {
                    key: "name",
                    header: "User",
                    cell: (r) => (
                      <div>
                        <p className="font-semibold text-v2-ink">{r.full_name}</p>
                        <p className="text-v2-xs text-v2-ink-secondary">{r.email}</p>
                      </div>
                    ),
                  },
                  {
                    key: "role",
                    header: "Assigned Role",
                    cell: (r) => (
                      <div className="w-40" onClick={(e) => e.stopPropagation()}>
                        <Select
                          size="sm"
                          value={r.role}
                          disabled={r.id === user?.id}
                          onValueChange={async (nextRole) => {
                            if (!user) return;
                            await adminSetUserAccess({
                              actorId: user.id,
                              targetUserId: r.id,
                              newRole: nextRole as AppRole,
                              reason: `Role changed to ${nextRole} by Admin`,
                            });
                            toast.success(`Updated role for ${r.full_name}`);
                            await refetch();
                          }}
                          options={[
                            { value: "admin", label: "Admin" },
                            { value: "lecturer", label: "Lecturer" },
                            { value: "student", label: "Student" },
                          ]}
                        />
                      </div>
                    ),
                  },
                  {
                    key: "status",
                    header: "Status",
                    align: "right",
                    cell: (r) => (
                      <Status value={r.is_active ? "active" : "inactive"} size="sm" />
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
