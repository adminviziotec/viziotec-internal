import { supabase } from "@/lib/supabase";
import type { AppNotification, NotificationType } from "@/types/database";

export async function listNotifications(limit?: number): Promise<AppNotification[]> {
  let query = supabase.from("notifications").select("*").order("created_at", { ascending: false });
  if (limit) query = query.limit(limit);
  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []) as AppNotification[];
}

export async function getUnreadCount(): Promise<number> {
  const { count, error } = await supabase
    .from("notifications")
    .select("id", { count: "exact", head: true })
    .eq("is_read", false);
  if (error) throw error;
  return count ?? 0;
}

export async function markRead(id: string): Promise<void> {
  const { error } = await supabase.from("notifications").update({ is_read: true }).eq("id", id);
  if (error) throw error;
}

export async function markAllRead(): Promise<void> {
  const { error } = await supabase
    .from("notifications")
    .update({ is_read: true })
    .eq("is_read", false);
  if (error) throw error;
}

export async function removeNotification(id: string): Promise<void> {
  const { error } = await supabase.from("notifications").delete().eq("id", id);
  if (error) throw error;
}

export interface NotifyInput {
  type: NotificationType;
  title: string;
  body?: string;
  link?: string;
}

/**
 * Inserts a notification for each recipient. Best-effort — never throws so it
 * can't break the action that triggered it. Callers should exclude the actor.
 */
export async function notifyUsers(userIds: string[], n: NotifyInput): Promise<void> {
  const recipients = [...new Set(userIds)].filter(Boolean);
  if (recipients.length === 0) return;
  try {
    await supabase.from("notifications").insert(
      recipients.map((user_id) => ({
        user_id,
        type: n.type,
        title: n.title,
        body: n.body ?? null,
        link: n.link ?? null,
      })),
    );
  } catch {
    /* ignore */
  }
}
