import { supabase } from "@/lib/supabase";
import { logActivity } from "@/lib/activity";
import { computeTotals, lineTotal } from "./calc";
import type { InvoiceFormValues } from "./schema";
import type { Invoice, InvoiceItem, InvoiceStatus } from "@/types/database";

export interface InvoiceListParams {
  search?: string;
  status?: InvoiceStatus | "all";
  page: number;
  pageSize: number;
  sortBy?: "invoice_date" | "grand_total" | "invoice_number" | "client_name";
  sortDir?: "asc" | "desc";
}

export interface InvoiceListResult {
  rows: Invoice[];
  count: number;
}

export async function listInvoices(params: InvoiceListParams): Promise<InvoiceListResult> {
  const { search, status, page, pageSize, sortBy = "invoice_date", sortDir = "desc" } = params;
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  let query = supabase.from("invoices").select("*", { count: "exact" });

  if (status && status !== "all") query = query.eq("status", status);
  if (search && search.trim()) {
    const term = `%${search.trim()}%`;
    query = query.or(
      `invoice_number.ilike.${term},client_name.ilike.${term},project_name.ilike.${term}`,
    );
  }

  query = query.order(sortBy, { ascending: sortDir === "asc" }).range(from, to);

  const { data, error, count } = await query;
  if (error) throw error;
  return { rows: (data ?? []) as Invoice[], count: count ?? 0 };
}

export interface InvoiceWithItems extends Invoice {
  items: InvoiceItem[];
}

export async function getInvoice(id: string): Promise<InvoiceWithItems> {
  const [invoiceRes, itemsRes] = await Promise.all([
    supabase.from("invoices").select("*").eq("id", id).single(),
    supabase.from("invoice_items").select("*").eq("invoice_id", id).order("sort_order"),
  ]);
  if (invoiceRes.error) throw invoiceRes.error;
  if (itemsRes.error) throw itemsRes.error;
  return { ...(invoiceRes.data as Invoice), items: (itemsRes.data ?? []) as InvoiceItem[] };
}

export async function generateInvoiceNumber(): Promise<string> {
  const { data, error } = await supabase.rpc("next_invoice_number");
  if (error) throw error;
  return data as string;
}

function itemRows(invoiceId: string, values: InvoiceFormValues) {
  return values.items.map((it, idx) => ({
    invoice_id: invoiceId,
    service_name: it.service_name,
    description: it.description ?? null,
    quantity: it.quantity,
    unit_price: it.unit_price,
    total_price: lineTotal(it),
    sort_order: idx,
  }));
}

function invoiceColumns(values: InvoiceFormValues) {
  const totals = computeTotals(values.items, values.tax_percentage, values.discount);
  return {
    client_name: values.client_name,
    client_email: values.client_email || null,
    client_phone: values.client_phone || null,
    project_name: values.project_name || null,
    invoice_date: values.invoice_date,
    due_date: values.due_date || null,
    status: values.status,
    subtotal: totals.subtotal,
    tax_percentage: totals.taxPercentage,
    tax_amount: totals.taxAmount,
    discount: totals.discount,
    grand_total: totals.grandTotal,
    notes: values.notes || null,
  };
}

export async function createInvoice(values: InvoiceFormValues): Promise<Invoice> {
  const invoice_number = await generateInvoiceNumber();
  const { data: userData } = await supabase.auth.getUser();

  const { data, error } = await supabase
    .from("invoices")
    .insert({ ...invoiceColumns(values), invoice_number, created_by: userData.user?.id ?? null })
    .select()
    .single();
  if (error) throw error;
  const invoice = data as Invoice;

  const { error: itemsError } = await supabase
    .from("invoice_items")
    .insert(itemRows(invoice.id, values));
  if (itemsError) throw itemsError;

  void logActivity("Invoices", `created invoice ${invoice.invoice_number}`, {
    invoice_id: invoice.id,
  });
  return invoice;
}

export async function updateInvoice(id: string, values: InvoiceFormValues): Promise<void> {
  const { error } = await supabase.from("invoices").update(invoiceColumns(values)).eq("id", id);
  if (error) throw error;

  // Replace line items wholesale — simplest correct approach for edits.
  await supabase.from("invoice_items").delete().eq("invoice_id", id);
  const { error: itemsError } = await supabase.from("invoice_items").insert(itemRows(id, values));
  if (itemsError) throw itemsError;

  void logActivity("Invoices", `updated invoice`, { invoice_id: id });
}

export async function updateInvoiceStatus(id: string, status: InvoiceStatus): Promise<void> {
  const { error } = await supabase.from("invoices").update({ status }).eq("id", id);
  if (error) throw error;
  void logActivity("Invoices", `marked invoice ${status}`, { invoice_id: id, status });
}

export async function deleteInvoice(id: string): Promise<void> {
  const { error } = await supabase.from("invoices").delete().eq("id", id);
  if (error) throw error;
  void logActivity("Invoices", `deleted invoice`, { invoice_id: id });
}
