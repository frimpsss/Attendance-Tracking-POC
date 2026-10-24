import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "./database.types";

const metaEnv = (typeof import.meta !== "undefined" && (import.meta as unknown as { env?: Record<string, string> }).env) || {};

const cleanEnvValue = (val: string | undefined): string =>
  (val ?? "").trim().replace(/^['"]|['"]$/g, "").trim();

export const SUPABASE_URL = cleanEnvValue(
  metaEnv.VITE_SUPABASE_URL ||
    (typeof process !== "undefined" ? process.env?.VITE_SUPABASE_URL : undefined),
);

export const SUPABASE_PUBLISHABLE_KEY = cleanEnvValue(
  metaEnv.VITE_SUPABASE_PUBLISHABLE_KEY ||
    metaEnv.VITE_SUPABASE_ANON_KEY ||
    (typeof process !== "undefined"
      ? process.env?.VITE_SUPABASE_PUBLISHABLE_KEY || process.env?.VITE_SUPABASE_ANON_KEY
      : undefined),
);

const isTestEnv =
  metaEnv.MODE === "test" ||
  (typeof process !== "undefined" && Boolean(process.env?.VITEST) && !process.env?.RUN_LIVE_SUPABASE_TESTS);

export const isSupabaseConfigured =
  !isTestEnv &&
  Boolean(SUPABASE_URL) &&
  Boolean(SUPABASE_PUBLISHABLE_KEY) &&
  !SUPABASE_URL.includes("your-project-ref.supabase.co") &&
  !SUPABASE_PUBLISHABLE_KEY.endsWith("...");

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const supabase: SupabaseClient<any> = createClient(
  isSupabaseConfigured ? SUPABASE_URL : "https://placeholder-project.supabase.co",
  isSupabaseConfigured ? SUPABASE_PUBLISHABLE_KEY : "placeholder-anon-key",
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  },
);

export function getCrossAppUrls() {
  return {
    admin: metaEnv.VITE_ADMIN_APP_URL || "http://localhost:5173",
    lecturer: metaEnv.VITE_LECTURER_APP_URL || "http://localhost:5174",
    student: metaEnv.VITE_STUDENT_APP_URL || "http://localhost:5175",
  };
}
