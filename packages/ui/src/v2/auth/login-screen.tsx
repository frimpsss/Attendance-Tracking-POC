import * as React from "react";
import { useAuth } from "@attendance/supabase";
import type { AppRole } from "@attendance/types";
import { Alert, Button, Input, Modal, ModalClose } from "../index";

export interface DemoIdentityOption {
  label: string;
  sublabel: string;
  email: string;
}

export interface LoginScreenProps {
  appName?: string;
  appTitle?: string;
  roleLabel?: string;
  expectedRole?: AppRole;
  defaultRole?: AppRole;
  subtitle?: string;
  appSubtitle?: string;
  isDemoMode?: boolean;
  demoIdentities?: DemoIdentityOption[];
  onSignIn?: (email: string, password: string) => Promise<void>;
  onSendPasswordReset?: (email: string) => Promise<void>;
  onSuccess?: () => void;
}

const DEFAULT_DEMO_BY_ROLE: Record<AppRole, DemoIdentityOption[]> = {
  admin: [
    {
      label: "System Administrator",
      sublabel: "Admin",
      email: "admin@university.edu.gh",
    },
  ],
  lecturer: [
    {
      label: "Dr. Kwame Mensah",
      sublabel: "CS Lecturer",
      email: "lecturer1@university.edu.gh",
    },
    {
      label: "Prof. Ama Osei",
      sublabel: "IT Lecturer",
      email: "lecturer2@university.edu.gh",
    },
  ],
  student: [
    {
      label: "Kofi Boateng (UG2026001)",
      sublabel: "Student",
      email: "student1@university.edu.gh",
    },
    {
      label: "Abena Asante (UG2026002)",
      sublabel: "Student",
      email: "student2@university.edu.gh",
    },
    {
      label: "Yaw Owusu (UG2026003 — Low Attendance)",
      sublabel: "At-Risk Student",
      email: "student3@university.edu.gh",
    },
  ],
};

export function LoginScreen({
  appName,
  appTitle,
  roleLabel,
  expectedRole,
  defaultRole = "student",
  subtitle,
  appSubtitle,
  isDemoMode: isDemoModeProp,
  demoIdentities,
  onSignIn,
  onSendPasswordReset,
  onSuccess,
}: LoginScreenProps) {
  const auth = useAuth();
  const resolvedRole = expectedRole ?? defaultRole;
  const resolvedTitle = appName ?? appTitle ?? "Attendance Portal";
  const resolvedSubtitle =
    subtitle ?? appSubtitle ?? "Sign in with your institutional credentials.";
  const resolvedDemoMode = isDemoModeProp ?? auth.isDemoMode;
  const resolvedIdentities = demoIdentities ?? DEFAULT_DEMO_BY_ROLE[resolvedRole] ?? [];

  const [email, setEmail] = React.useState(resolvedIdentities[0]?.email ?? "");
  const [password, setPassword] = React.useState("ChangeMe123!");
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const [resetOpen, setResetOpen] = React.useState(false);
  const [resetEmail, setResetEmail] = React.useState("");
  const [resetSent, setResetSent] = React.useState(false);
  const [resetLoading, setResetLoading] = React.useState(false);
  const [resetError, setResetError] = React.useState<string | null>(null);

  const executeSignIn = async (targetEmail: string, targetPass: string) => {
    if (onSignIn) {
      await onSignIn(targetEmail, targetPass);
    } else {
      await auth.signInWithPassword(targetEmail, targetPass);
    }
    onSuccess?.();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await executeSignIn(email, password);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to sign in");
    } finally {
      setLoading(false);
    }
  };

  const handleQuickDemoSignIn = async (demoEmail: string) => {
    setEmail(demoEmail);
    setPassword("ChangeMe123!");
    setError(null);
    setLoading(true);
    try {
      await executeSignIn(demoEmail, "ChangeMe123!");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to sign in");
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setResetError(null);
    setResetLoading(true);
    try {
      if (onSendPasswordReset) {
        await onSendPasswordReset(resetEmail || email);
      } else {
        await auth.sendPasswordReset(resetEmail || email);
      }
      setResetSent(true);
    } catch (err) {
      setResetError(err instanceof Error ? err.message : "Could not send reset instructions");
    } finally {
      setResetLoading(false);
    }
  };

  return (
    <div
      data-v2
      className="font-v2 flex min-h-dvh flex-col items-center justify-center bg-v2-canvas px-4 py-10 text-v2-ink"
    >
      <div className="w-full max-w-[420px]">
        <div className="mb-8 flex flex-col items-start gap-2">
          <div className="flex items-center gap-2.5">
            <div className="flex size-9 items-center justify-center rounded-v2-sm bg-v2-primary text-v2-base font-bold text-v2-on-primary">
              {resolvedTitle.slice(0, 1).toUpperCase()}
            </div>
            <span className="text-v2-xl font-semibold text-v2-ink">{resolvedTitle}</span>
          </div>
          <h1 className="mt-2 text-v2-2xl font-semibold text-v2-ink">Sign in to continue</h1>
          <p className="text-v2-sm text-v2-ink-secondary">{resolvedSubtitle}</p>
        </div>

        {error && (
          <Alert tone="danger" title="Sign-in failed" className="mb-5">
            {error}
          </Alert>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <Input
            label="Email address"
            type="email"
            required
            placeholder="name@university.edu.gh"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={loading}
          />
          <div className="flex flex-col gap-1.5">
            <Input
              label="Password"
              type="password"
              required
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
            />
            <div className="flex justify-end">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => {
                  setResetEmail(email);
                  setResetSent(false);
                  setResetError(null);
                  setResetOpen(true);
                }}
              >
                Forgot password?
              </Button>
            </div>
          </div>

          <Button type="submit" size="lg" fullWidth loading={loading} className="mt-1">
            Sign in
          </Button>
        </form>

        {resolvedIdentities.length > 0 && (
          <div className="mt-8 border-t border-v2-line pt-6">
            <div className="mb-3 flex items-center justify-between">
              <span className="text-v2-xs font-semibold uppercase tracking-wider text-v2-ink-tertiary">
                Quick Demo Accounts
              </span>
              {resolvedDemoMode && (
                <span className="rounded-v2-xs bg-v2-surface-muted px-2 py-0.5 text-v2-2xs font-medium text-v2-ink-secondary">
                  Local Demo Sync Active
                </span>
              )}
            </div>
            <div className="flex flex-col gap-2">
              {resolvedIdentities.map((identity) => (
                <button
                  key={identity.email}
                  type="button"
                  data-v2
                  data-press
                  disabled={loading}
                  onClick={() => void handleQuickDemoSignIn(identity.email)}
                  className="flex w-full items-center justify-between rounded-v2-sm bg-v2-surface px-3.5 py-2.5 text-left transition-colors hover:bg-v2-surface-hover"
                >
                  <div className="min-w-0">
                    <p className="truncate text-v2-sm font-semibold text-v2-ink">
                      {identity.label}
                    </p>
                    <p className="truncate text-v2-xs text-v2-ink-secondary">
                      {identity.email}
                    </p>
                  </div>
                  <span className="ml-2 shrink-0 rounded-v2-xs bg-v2-primary-soft px-2 py-1 text-v2-2xs font-semibold text-v2-primary">
                    {identity.sublabel}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      <Modal
        open={resetOpen}
        onOpenChange={setResetOpen}
        title="Reset your password"
        description="Enter your institutional email address to receive a password reset link."
        footer={
          <>
            <ModalClose asChild>
              <Button variant="secondary">Close</Button>
            </ModalClose>
            {!resetSent && (
              <Button loading={resetLoading} onClick={(e) => void handlePasswordReset(e)}>
                Send reset link
              </Button>
            )}
          </>
        }
      >
        {resetSent ? (
          <Alert tone="success" title="Reset instructions sent">
            If an active account exists for <strong>{resetEmail}</strong>, a password recovery link
            has been dispatched.
          </Alert>
        ) : (
          <form onSubmit={handlePasswordReset} className="flex flex-col gap-4">
            {resetError && (
              <Alert tone="danger" title="Error">
                {resetError}
              </Alert>
            )}
            <Input
              label="Account email"
              type="email"
              required
              value={resetEmail}
              onChange={(e) => setResetEmail(e.target.value)}
              placeholder="name@university.edu.gh"
            />
          </form>
        )}
      </Modal>
    </div>
  );
}
