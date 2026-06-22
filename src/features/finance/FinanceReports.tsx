import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { StatCard } from "@/components/StatCard";
import { getYearlyReport } from "./api";
import { formatCurrency } from "@/lib/utils";
import { CircleDollarSign, TrendingDown, TrendingUp } from "lucide-react";

function compact(n: number): string {
  return new Intl.NumberFormat("en-US", { notation: "compact", maximumFractionDigits: 1 }).format(n);
}

const CHART_COLORS = [
  "hsl(245 70% 58%)",
  "hsl(152 56% 40%)",
  "hsl(38 92% 50%)",
  "hsl(0 72% 51%)",
  "hsl(199 89% 48%)",
  "hsl(280 65% 60%)",
  "hsl(20 90% 55%)",
  "hsl(170 60% 45%)",
];

export function FinanceReports() {
  const currentYear = new Date().getFullYear();
  const [year, setYear] = useState(currentYear);
  const years = Array.from({ length: 5 }, (_, i) => currentYear - i);

  const report = useQuery({
    queryKey: ["finance", "report", year],
    queryFn: () => getYearlyReport(year),
  });

  if (report.isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-80 w-full" />
      </div>
    );
  }

  const data = report.data!;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">Annual summary &amp; trends</p>
        <Select value={String(year)} onValueChange={(v) => setYear(Number(v))}>
          <SelectTrigger className="w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {years.map((y) => (
              <SelectItem key={y} value={String(y)}>
                {y}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label={`Revenue ${year}`} value={formatCurrency(data.totalIncome)} icon={TrendingUp} tone="success" />
        <StatCard label={`Expenses ${year}`} value={formatCurrency(data.totalExpense)} icon={TrendingDown} tone="destructive" />
        <StatCard label={`Net profit ${year}`} value={formatCurrency(data.netProfit)} icon={CircleDollarSign} tone="primary" />
      </div>

      {/* Trend */}
      <Card>
        <CardHeader>
          <CardTitle>Revenue, expense &amp; profit trend</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={320}>
            <LineChart data={data.monthly} margin={{ left: 4, right: 8, top: 8 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
              <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
              <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} tickFormatter={compact} width={48} />
              <Tooltip
                contentStyle={{
                  background: "hsl(var(--popover))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: 8,
                  fontSize: 13,
                }}
                formatter={(value: number) => formatCurrency(value)}
              />
              <Legend wrapperStyle={{ fontSize: 13 }} />
              <Line type="monotone" dataKey="income" name="Revenue" stroke="hsl(152 56% 40%)" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="expense" name="Expense" stroke="hsl(0 72% 51%)" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="profit" name="Profit" stroke="hsl(245 70% 58%)" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Category breakdown */}
      <div className="grid gap-6 lg:grid-cols-2">
        <CategoryChart title="Expenses by category" rows={data.expenseByCategory} />
        <CategoryChart title="Income by category" rows={data.incomeByCategory} />
      </div>
    </div>
  );
}

function CategoryChart({ title, rows }: { title: string; rows: { category: string; amount: number }[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        {rows.length === 0 ? (
          <p className="py-12 text-center text-sm text-muted-foreground">No data for this year.</p>
        ) : (
          <ResponsiveContainer width="100%" height={Math.max(160, rows.length * 44)}>
            <BarChart data={rows} layout="vertical" margin={{ left: 8, right: 16 }}>
              <XAxis type="number" hide tickFormatter={compact} />
              <YAxis type="category" dataKey="category" width={120} stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
              <Tooltip
                cursor={{ fill: "hsl(var(--muted))" }}
                contentStyle={{
                  background: "hsl(var(--popover))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: 8,
                  fontSize: 13,
                }}
                formatter={(value: number) => formatCurrency(value)}
              />
              <Bar dataKey="amount" radius={[0, 6, 6, 0]}>
                {rows.map((_, i) => (
                  <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}
