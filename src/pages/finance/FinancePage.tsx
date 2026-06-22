import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { CircleDollarSign, Plus, Search, TrendingDown, TrendingUp, Wallet } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { StatCard } from "@/components/StatCard";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { TransactionsTable } from "@/features/finance/TransactionsTable";
import { TransactionFormDialog } from "@/features/finance/TransactionFormDialog";
import { FinanceReports } from "@/features/finance/FinanceReports";
import { getCompanyCash, listTransactions, type TransactionFilters } from "@/features/finance/api";
import { useDebounce } from "@/hooks/useDebounce";
import { formatCurrency } from "@/lib/utils";
import { EXPENSE_CATEGORIES, INCOME_CATEGORIES } from "@/lib/constants";
import type { FinanceTransaction, TransactionType } from "@/types/database";

const ALL_CATEGORIES = [...INCOME_CATEGORIES, ...EXPENSE_CATEGORIES];

export function FinancePage() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogType, setDialogType] = useState<TransactionType>("income");
  const [editing, setEditing] = useState<FinanceTransaction | null>(null);

  const [search, setSearch] = useState("");
  const [type, setType] = useState<TransactionType | "all">("all");
  const [category, setCategory] = useState<string>("all");
  const debouncedSearch = useDebounce(search);

  const firstOfMonth = useMemo(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1).toISOString().slice(0, 10);
  }, []);

  const cash = useQuery({ queryKey: ["finance", "cash"], queryFn: getCompanyCash });
  const monthTx = useQuery({
    queryKey: ["finance", "month", firstOfMonth],
    queryFn: () => listTransactions({ from: firstOfMonth }),
  });

  const filters: TransactionFilters = { type, category, search: debouncedSearch };
  const txQuery = useQuery({
    queryKey: ["finance", "list", filters],
    queryFn: () => listTransactions(filters),
  });

  const monthRevenue = (monthTx.data ?? []).filter((t) => t.type === "income").reduce((s, t) => s + Number(t.amount), 0);
  const monthExpense = (monthTx.data ?? []).filter((t) => t.type === "expense").reduce((s, t) => s + Number(t.amount), 0);

  function openAdd(t: TransactionType) {
    setEditing(null);
    setDialogType(t);
    setDialogOpen(true);
  }
  function openEdit(tx: FinanceTransaction) {
    setEditing(tx);
    setDialogType(tx.type);
    setDialogOpen(true);
  }

  return (
    <div>
      <PageHeader title="Finance" description="Track income, expenses and company cash.">
        <Button variant="outline" className="border-success/40 text-success hover:text-success" onClick={() => openAdd("income")}>
          <Plus className="h-4 w-4" /> Income
        </Button>
        <Button variant="outline" className="border-destructive/40 text-destructive hover:text-destructive" onClick={() => openAdd("expense")}>
          <Plus className="h-4 w-4" /> Expense
        </Button>
      </PageHeader>

      {/* Summary */}
      <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Current Cash" value={formatCurrency(cash.data?.current_money)} icon={Wallet} tone="primary" loading={cash.isLoading} />
        <StatCard label="Revenue (This Month)" value={formatCurrency(monthRevenue)} icon={TrendingUp} tone="success" loading={monthTx.isLoading} />
        <StatCard label="Expenses (This Month)" value={formatCurrency(monthExpense)} icon={TrendingDown} tone="destructive" loading={monthTx.isLoading} />
        <StatCard label="Net (This Month)" value={formatCurrency(monthRevenue - monthExpense)} icon={CircleDollarSign} tone="warning" loading={monthTx.isLoading} />
      </div>

      <Tabs defaultValue="transactions">
        <TabsList>
          <TabsTrigger value="transactions">Transactions</TabsTrigger>
          <TabsTrigger value="reports">Reports</TabsTrigger>
        </TabsList>

        <TabsContent value="transactions">
          <Card className="mb-4 p-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input placeholder="Search transactions…" value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
              </div>
              <Select value={type} onValueChange={(v) => setType(v as TransactionType | "all")}>
                <SelectTrigger className="sm:w-36">
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All types</SelectItem>
                  <SelectItem value="income">Income</SelectItem>
                  <SelectItem value="expense">Expense</SelectItem>
                </SelectContent>
              </Select>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger className="sm:w-48">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All categories</SelectItem>
                  {ALL_CATEGORIES.map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </Card>

          <Card className="overflow-hidden">
            {txQuery.isLoading ? (
              <div className="space-y-2 p-4">
                {Array.from({ length: 6 }).map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : (
              <TransactionsTable transactions={txQuery.data ?? []} onEdit={openEdit} />
            )}
          </Card>
        </TabsContent>

        <TabsContent value="reports">
          <FinanceReports />
        </TabsContent>
      </Tabs>

      <TransactionFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        defaultType={dialogType}
        transaction={editing}
      />
    </div>
  );
}
