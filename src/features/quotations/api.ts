import { supabase } from "@/lib/supabase";
import { logActivity } from "@/lib/activity";
import { computeTotals, lineTotal } from "@/features/invoices/calc";
import { createInvoice } from "@/features/invoices/api";
import type { InvoiceFormValues } from "@/features/invoices/schema";
import type { QuotationFormValues } from "./schema";
import type { Invoice, Quotation, QuotationItem, QuotationStatus } from "@/types/database";

export interface QuotationListParams {
  search?: string;
  status?: QuotationStatus | "all";
  page: number;
  pageSize: number;
}

export interface QuotationListResult {
  rows: Quotation[];
  count: number;
}

export async function listQuotations(params: QuotationListParams): Promise<QuotationListResult> {
  const { search, status, page, pageSize } = params;
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  let query = supabase.from("quotations").select("*", { count: "exact" });

  if (status && status !== "all") query = query.eq("status", status);
  if (search && search.trim()) {
    const term = `%${search.trim()}%`;
    query = query.or(
      `quotation_number.ilike.${term},client_name.ilike.${term},project_name.ilike.${term}`,
    );
  }

  query = query.order("quotation_date", { ascending: false }).range(from, to);

  const { data, error, count } = await query;
  if (error) throw error;
  return { rows: (data ?? []) as Quotation[], count: count ?? 0 };
}

export interface QuotationWithItems extends Quotation {
  items: QuotationItem[];
}

export async function getQuotation(id: string): Promise<QuotationWithItems> {
  const [quotationRes, itemsRes] = await Promise.all([
    supabase.from("quotations").select("*").eq("id", id).single(),
    supabase.from("quotation_items").select("*").eq("quotation_id", id).order("sort_order"),
  ]);
  if (quotationRes.error) throw quotationRes.error;
  if (itemsRes.error) throw itemsRes.error;
  return { ...(quotationRes.data as Quotation), items: (itemsRes.data ?? []) as QuotationItem[] };
}

export async function generateQuotationNumber(): Promise<string> {
  const { data, error } = await supabase.rpc("next_quotation_number");
  if (error) throw error;
  return data as string;
}

function itemRows(quotationId: string, values: QuotationFormValues) {
  return values.items.map((it, idx) => ({
    quotation_id: quotationId,
    service_name: it.service_name,
    description: it.description ?? null,
    quantity: it.quantity,
    unit_price: it.unit_price,
    total_price: lineTotal(it),
    sort_order: idx,
  }));
}

function quotationColumns(values: QuotationFormValues) {
  const totals = computeTotals(values.items, values.tax_percentage, values.discount);
  return {
    client_name: values.client_name,
    client_email: values.client_email || null,
    client_phone: values.client_phone || null,
    project_name: values.project_name || null,
    quotation_date: values.quotation_date,
    valid_until: values.valid_until || null,
    status: values.status,
    subtotal: totals.subtotal,
    tax_percentage: totals.taxPercentage,
    tax_amount: totals.taxAmount,
    discount: totals.discount,
    grand_total: totals.grandTotal,
    notes: values.notes || null,
  };
}

export async function createQuotation(values: QuotationFormValues): Promise<Quotation> {
  const quotation_number = await generateQuotationNumber();
  const { data: userData } = await supabase.auth.getUser();

  const { data, error } = await supabase
    .from("quotations")
    .insert({ ...quotationColumns(values), quotation_number, created_by: userData.user?.id ?? null })
    .select()
    .single();
  if (error) throw error;
  const quotation = data as Quotation;

  const { error: itemsError } = await supabase
    .from("quotation_items")
    .insert(itemRows(quotation.id, values));
  if (itemsError) throw itemsError;

  void logActivity("Quotations", `created quotation ${quotation.quotation_number}`, {
    quotation_id: quotation.id,
  });
  return quotation;
}

export async function updateQuotation(id: string, values: QuotationFormValues): Promise<void> {
  const { error } = await supabase.from("quotations").update(quotationColumns(values)).eq("id", id);
  if (error) throw error;

  await supabase.from("quotation_items").delete().eq("quotation_id", id);
  const { error: itemsError } = await supabase.from("quotation_items").insert(itemRows(id, values));
  if (itemsError) throw itemsError;

  void logActivity("Quotations", `updated quotation`, { quotation_id: id });
}

export async function updateQuotationStatus(id: string, status: QuotationStatus): Promise<void> {
  const { error } = await supabase.from("quotations").update({ status }).eq("id", id);
  if (error) throw error;
  void logActivity("Quotations", `marked quotation ${status}`, { quotation_id: id, status });
}

export async function deleteQuotation(id: string): Promise<void> {
  const { error } = await supabase.from("quotations").delete().eq("id", id);
  if (error) throw error;
  void logActivity("Quotations", `deleted quotation`, { quotation_id: id });
}

/**
 * Creates a new draft invoice from a quotation's client + line items, and marks
 * the quotation as accepted. Returns the new invoice. The quotation is kept as a
 * record; nothing is deleted.
 */
export async function convertQuotationToInvoice(q: QuotationWithItems): Promise<Invoice> {
  const values: InvoiceFormValues = {
    client_name: q.client_name,
    client_email: q.client_email ?? "",
    client_phone: q.client_phone ?? "",
    project_name: q.project_name ?? "",
    invoice_date: new Date().toISOString().slice(0, 10),
    due_date: "",
    status: "draft",
    tax_percentage: q.tax_percentage,
    discount: q.discount,
    notes: q.notes ?? "",
    items: q.items.map((it) => ({
      service_name: it.service_name,
      description: it.description ?? "",
      quantity: it.quantity,
      unit_price: it.unit_price,
    })),
  };

  const invoice = await createInvoice(values);
  await updateQuotationStatus(q.id, "accepted").catch(() => {});
  void logActivity(
    "Quotations",
    `converted ${q.quotation_number} to invoice ${invoice.invoice_number}`,
    { quotation_id: q.id, invoice_id: invoice.id },
  );
  return invoice;
}
