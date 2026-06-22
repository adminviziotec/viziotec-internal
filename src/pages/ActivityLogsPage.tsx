import { useState } from "react";
import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { ChevronLeft, ChevronRight, History } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { UserAvatar } from "@/components/UserAvatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { listActivityLogs, ACTIVITY_MODULES } from "@/features/activity/api";
import { useUserMap } from "@/hooks/useUsers";
import { useAuth } from "@/features/auth/useAuth";
import { relativeTime } from "@/lib/utils";

const PAGE_SIZE = 20;

const MODULE_TONE: Record<string, string> = {
  Invoices: "bg-blue-500/15 text-blue-600 dark:text-blue-400",
  Projects: "bg-primary/15 text-primary",
  Finance: "bg-success/15 text-success",
  Calendar: "bg-amber-500/15 text-amber-600 dark:text-amber-400",
  Team: "bg-violet-500/15 text-violet-600 dark:text-violet-400",
};

export function ActivityLogsPage() {
  const { canManageInvoices } = useAuth();
  const userMap = useUserMap();
  const [module, setModule] = useState<string>("all");
  const [page, setPage] = useState(1);

  const query = useQuery({
    queryKey: ["activity", { module, page }],
    queryFn: () => listActivityLogs({ module, page, pageSize: PAGE_SIZE }),
    placeholderData: keepPreviousData,
  });

  const total = query.data?.count ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const rows = query.data?.rows ?? [];

  return (
    <div>
      <PageHeader
        title="Activity Log"
        description={
          canManageInvoices
            ? "Audit trail of important actions across the workspace."
            : "Your recent actions."
        }
      >
        <Select
          value={module}
          onValueChange={(v) => {
            setModule(v);
            setPage(1);
          }}
        >
          <SelectTrigger className="w-44">
            <SelectValue placeholder="Module" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All modules</SelectItem>
            {ACTIVITY_MODULES.map((m) => (
              <SelectItem key={m} value={m}>
                {m}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </PageHeader>

      <Card className="p-2">
        {query.isLoading ? (
          <div className="space-y-2 p-2">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        ) : rows.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 py-20 text-center">
            <History className="h-10 w-10 text-muted-foreground/40" />
            <p className="font-medium">No activity recorded</p>
            <p className="text-sm text-muted-foreground">Actions across the app will appear here.</p>
          </div>
        ) : (
          <div className="divide-y">
            {rows.map((log) => {
              const actor = log.user_id ? userMap[log.user_id] : undefined;
              return (
                <div key={log.id} className="flex items-center gap-3 p-2.5">
                  <UserAvatar name={actor?.full_name} image={actor?.profile_image} className="h-8 w-8 text-xs" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm">
                      <span className="font-medium">{actor?.full_name?.split(" ")[0] ?? "Someone"}</span>{" "}
                      {log.action}
                    </p>
                    <p className="text-xs text-muted-foreground">{relativeTime(log.created_at)}</p>
                  </div>
                  <Badge className={MODULE_TONE[log.module] ?? "bg-muted text-muted-foreground"}>
                    {log.module}
                  </Badge>
                </div>
              );
            })}
          </div>
        )}
      </Card>

      <div className="mt-4 flex items-center justify-between text-sm text-muted-foreground">
        <p>{total} entries</p>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
            <ChevronLeft className="h-4 w-4" /> Prev
          </Button>
          <span>
            Page {page} of {totalPages}
          </span>
          <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>
            Next <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
