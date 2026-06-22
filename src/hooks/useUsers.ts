import { useQuery } from "@tanstack/react-query";
import { listUsers } from "@/features/team/api";
import type { UserProfile } from "@/types/database";

/** Shared list of all users, used to populate assignee / manager pickers. */
export function useUsers() {
  return useQuery({ queryKey: ["team", "users"], queryFn: listUsers, staleTime: 60_000 });
}

/** Build a quick id → profile lookup. */
export function useUserMap(): Record<string, UserProfile> {
  const { data } = useUsers();
  return (data ?? []).reduce<Record<string, UserProfile>>((acc, u) => {
    acc[u.id] = u;
    return acc;
  }, {});
}
