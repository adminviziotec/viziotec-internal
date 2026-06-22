import { supabase } from "@/lib/supabase";
import type { ActivityLog } from "@/types/database";

export const ACTIVITY_MODULES = ["Invoices", "Projects", "Finance", "Calendar", "Team"] as const;

export interface ActivityListParams {
  module?: string | "all";
  page: number;
  pageSize: number;
}

export interface ActivityListResult {
  rows: ActivityLog[];
  count: number;
}

export async function listActivityLogs(params: ActivityListParams): Promise<ActivityListResult> {
  const { module, page, pageSize } = params;
  const from = (page - 1) * pageSize;

  let query = supabase
    .from("activity_logs")
    .select("*", { count: "exact" })
    .order("created_at", { ascending: false })
    .range(from, from + pageSize - 1);

  if (module && module !== "all") query = query.eq("module", module);

  const { data, error, count } = await query;
  if (error) throw error;
  return { rows: (data ?? []) as ActivityLog[], count: count ?? 0 };
}
