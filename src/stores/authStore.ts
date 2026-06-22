import { create } from "zustand";
import type { Session } from "@supabase/supabase-js";
import type { UserProfile, UserRole } from "@/types/database";

type AuthStatus = "loading" | "authenticated" | "unauthenticated";

interface AuthState {
  status: AuthStatus;
  session: Session | null;
  profile: UserProfile | null;
  setSession: (session: Session | null) => void;
  setProfile: (profile: UserProfile | null) => void;
  setStatus: (status: AuthStatus) => void;
  reset: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  status: "loading",
  session: null,
  profile: null,
  setSession: (session) => set({ session }),
  setProfile: (profile) => set({ profile }),
  setStatus: (status) => set({ status }),
  reset: () => set({ status: "unauthenticated", session: null, profile: null }),
}));

/** Role helpers usable outside React. */
export const roleIs = (role: UserRole | undefined, ...allowed: UserRole[]) =>
  role !== undefined && allowed.includes(role);

export const canManage = (role: UserRole | undefined) =>
  roleIs(role, "owner", "co_owner");
