import { supabase } from "@/lib/supabase";
import type { UserProfile } from "@/types/database";

export async function fetchProfile(userId: string): Promise<UserProfile | null> {
  const { data, error } = await supabase
    .from("users")
    .select("*")
    .eq("id", userId)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function signInWithPassword(email: string, password: string) {
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
}

export type SignUpResult =
  | { status: "session" } // confirmed + logged in immediately
  | { status: "confirm" } // needs to confirm via email link
  | { status: "exists" }; // email already registered

/**
 * Self-registration. The DB trigger decides the role — the very first account
 * becomes Owner, everyone after becomes a Team Member — so we never send one.
 */
export async function signUp(params: {
  email: string;
  password: string;
  fullName: string;
  position?: string;
}): Promise<SignUpResult> {
  const { data, error } = await supabase.auth.signUp({
    email: params.email,
    password: params.password,
    options: {
      data: { full_name: params.fullName, position: params.position ?? null },
      emailRedirectTo: `${window.location.origin}/login`,
    },
  });
  if (error) throw error;
  if (data.session) return { status: "session" };
  // Supabase returns a user with an empty identities array when the email is
  // already registered (to avoid leaking which emails exist).
  if (data.user && (data.user.identities?.length ?? 0) === 0) {
    return { status: "exists" };
  }
  return { status: "confirm" };
}

export async function signOut() {
  await supabase.auth.signOut();
}

export async function requestPasswordReset(email: string) {
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/reset-password`,
  });
  if (error) throw error;
}

export async function updatePassword(password: string) {
  const { error } = await supabase.auth.updateUser({ password });
  if (error) throw error;
}
