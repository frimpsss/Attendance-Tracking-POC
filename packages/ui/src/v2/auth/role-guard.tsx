import * as React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { ExternalLink, LogOut, ShieldAlert } from "lucide-react";
import { useAuth } from "@attendance/supabase";
import type { AppRole } from "@attendance/types";
import { Button } from "../button";
import { Spinner } from "../spinner";

export interface RoleGuardScreenProps {
  loading: boolean;
  isAuthenticated: boolean;
  isAccountDisabled: boolean;
  isAuthorizedForApp: boolean;
  currentRole: AppRole | null;
  expectedRole: AppRole;
  userEmail?: string;
  crossAppUrls: { admin: string; lecturer: string; student: string };
  onSignOut: () => Promise<void>;
  onRedirectToLogin: () => void;
  children: React.ReactNode;
}

const ROLE_LABELS: Record<AppRole, string> = {
  admin: "Admin Portal",
  lecturer: "Lecturer PWA",
  student: "Student PWA",
};

export function RoleGuardScreen({
  loading,
  isAuthenticated,
  isAccountDisabled,
  isAuthorizedForApp,
  currentRole,
  expectedRole,
  userEmail,
  crossAppUrls,
  onSignOut,
  onRedirectToLogin,
  children,
}: RoleGuardScreenProps) {
  React.useEffect(() => {
    if (!loading && !isAuthenticated) {
      onRedirectToLogin();
    }
  }, [loading, isAuthenticated, onRedirectToLogin]);

  if (loading) {
    return (
      <div
        data-v2
        className="font-v2 flex min-h-dvh flex-col items-center justify-center gap-3 bg-v2-canvas text-v2-ink"
      >
        <Spinner size="md" />
        <p className="text-v2-sm text-v2-ink-secondary">
          Verifying session & role permissions…
        </p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  if (isAccountDisabled) {
    return (
      <div
        data-v2
        className="font-v2 flex min-h-dvh flex-col items-center justify-center bg-v2-canvas px-4 py-12 text-center text-v2-ink"
      >
        <div className="max-w-md rounded-v2-md border border-v2-line bg-v2-surface p-8">
          <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-full bg-v2-danger-bg text-v2-danger">
            <ShieldAlert className="size-6" />
          </div>
          <h1 className="text-v2-2xl font-semibold text-v2-ink">Account Deactivated</h1>
          <p className="mt-2 text-v2-base text-v2-ink-secondary">
            Your account ({userEmail}) has been deactivated by an administrator. Protected
            operations and attendance check-ins are disabled.
          </p>
          <div className="mt-6 flex justify-center">
            <Button variant="secondary" leadingIcon={<LogOut />} onClick={() => void onSignOut()}>
              Sign out
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (!isAuthorizedForApp) {
    const targetUrl = currentRole ? crossAppUrls[currentRole] : null;
    const targetLabel = currentRole ? ROLE_LABELS[currentRole] : "Authorized Portal";

    return (
      <div
        data-v2
        className="font-v2 flex min-h-dvh flex-col items-center justify-center bg-v2-canvas px-4 py-12 text-center text-v2-ink"
      >
        <div className="max-w-md rounded-v2-md border border-v2-line bg-v2-surface p-8">
          <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-full bg-v2-warning-bg text-v2-warning">
            <ShieldAlert className="size-6" />
          </div>
          <h1 className="text-v2-2xl font-semibold text-v2-ink">
            Wrong Application for Your Role
          </h1>
          <p className="mt-2 text-v2-base text-v2-ink-secondary">
            You are signed in as <strong>{userEmail}</strong> with role{" "}
            <strong className="capitalize">{currentRole ?? "unassigned"}</strong>, but this
            application requires the <strong className="capitalize">{expectedRole}</strong> role (
            {ROLE_LABELS[expectedRole]}).
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            {targetUrl && (
              <Button asChild variant="primary" trailingIcon={<ExternalLink />}>
                <a href={targetUrl}>Open {targetLabel}</a>
              </Button>
            )}
            <Button variant="secondary" leadingIcon={<LogOut />} onClick={() => void onSignOut()}>
              Sign out & switch account
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

export interface RoleGuardProps {
  requiredRole: AppRole;
  appName?: string;
  children: React.ReactNode;
}

export function RoleGuard({ requiredRole, children }: RoleGuardProps) {
  const {
    user,
    profile,
    role,
    loading,
    isAccountDisabled,
    crossAppUrls,
    signOut,
  } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleRedirect = React.useCallback(() => {
    const target = `${location.pathname}${location.search}`;
    const redirectQuery =
      target && target !== "/" && target !== "/login"
        ? `?redirect=${encodeURIComponent(target)}`
        : "";
    navigate(`/login${redirectQuery}`, { replace: true });
  }, [location.pathname, location.search, navigate]);

  return (
    <RoleGuardScreen
      loading={loading}
      isAuthenticated={Boolean(user)}
      isAccountDisabled={isAccountDisabled}
      isAuthorizedForApp={role === requiredRole}
      currentRole={role}
      expectedRole={requiredRole}
      userEmail={profile?.email ?? user?.email}
      crossAppUrls={crossAppUrls}
      onSignOut={signOut}
      onRedirectToLogin={handleRedirect}
    >
      {children}
    </RoleGuardScreen>
  );
}
