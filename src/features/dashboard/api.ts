import { supabase } from "@/lib/supabase";
import type {
  ActivityLog,
  CalendarEvent,
  CompanyCash,
  InvoiceStatus,
  Project,
  ProjectStatus,
} from "@/types/database";

export interface ProjectStats {
  leads: number;
  ongoing: number;
  existing: number;
  finished: number;
}

export async function getProjectStats(): Promise<ProjectStats> {
  const { data, error } = await supabase.from("projects").select("status");
  if (error) throw error;
  const rows = (data ?? []) as { status: ProjectStatus }[];
  const count = (...s: ProjectStatus[]) => rows.filter((r) => s.includes(r.status)).length;
  return {
    leads: count("lead", "proposal_sent", "negotiation"),
    ongoing: count("ongoing"),
    existing: count("existing"),
    finished: count("finished"),
  };
}

export interface FinanceSummary {
  currentCash: number;
  monthRevenue: number;
  monthExpense: number;
  netProfit: number;
}

export async function getFinanceSummary(): Promise<FinanceSummary> {
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  const iso = startOfMonth.toISOString().slice(0, 10);

  const [cashRes, monthRes] = await Promise.all([
    supabase.from("company_cash").select("*").maybeSingle(),
    supabase
      .from("finance_transactions")
      .select("type, amount")
      .gte("transaction_date", iso),
  ]);
  if (cashRes.error) throw cashRes.error;
  if (monthRes.error) throw monthRes.error;

  const cash = (cashRes.data as CompanyCash | null) ?? {
    total_income: 0,
    total_expense: 0,
    current_money: 0,
  };
  const rows = (monthRes.data ?? []) as { type: "income" | "expense"; amount: number }[];
  const monthRevenue = rows.filter((r) => r.type === "income").reduce((s, r) => s + Number(r.amount), 0);
  const monthExpense = rows.filter((r) => r.type === "expense").reduce((s, r) => s + Number(r.amount), 0);

  return {
    currentCash: Number(cash.current_money),
    monthRevenue,
    monthExpense,
    netProfit: monthRevenue - monthExpense,
  };
}

export interface InvoiceBucket {
  count: number;
  value: number;
}
export interface InvoiceStatusSummary {
  sent: InvoiceBucket;
  overdue: InvoiceBucket;
  paid: InvoiceBucket;
}

/**
 * Counts and total values of invoices by status. A "sent" invoice past its due
 * date is treated as overdue, matching the invoice list's effective status.
 */
export async function getInvoiceStatusSummary(): Promise<InvoiceStatusSummary> {
  const { data, error } = await supabase
    .from("invoices")
    .select("status, grand_total, due_date")
    .in("status", ["sent", "overdue", "paid"]);
  if (error) throw error;

  const rows = (data ?? []) as { status: InvoiceStatus; grand_total: number; due_date: string | null }[];
  const today = new Date(new Date().toDateString());
  const summary: InvoiceStatusSummary = {
    sent: { count: 0, value: 0 },
    overdue: { count: 0, value: 0 },
    paid: { count: 0, value: 0 },
  };

  for (const r of rows) {
    let bucket: keyof InvoiceStatusSummary;
    if (r.status === "paid") bucket = "paid";
    else if (r.status === "overdue" || (r.status === "sent" && r.due_date && new Date(r.due_date) < today))
      bucket = "overdue";
    else bucket = "sent";
    summary[bucket].count += 1;
    summary[bucket].value += Number(r.grand_total);
  }
  return summary;
}

export async function getMyTasks(userId: string): Promise<Project[]> {
  const { data, error } = await supabase
    .from("projects")
    .select("*")
    .contains("assigned_to", [userId])
    .not("status", "in", "(finished,cancelled)")
    .order("deadline", { ascending: true, nullsFirst: false })
    .limit(6);
  if (error) throw error;
  return (data ?? []) as Project[];
}

export async function getUpcomingEvents(): Promise<CalendarEvent[]> {
  const now = new Date().toISOString();
  const weekAhead = new Date(Date.now() + 7 * 864e5).toISOString();
  const { data, error } = await supabase
    .from("calendar_events")
    .select("*")
    .gte("start_datetime", now)
    .lte("start_datetime", weekAhead)
    .order("start_datetime", { ascending: true })
    .limit(8);
  if (error) throw error;
  return (data ?? []) as CalendarEvent[];
}

export async function getRecentActivity(): Promise<ActivityLog[]> {
  const { data, error } = await supabase
    .from("activity_logs")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(10);
  if (error) throw error;
  return (data ?? []) as ActivityLog[];
}
