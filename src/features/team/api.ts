import { supabase } from "@/lib/supabase";
import type { UserProfile, UserRole } from "@/types/database";

export async function listUsers(): Promise<UserProfile[]> {
  const { data, error } = await supabase
    .from("users")
    .select("*")
    .order("created_at", { ascending: true });
  if (error) throw error;
  return (data ?? []) as UserProfile[];
}

export interface InviteUserInput {
  email: string;
  full_name: string;
  role: UserRole;
  position?: string;
}

/**
 * Invites a user via the `invite-user` Edge Function (which holds the
 * service-role key server-side). Surfaces a friendly error if the function
 * hasn't been deployed yet.
 */
export async function inviteUser(input: InviteUserInput): Promise<void> {
  const { data, error } = await supabase.functions.invoke("invite-user", {
    body: {
      email: input.email,
      full_name: input.full_name,
      role: input.role,
      position: input.position,
      redirect_to: `${window.location.origin}/reset-password`,
    },
  });

  if (error) {
    // Try to extract the function's JSON error message.
    let message = error.message;
    const ctx = (error as { context?: Response }).context;
    if (ctx && typeof ctx.json === "function") {
      try {
        const payload = await ctx.json();
        if (payload?.error) message = payload.error;
      } catch {
        /* ignore */
      }
    }
    if (/Failed to send a request|not found|404/i.test(message)) {
      throw new Error(
        "The invite-user function isn't deployed yet. Run `supabase functions deploy invite-user`.",
      );
    }
    throw new Error(message);
  }
  if (data?.error) throw new Error(data.error);
}

export async function updateUserRole(userId: string, role: UserRole): Promise<void> {
  const { error } = await supabase.from("users").update({ role }).eq("id", userId);
  if (error) throw error;
}

export async function setUserActive(userId: string, isActive: boolean): Promise<void> {
  const { error } = await supabase.from("users").update({ is_active: isActive }).eq("id", userId);
  if (error) throw error;
}

export async function deleteUserProfile(userId: string): Promise<void> {
  const { error } = await supabase.from("users").delete().eq("id", userId);
  if (error) throw error;
}
