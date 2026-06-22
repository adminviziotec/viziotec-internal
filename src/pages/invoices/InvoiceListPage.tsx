import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { ChevronLeft, ChevronRight, FileText, Plus, Search } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { InvoiceStatusBadge, effectiveStatus } from "@/features/invoices/StatusBadge";
import { listInvoices } from "@/features/invoices/api";
import { useDebounce } from "@/hooks/useDebounce";
import { useAuth } from "@/features/auth/useAuth";
import { formatCurrency, formatDate } from "@/lib/utils";
import { INVOICE_STATUS_LABELS } from "@/lib/constants";
import type { InvoiceStatus } from "@/types/database";

const PAGE_SIZE = 10;

export function InvoiceListPage() {
  const navigate = useNavigate();
  const { canManageInvoices } = useAuth();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<InvoiceStatus | "all">("all");
  const [page, setPage] = useState(1);
  const debouncedSearch = useDebounce(search);

  const query = useQuery({
    queryKey: ["invoices", { search: debouncedSearch, status, page }],
    queryFn: () => listInvoices({ search: debouncedSearch, status, page, pageSize: PAGE_SIZE }),
    placeholderData: keepPreviousData,
  });

  const total = query.data?.count ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const rows = query.data?.rows ?? [];

  function resetTo(p: number) {
    setPage(p);
  }

  return (
    <div>
      <PageHeader title="Invoices" description="Create, search and export client invoices.">
        {canManageInvoices && (
          <Button onClick={() => navigate("/invoices/new")}>
            <Plus className="h-4 w-4" /> New invoice
          </Button>
        )}
      </PageHeader>

      <Card className="mb-4 p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search by number, client or project…"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                resetTo(1);
              }}
              className="pl-9"
            />
          </div>
          <Select
            value={status}
            onValueChange={(v) => {
              setStatus(v as InvoiceStatus | "all");
              resetTo(1);
            }}
          >
            <SelectTrigger className="sm:w-48">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              {(Object.keys(INVOICE_STATUS_LABELS) as InvoiceStatus[]).map((s) => (
                <SelectItem key={s} value={s}>
                  {INVOICE_STATUS_LABELS[s]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </Card>

      <Card className="overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Invoice</TableHead>
              <TableHead>Client</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Due</TableHead>
              <TableHead className="text-right">Total</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {query.isLoading &&
              Array.from({ length: 6 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell colSpan={6}>
                    <Skeleton className="h-9 w-full" />
                  </TableCell>
                </TableRow>
              ))}

            {!query.isLoading &&
              rows.map((inv) => {
                const eff = effectiveStatus(inv);
                return (
                  <TableRow
                    key={inv.id}
                    className="cursor-pointer"
                    onClick={() => navigate(`/invoices/${inv.id}`)}
                  >
                    <TableCell className="font-medium">{inv.invoice_number}</TableCell>
                    <TableCell>
                      <p className="font-medium">{inv.client_name}</p>
                      {inv.project_name && (
                        <p className="text-xs text-muted-foreground">{inv.project_name}</p>
                      )}
                    </TableCell>
                    <TableCell className="text-muted-foreground">{formatDate(inv.invoice_date)}</TableCell>
                    <TableCell className="text-muted-foreground">{formatDate(inv.due_date)}</TableCell>
                    <TableCell className="text-right font-semibold">
                      {formatCurrency(inv.grand_total)}
                    </TableCell>
                    <TableCell>
                      <InvoiceStatusBadge status={eff} />
                    </TableCell>
                  </TableRow>
                );
              })}

            {!query.isLoading && rows.length === 0 && (
              <TableRow>
                <TableCell colSpan={6}>
                  <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
                    <FileText className="h-10 w-10 text-muted-foreground/40" />
                    <p className="font-medium">No invoices found</p>
                    <p className="text-sm text-muted-foreground">
                      {search || status !== "all"
                        ? "Try adjusting your search or filters."
                        : "Create your first invoice to get started."}
                    </p>
                    {canManageInvoices && !search && status === "all" && (
                      <Button className="mt-1" onClick={() => navigate("/invoices/new")}>
                        <Plus className="h-4 w-4" /> New invoice
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Card>

      <div className="mt-4 flex items-center justify-between text-sm text-muted-foreground">
        <p>
          {total > 0
            ? `Showing ${(page - 1) * PAGE_SIZE + 1}–${Math.min(page * PAGE_SIZE, total)} of ${total}`
            : "0 results"}
        </p>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={page <= 1}
            onClick={() => resetTo(page - 1)}
          >
            <ChevronLeft className="h-4 w-4" /> Prev
          </Button>
          <span className="px-1">
            Page {page} of {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={page >= totalPages}
            onClick={() => resetTo(page + 1)}
          >
            Next <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
