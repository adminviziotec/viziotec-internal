import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import {
  Activity,
  AlertTriangle,
  CalendarDays,
  CheckCircle2,
  CircleDollarSign,
  Send,
  Sparkles,
  TrendingDown,
  TrendingUp,
  Wallet,
  Briefcase,
  Target,
  Layers,
  type LucideIcon,
} from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { StatCard } from "@/components/StatCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/features/auth/useAuth";
import {
  getFinanceSummary,
  getInvoiceStatusSummary,
  getMyTasks,
  getProjectStats,
  getRecentActivity,
  getUpcomingEvents,
} from "@/features/dashboard/api";
import { cn, formatCurrency, formatDate, formatDateTime, relativeTime } from "@/lib/utils";
import { EVENT_TYPE_LABELS, PRIORITY_TONES, PRIORITY_LABELS } from "@/lib/constants";

export function DashboardPage() {
  const { profile, canManageFinance, canManageInvoices, userId } = useAuth();
  const firstName = (profile?.full_name || "there").split(" ")[0];

  const stats = useQuery({ queryKey: ["dashboard", "projectStats"], queryFn: getProjectStats });
  const finance = useQuery({
    queryKey: ["dashboard", "finance"],
    queryFn: getFinanceSummary,
    enabled: canManageFinance,
  });
  const invoiceSummary = useQuery({
    queryKey: ["dashboard", "invoiceSummary"],
    queryFn: getInvoiceStatusSummary,
    enabled: canManageInvoices,
  });
  const tasks = useQuery({
    queryKey: ["dashboard", "tasks", userId],
    queryFn: () => getMyTasks(userId!),
    enabled: !!userId,
  });
  const events = useQuery({ queryKey: ["dashboard", "events"], queryFn: getUpcomingEvents });
  const activity = useQuery({ queryKey: ["dashboard", "activity"], queryFn: getRecentActivity });

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Good to see you, ${firstName} 👋`}
        description="Here's what's happening across Viziotec today."
      />

      {/* Project statistics */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Active Leads" value={stats.data?.leads ?? 0} icon={Target} tone="warning" loading={stats.isLoading} />
        <StatCard label="Ongoing Projects" value={stats.data?.ongoing ?? 0} icon={Briefcase} tone="primary" loading={stats.isLoading} />
        <StatCard label="Existing Clients" value={stats.data?.existing ?? 0} icon={Layers} tone="success" loading={stats.isLoading} />
        <StatCard label="Finished Projects" value={stats.data?.finished ?? 0} icon={CheckCircle2} tone="muted" loading={stats.isLoading} />
      </div>

      {/* Finance summary — owners/co-owners only */}
      {canManageFinance && (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard label="Current Cash" value={formatCurrency(finance.data?.currentCash)} icon={Wallet} tone="primary" loading={finance.isLoading} />
          <StatCard label="Revenue (This Month)" value={formatCurrency(finance.data?.monthRevenue)} icon={TrendingUp} tone="success" loading={finance.isLoading} />
          <StatCard label="Expenses (This Month)" value={formatCurrency(finance.data?.monthExpense)} icon={TrendingDown} tone="destructive" loading={finance.isLoading} />
          <StatCard label="Net Profit" value={formatCurrency(finance.data?.netProfit)} icon={CircleDollarSign} tone="warning" loading={finance.isLoading} />
        </div>
      )}

      {/* Invoice status — owners/co-owners only */}
      {canManageInvoices && (
        <div>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-muted-foreground">Invoices</h2>
            <Link to="/invoices" className="text-sm font-medium text-primary hover:underline">
              View invoices
            </Link>
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            <InvoiceStatusCard
              label="Awaiting Payment"
              hint="Sent, not yet paid"
              icon={Send}
              tone="primary"
              count={invoiceSummary.data?.sent.count}
              value={invoiceSummary.data?.sent.value}
              loading={invoiceSummary.isLoading}
            />
            <InvoiceStatusCard
              label="Overdue"
              hint="Past due date"
              icon={AlertTriangle}
              tone="destructive"
              count={invoiceSummary.data?.overdue.count}
              value={invoiceSummary.data?.overdue.value}
              loading={invoiceSummary.isLoading}
            />
            <InvoiceStatusCard
              label="Paid"
              hint="Settled invoices"
              icon={CheckCircle2}
              tone="success"
              count={invoiceSummary.data?.paid.count}
              value={invoiceSummary.data?.paid.value}
              loading={invoiceSummary.isLoading}
            />
          </div>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        {/* My tasks */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" /> My Tasks
            </CardTitle>
            <Link to="/project-management" className="text-sm font-medium text-primary hover:underline">
              View all
            </Link>
          </CardHeader>
          <CardContent className="space-y-2">
            {tasks.isLoading ? (
              <SkeletonRows />
            ) : tasks.data && tasks.data.length > 0 ? (
              tasks.data.map((p) => (
                <Link
                  key={p.id}
                  to={`/project-management`}
                  className="flex items-center justify-between rounded-lg border p-3 transition-colors hover:bg-muted/50"
                >
                  <div className="min-w-0">
                    <p className="truncate font-medium">{p.project_name}</p>
                    <p className="truncate text-xs text-muted-foreground">{p.client_name ?? "—"}</p>
                  </div>
                  <div className="flex shrink-0 items-center gap-3">
                    <Badge className={PRIORITY_TONES[p.priority]}>{PRIORITY_LABELS[p.priority]}</Badge>
                    <span className="hidden text-xs text-muted-foreground sm:inline">
                      {p.deadline ? formatDate(p.deadline) : "No deadline"}
                    </span>
                  </div>
                </Link>
              ))
            ) : (
              <EmptyState icon={Sparkles} text="No tasks assigned to you yet." />
            )}
          </CardContent>
        </Card>

        {/* Upcoming agendas */}
        <Card>
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <CalendarDays className="h-5 w-5 text-primary" /> Upcoming
            </CardTitle>
            <Link to="/calendar" className="text-sm font-medium text-primary hover:underline">
              Calendar
            </Link>
          </CardHeader>
          <CardContent className="space-y-2">
            {events.isLoading ? (
              <SkeletonRows count={3} />
            ) : events.data && events.data.length > 0 ? (
              events.data.map((e) => (
                <div key={e.id} className="flex items-start gap-3 rounded-lg border p-3">
                  <div className="mt-0.5 flex h-9 w-9 shrink-0 flex-col items-center justify-center rounded-md bg-primary/10 text-primary">
                    <span className="text-xs font-bold leading-none">
                      {new Date(e.start_datetime).getDate()}
                    </span>
                    <span className="text-[10px] uppercase">
                      {formatDate(e.start_datetime, { month: "short" })}
                    </span>
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{e.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {EVENT_TYPE_LABELS[e.event_type]} · {formatDateTime(e.start_datetime)}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <EmptyState icon={CalendarDays} text="Nothing scheduled this week." />
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent activity */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-primary" /> Recent Activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          {activity.isLoading ? (
            <SkeletonRows />
          ) : activity.data && activity.data.length > 0 ? (
            <ol className="relative space-y-4 border-l pl-6">
              {activity.data.map((log) => (
                <li key={log.id} className="relative">
                  <span className="absolute -left-[27px] top-1 h-3 w-3 rounded-full border-2 border-background bg-primary" />
                  <p className="text-sm">
                    <span className="font-medium capitalize">{log.module}</span> — {log.action}
                  </p>
                  <p className="text-xs text-muted-foreground">{relativeTime(log.created_at)}</p>
                </li>
              ))}
            </ol>
          ) : (
            <EmptyState icon={Activity} text="No activity recorded yet." />
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function SkeletonRows({ count = 4 }: { count?: number }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: count }).map((_, i) => (
        <Skeleton key={i} className="h-14 w-full" />
      ))}
    </div>
  );
}

function EmptyState({ icon: Icon, text }: { icon: typeof Activity; text: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 py-10 text-center">
      <Icon className="h-8 w-8 text-muted-foreground/50" />
      <p className="text-sm text-muted-foreground">{text}</p>
    </div>
  );
}

const INVOICE_TONES: Record<string, string> = {
  primary: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
  destructive: "bg-destructive/10 text-destructive",
  success: "bg-success/10 text-success",
};

function InvoiceStatusCard({
  label,
  hint,
  icon: Icon,
  tone,
  count,
  value,
  loading,
}: {
  label: string;
  hint: string;
  icon: LucideIcon;
  tone: "primary" | "destructive" | "success";
  count?: number;
  value?: number;
  loading?: boolean;
}) {
  return (
    <Card>
      <CardContent className="p-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className={cn("flex h-10 w-10 items-center justify-center rounded-xl", INVOICE_TONES[tone])}>
              <Icon className="h-5 w-5" />
            </span>
            <div>
              <p className="text-sm font-semibold">{label}</p>
              <p className="text-xs text-muted-foreground">{hint}</p>
            </div>
          </div>
          {loading ? (
            <Skeleton className="h-8 w-10" />
          ) : (
            <span className="text-3xl font-bold tracking-tight">{count ?? 0}</span>
          )}
        </div>
        <div className="mt-4 flex items-baseline justify-between border-t pt-3">
          <span className="text-xs text-muted-foreground">Total value</span>
          {loading ? (
            <Skeleton className="h-6 w-28" />
          ) : (
            <span className="text-lg font-bold">{formatCurrency(value)}</span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
