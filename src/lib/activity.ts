import { supabase } from "@/lib/supabase";

/**
 * Records an entry in activity_logs. Best-effort — never throws, so a logging
 * failure can't break the user action it accompanies.
 */
export async function logActivity(
  module: string,
  action: string,
  metadata: Record<string, unknown> = {},
): Promise<void> {
  try {
    const { data } = await supabase.auth.getUser();
    await supabase.from("activity_logs").insert({
      user_id: data.user?.id ?? null,
      module,
      action,
      metadata,
    });
  } catch {
    /* ignore logging errors */
  }
}
