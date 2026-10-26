import * as React from "react";
import type { AppRole, Profile } from "@attendance/types";
import { getCrossAppUrls, isSupabaseConfigured, supabase } from "./client";
import { getDemoState, subscribeDemoState } from "./demo-store";

export interface AuthenticatedUser {
  id: string;
  email: string;
  profile: Profile;
  role: AppRole | null;
}

export interface AuthContextValue {
  user: AuthenticatedUser | null;
  profile: Profile | null;
  role: AppRole | null;
  loading: boolean;
  expectedRole: AppRole;
  isAuthorizedForApp: boolean;
  isAccountDisabled: boolean;
  isDemoMode: boolean;
  crossAppUrls: { admin: string; lecturer: string; student: string };
  signInWithPassword: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  sendPasswordReset: (email: string) => Promise<void>;
  updatePassword: (newPassword: string) => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = React.createContext<AuthContextValue | null>(null);

const DEMO_EMAIL_ALIASES: Record<string, string> = {
  "lecturer1@university.edu.gh": "k.boateng@university.edu.gh",
  "lecturer2@university.edu.gh": "a.osei@university.edu.gh",
  "student1@university.edu.gh": "abena.asante@st.university.edu.gh",
  "student2@university.edu.gh": "kwesi.appiah@st.university.edu.gh",
  "student3@university.edu.gh": "akosua.owusu@st.university.edu.gh",
};

const LIVE_EMAIL_ALIASES: Record<string, string> = {
  "k.boateng@university.edu.gh": "lecturer1@university.edu.gh",
  "a.osei@university.edu.gh": "lecturer2@university.edu.gh",
  "abena.asante@st.university.edu.gh": "student1@university.edu.gh",
  "kwesi.appiah@st.university.edu.gh": "student2@university.edu.gh",
  "akosua.owusu@st.university.edu.gh": "student3@university.edu.gh",
};

function getDemoSessionKey(expectedRole: AppRole) {
  return `attendance_poc_demo_session_${expectedRole}`;
}

export function AuthProvider({
  expectedRole = "admin",
  children,
}: {
  expectedRole?: AppRole;
  children: React.ReactNode;
}) {
  const [user, setUser] = React.useState<AuthenticatedUser | null>(null);
  const [loading, setLoading] = React.useState(true);
  const userRef = React.useRef(user);
  userRef.current = user;
  const crossAppUrls = React.useMemo(() => getCrossAppUrls(), []);

  const resolveDemoSession = React.useCallback(() => {
    if (typeof window === "undefined") return;
    const savedUserId = window.localStorage.getItem(getDemoSessionKey(expectedRole));
    if (!savedUserId) {
      setUser(null);
      setLoading(false);
      return;
    }
    const db = getDemoState();
    const profile = db.profiles.find((p) => p.id === savedUserId);
    const roleRow = db.user_roles.find((r) => r.user_id === savedUserId);
    if (!profile) {
      window.localStorage.removeItem(getDemoSessionKey(expectedRole));
      setUser(null);
      setLoading(false);
      return;
    }
    setUser({
      id: profile.id,
      email: profile.email,
      profile,
      role: roleRow?.role ?? null,
    });
    setLoading(false);
  }, [expectedRole]);

  const resolveSupabaseUser = React.useCallback(async (authUserId: string, email: string) => {
    const [
      { data: profileData, error: profileError },
      { data: roleData, error: roleError },
    ] = await Promise.all([
      supabase.from("profiles").select("*").eq("id", authUserId).maybeSingle(),
      supabase.from("user_roles").select("role").eq("user_id", authUserId).maybeSingle(),
    ]);

    // A transient fetch failure (e.g. flaky network during a token refresh) must not
    // strip the role from an already-resolved user and bounce them out of the app.
    if ((profileError || roleError) && userRef.current?.id === authUserId) {
      setLoading(false);
      return;
    }

    const profile: Profile = (profileData as Profile | null) ?? {
      id: authUserId,
      full_name: email.split("@")[0],
      email,
      phone: null,
      is_active: true,
      created_at: new Date().toISOString(),
    };

    setUser({
      id: authUserId,
      email,
      profile,
      role: (roleData as { role: AppRole } | null)?.role ?? null,
    });
    setLoading(false);
  }, []);

  React.useEffect(() => {
    if (!isSupabaseConfigured) {
      resolveDemoSession();
      return subscribeDemoState(resolveDemoSession);
    }

    let mounted = true;
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!mounted) return;
      if (session?.user) {
        void resolveSupabaseUser(session.user.id, session.user.email ?? "");
      } else {
        setUser(null);
        setLoading(false);
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!mounted) return;
      if (session?.user) {
        void resolveSupabaseUser(session.user.id, session.user.email ?? "");
      } else {
        setUser(null);
        setLoading(false);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [resolveDemoSession, resolveSupabaseUser]);

  const signInWithPassword = React.useCallback(
    async (email: string, password: string) => {
      const rawEmail = email.trim().toLowerCase();
      if (!isSupabaseConfigured) {
        const normalizedEmail = DEMO_EMAIL_ALIASES[rawEmail] ?? rawEmail;
        const db = getDemoState();
        const profile = db.profiles.find((p) => p.email.toLowerCase() === normalizedEmail);
        if (!profile || password.length < 4) {
          throw new Error("Invalid email or password.");
        }
        const roleRow = db.user_roles.find((r) => r.user_id === profile.id);
        window.localStorage.setItem(getDemoSessionKey(expectedRole), profile.id);
        setUser({
          id: profile.id,
          email: profile.email,
          profile,
          role: roleRow?.role ?? null,
        });
        return;
      }

      const liveEmail = LIVE_EMAIL_ALIASES[rawEmail] ?? rawEmail;
      const { data, error } = await supabase.auth.signInWithPassword({
        email: liveEmail,
        password,
      });
      if (error || !data.user) {
        throw new Error(error?.message || "Invalid login credentials");
      }
      await resolveSupabaseUser(data.user.id, data.user.email ?? liveEmail);
    },
    [expectedRole, resolveSupabaseUser],
  );

  const signOut = React.useCallback(async () => {
    if (!isSupabaseConfigured) {
      if (typeof window !== "undefined") {
        window.localStorage.removeItem(getDemoSessionKey(expectedRole));
      }
      setUser(null);
      return;
    }
    // "local" ends only this browser's session. The default ("global") revokes every
    // session for the account, which logs out anyone else sharing the same login.
    await supabase.auth.signOut({ scope: "local" });
    setUser(null);
  }, [expectedRole]);

  const sendPasswordReset = React.useCallback(async (email: string) => {
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail) throw new Error("Enter your email address");
    if (!isSupabaseConfigured) {
      const db = getDemoState();
      const exists = db.profiles.some((p) => p.email.toLowerCase() === cleanEmail);
      if (!exists) throw new Error("No account found with that email address");
      return;
    }
    const { error } = await supabase.auth.resetPasswordForEmail(cleanEmail, {
      redirectTo: window.location.origin + "/login",
    });
    if (error) throw new Error(error.message);
  }, []);

  const updatePassword = React.useCallback(async (newPassword: string) => {
    if (newPassword.length < 6) {
      throw new Error("Password must be at least 6 characters");
    }
    if (!isSupabaseConfigured) {
      return;
    }
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) throw new Error(error.message);
  }, []);

  const refreshProfile = React.useCallback(async () => {
    if (!isSupabaseConfigured) {
      resolveDemoSession();
      return;
    }
    if (user) {
      await resolveSupabaseUser(user.id, user.email);
    }
  }, [resolveDemoSession, resolveSupabaseUser, user]);

  const isAccountDisabled = Boolean(user && !user.profile.is_active);
  const isAuthorizedForApp = Boolean(
    user && user.profile.is_active && user.role === expectedRole,
  );

  const value = React.useMemo<AuthContextValue>(
    () => ({
      user,
      profile: user?.profile ?? null,
      role: user?.role ?? null,
      loading,
      expectedRole,
      isAuthorizedForApp,
      isAccountDisabled,
      isDemoMode: !isSupabaseConfigured,
      crossAppUrls,
      signInWithPassword,
      signOut,
      sendPasswordReset,
      updatePassword,
      refreshProfile,
    }),
    [
      user,
      loading,
      expectedRole,
      isAuthorizedForApp,
      isAccountDisabled,
      crossAppUrls,
      signInWithPassword,
      signOut,
      sendPasswordReset,
      updatePassword,
      refreshProfile,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = React.useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used inside <AuthProvider>");
  }
  return ctx;
}
