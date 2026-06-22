import { useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { isSupabaseConfigured } from "@/lib/env";
import { useAuthStore } from "@/stores/authStore";
import { fetchProfile } from "./api";

/**
 * Bootstraps auth state: reads the current Supabase session, loads the matching
 * profile row, and keeps the store in sync with auth changes.
 */
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { setSession, setProfile, setStatus } = useAuthStore();

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setStatus("unauthenticated");
      return;
    }

    let active = true;

    async function load(session: Awaited<ReturnType<typeof supabase.auth.getSession>>["data"]["session"]) {
      if (!active) return;
      setSession(session);
      if (!session?.user) {
        setProfile(null);
        setStatus("unauthenticated");
        return;
      }
      try {
        const profile = await fetchProfile(session.user.id);
        if (!active) return;
        setProfile(profile);
        setStatus("authenticated");
      } catch {
        if (!active) return;
        setProfile(null);
        setStatus("authenticated");
      }
    }

    supabase.auth.getSession().then(({ data }) => load(data.session));

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      load(session);
    });

    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, [setSession, setProfile, setStatus]);

  return <>{children}</>;
}
