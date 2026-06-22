import { createClient } from "@supabase/supabase-js";
import { env, isSupabaseConfigured } from "./env";
import type { Database } from "@/types/database";

/**
 * Normalize the project URL to its origin. The Supabase client appends its own
 * paths (`/auth/v1`, `/rest/v1`, …), so a value that mistakenly includes a path
 * or trailing slash (e.g. `…supabase.co/rest/v1/`) would produce "Invalid path
 * specified in request URL" errors. Stripping to the origin guards against that.
 */
function normalizeSupabaseUrl(raw: string | undefined): string {
  if (!raw) return "http://localhost:54321";
  try {
    return new URL(raw).origin;
  } catch {
    return raw.replace(/\/+$/, "");
  }
}

/**
 * A single shared Supabase client. When env vars are missing we still create a
 * client against a dummy URL so imports don't crash — the app shows a setup
 * screen via `isSupabaseConfigured` instead.
 */
export const supabase = createClient<Database>(
  normalizeSupabaseUrl(env.supabaseUrl),
  env.supabaseAnonKey ?? "public-anon-key",
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  },
);

export { isSupabaseConfigured };
