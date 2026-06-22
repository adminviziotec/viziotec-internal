import { supabase } from "@/lib/supabase";
import { logActivity } from "@/lib/activity";
import { removeReceipt, uploadReceipt } from "./upload";
import type { TransactionFormValues } from "./schema";
import type { CompanyCash, FinanceTransaction, TransactionType } from "@/types/database";

export async function getCompanyCash(): Promise<CompanyCash> {
  const { data, error } = await supabase.from("company_cash").select("*").maybeSingle();
  if (error) throw error;
  return (data as CompanyCash | null) ?? { total_income: 0, total_expense: 0, current_money: 0 };
}

export interface TransactionFilters {
  type?: TransactionType | "all";
  category?: string | "all";
  search?: string;
  from?: string;
  to?: string;
}

export async function listTransactions(filters: TransactionFilters = {}): Promise<FinanceTransaction[]> {
  let query = supabase
    .from("finance_transactions")
    .select("*")
    .order("transaction_date", { ascending: false })
    .order("created_at", { ascending: false });

  if (filters.type && filters.type !== "all") query = query.eq("type", filters.type);
  if (filters.category && filters.category !== "all") query = query.eq("category", filters.category);
  if (filters.from) query = query.gte("transaction_date", filters.from);
  if (filters.to) query = query.lte("transaction_date", filters.to);
  if (filters.search && filters.search.trim()) {
    const term = `%${filters.search.trim()}%`;
    query = query.or(`title.ilike.${term},description.ilike.${term}`);
  }

  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []) as FinanceTransaction[];
}

export interface MonthlyPoint {
  month: string; // "Jan"
  income: number;
  expense: number;
  profit: number;
}

export interface YearlyReport {
  monthly: MonthlyPoint[];
  totalIncome: number;
  totalExpense: number;
  netProfit: number;
  expenseByCategory: { category: string; amount: number }[];
  incomeByCategory: { category: string; amount: number }[];
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export async function getYearlyReport(year: number): Promise<YearlyReport> {
  const { data, error } = await supabase
    .from("finance_transactions")
    .select("type, category, amount, transaction_date")
    .gte("transaction_date", `${year}-01-01`)
    .lte("transaction_date", `${year}-12-31`);
  if (error) throw error;

  const rows = (data ?? []) as Pick<FinanceTransaction, "type" | "category" | "amount" | "transaction_date">[];

  const monthly: MonthlyPoint[] = MONTHS.map((m) => ({ month: m, income: 0, expense: 0, profit: 0 }));
  const expenseCat = new Map<string, number>();
  const incomeCat = new Map<string, number>();
  let totalIncome = 0;
  let totalExpense = 0;

  for (const r of rows) {
    const m = new Date(r.transaction_date).getMonth();
    const amt = Number(r.amount);
    if (r.type === "income") {
      monthly[m].income += amt;
      totalIncome += amt;
      incomeCat.set(r.category, (incomeCat.get(r.category) ?? 0) + amt);
    } else {
      monthly[m].expense += amt;
      totalExpense += amt;
      expenseCat.set(r.category, (expenseCat.get(r.category) ?? 0) + amt);
    }
  }
  monthly.forEach((p) => (p.profit = p.income - p.expense));

  const toSorted = (map: Map<string, number>) =>
    [...map.entries()].map(([category, amount]) => ({ category, amount })).sort((a, b) => b.amount - a.amount);

  return {
    monthly,
    totalIncome,
    totalExpense,
    netProfit: totalIncome - totalExpense,
    expenseByCategory: toSorted(expenseCat),
    incomeByCategory: toSorted(incomeCat),
  };
}

export async function createTransaction(
  values: TransactionFormValues,
  receipt?: File | null,
): Promise<void> {
  const { data: userData } = await supabase.auth.getUser();
  const userId = userData.user?.id;
  let receipt_url: string | null = null;
  if (receipt && userId) receipt_url = await uploadReceipt(receipt, userId);

  const { error } = await supabase.from("finance_transactions").insert({
    type: values.type,
    category: values.category,
    title: values.title,
    description: values.description || null,
    amount: values.amount,
    transaction_date: values.transaction_date,
    project_id: values.project_id || null,
    receipt_url,
    created_by: userId ?? null,
  });
  if (error) {
    if (receipt_url) await removeReceipt(receipt_url); // roll back orphaned upload
    throw error;
  }
  void logActivity("Finance", `recorded ${values.type} "${values.title}"`, { amount: values.amount });
}

export async function updateTransaction(
  id: string,
  values: TransactionFormValues,
  receipt?: File | null,
  existingReceiptUrl?: string | null,
): Promise<void> {
  const { data: userData } = await supabase.auth.getUser();
  const userId = userData.user?.id;
  let receipt_url = existingReceiptUrl ?? null;
  if (receipt && userId) {
    receipt_url = await uploadReceipt(receipt, userId);
    if (existingReceiptUrl) await removeReceipt(existingReceiptUrl);
  }

  const { error } = await supabase
    .from("finance_transactions")
    .update({
      type: values.type,
      category: values.category,
      title: values.title,
      description: values.description || null,
      amount: values.amount,
      transaction_date: values.transaction_date,
      project_id: values.project_id || null,
      receipt_url,
    })
    .eq("id", id);
  if (error) throw error;
  void logActivity("Finance", `updated transaction "${values.title}"`, { id });
}

export async function deleteTransaction(tx: FinanceTransaction): Promise<void> {
  const { error } = await supabase.from("finance_transactions").delete().eq("id", tx.id);
  if (error) throw error;
  if (tx.receipt_url) await removeReceipt(tx.receipt_url);
  void logActivity("Finance", `deleted transaction "${tx.title}"`, { id: tx.id });
}
