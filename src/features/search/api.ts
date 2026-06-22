import { supabase } from "@/lib/supabase";
import type { InvoiceStatus, ProjectStatus } from "@/types/database";

export interface SearchResults {
  invoices: { id: string; invoice_number: string; client_name: string; grand_total: number; status: InvoiceStatus }[];
  projects: { id: string; project_name: string; client_name: string | null; status: ProjectStatus }[];
  events: { id: string; title: string; start_datetime: string }[];
  clients: string[];
}

export async function globalSearch(term: string): Promise<SearchResults> {
  const t = `%${term.trim()}%`;

  const [inv, proj, ev] = await Promise.all([
    supabase
      .from("invoices")
      .select("id, invoice_number, client_name, grand_total, status")
      .or(`invoice_number.ilike.${t},client_name.ilike.${t},project_name.ilike.${t}`)
      .limit(6),
    supabase
      .from("projects")
      .select("id, project_name, client_name, status")
      .or(`project_name.ilike.${t},client_name.ilike.${t}`)
      .limit(6),
    supabase.from("calendar_events").select("id, title, start_datetime").ilike("title", t).limit(6),
  ]);

  const invoices = (inv.data ?? []) as SearchResults["invoices"];
  const projects = (proj.data ?? []) as SearchResults["projects"];
  const events = (ev.data ?? []) as SearchResults["events"];

  const lower = term.trim().toLowerCase();
  const clients = [
    ...new Set(
      [...invoices.map((i) => i.client_name), ...projects.map((p) => p.client_name ?? "")]
        .filter((c) => c && c.toLowerCase().includes(lower)),
    ),
  ].slice(0, 6);

  return { invoices, projects, events, clients };
}
