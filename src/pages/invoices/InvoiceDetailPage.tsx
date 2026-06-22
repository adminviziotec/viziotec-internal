import { useNavigate, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, ChevronDown, Pencil, Printer, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { FullScreenLoader } from "@/components/FullScreenLoader";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { InvoiceStatusBadge, effectiveStatus } from "@/features/invoices/StatusBadge";
import { deleteInvoice, getInvoice, updateInvoiceStatus } from "@/features/invoices/api";
import { useAuth } from "@/features/auth/useAuth";
import { toast } from "@/components/ui/toast";
import { env } from "@/lib/env";
import { formatCurrency, formatDate } from "@/lib/utils";
import { INVOICE_STATUS_LABELS } from "@/lib/constants";
import type { InvoiceStatus } from "@/types/database";

export function InvoiceDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { canManageInvoices } = useAuth();

  const query = useQuery({ queryKey: ["invoice", id], queryFn: () => getInvoice(id!), enabled: !!id });

  const statusMutation = useMutation({
    mutationFn: (status: InvoiceStatus) => updateInvoiceStatus(id!, status),
    onSuccess: () => {
      toast.success("Status updated");
      queryClient.invalidateQueries({ queryKey: ["invoice", id] });
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
    },
    onError: (e) => toast.error("Failed", e instanceof Error ? e.message : undefined),
  });

  const deleteMutation = useMutation({
    mutationFn: () => deleteInvoice(id!),
    onSuccess: () => {
      toast.success("Invoice deleted");
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
      navigate("/invoices");
    },
    onError: (e) => toast.error("Failed to delete", e instanceof Error ? e.message : undefined),
  });

  if (query.isLoading) return <FullScreenLoader label="Loading invoice…" />;
  if (query.isError || !query.data) {
    return (
      <div className="py-20 text-center">
        <p className="text-muted-foreground">Invoice not found.</p>
        <Button className="mt-4" onClick={() => navigate("/invoices")}>
          Back to invoices
        </Button>
      </div>
    );
  }

  const inv = query.data;
  const eff = effectiveStatus(inv);

  return (
    <div>
      {/* Action bar (not printed) */}
      <div className="no-print mb-6 flex flex-wrap items-center justify-between gap-3">
        <Button variant="outline" onClick={() => navigate("/invoices")}>
          <ArrowLeft className="h-4 w-4" /> Back
        </Button>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" onClick={() => window.print()}>
            <Printer className="h-4 w-4" /> Print / Download PDF
          </Button>
          {canManageInvoices && (
            <>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline">
                    Status <ChevronDown className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>Set status</DropdownMenuLabel>
                  {(Object.keys(INVOICE_STATUS_LABELS) as InvoiceStatus[]).map((s) => (
                    <DropdownMenuItem key={s} onClick={() => statusMutation.mutate(s)}>
                      {INVOICE_STATUS_LABELS[s]}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
              <Button variant="outline" onClick={() => navigate(`/invoices/${inv.id}/edit`)}>
                <Pencil className="h-4 w-4" /> Edit
              </Button>
              <Button
                variant="outline"
                className="text-destructive hover:text-destructive"
                onClick={() => {
                  if (confirm(`Delete invoice ${inv.invoice_number}? This cannot be undone.`)) {
                    deleteMutation.mutate();
                  }
                }}
              >
                <Trash2 className="h-4 w-4" /> Delete
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Printable document */}
      <Card id="invoice-print" className="mx-auto max-w-3xl p-8 sm:p-12">
        <div className="flex flex-wrap items-start justify-between gap-6">
          <div>
            <div className="flex items-center gap-2">
              <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-primary text-lg font-bold text-primary-foreground">
                V
              </div>
              <div>
                <p className="text-lg font-bold">{env.company.name}</p>
                <p className="text-xs text-muted-foreground">{env.company.email}</p>
              </div>
            </div>
            {env.company.address && (
              <p className="mt-3 max-w-xs text-sm text-muted-foreground">{env.company.address}</p>
            )}
            {env.company.phone && (
              <p className="text-sm text-muted-foreground">{env.company.phone}</p>
            )}
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold tracking-tight">INVOICE</p>
            <p className="mt-1 font-mono text-sm">{inv.invoice_number}</p>
            <div className="mt-2">
              <InvoiceStatusBadge status={eff} />
            </div>
          </div>
        </div>

        <div className="mt-8 grid grid-cols-2 gap-6 text-sm">
          <div>
            <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Bill to
            </p>
            <p className="font-medium">{inv.client_name}</p>
            {inv.project_name && <p className="text-muted-foreground">{inv.project_name}</p>}
            {inv.client_email && <p className="text-muted-foreground">{inv.client_email}</p>}
            {inv.client_phone && <p className="text-muted-foreground">{inv.client_phone}</p>}
          </div>
          <div className="text-right">
            <p className="text-muted-foreground">
              Invoice date: <span className="font-medium text-foreground">{formatDate(inv.invoice_date)}</span>
            </p>
            <p className="text-muted-foreground">
              Due date: <span className="font-medium text-foreground">{formatDate(inv.due_date)}</span>
            </p>
          </div>
        </div>

        {/* Items */}
        <table className="mt-8 w-full text-sm">
          <thead>
            <tr className="border-b text-left text-xs uppercase tracking-wide text-muted-foreground">
              <th className="pb-2">Description</th>
              <th className="pb-2 text-right">Qty</th>
              <th className="pb-2 text-right">Unit price</th>
              <th className="pb-2 text-right">Amount</th>
            </tr>
          </thead>
          <tbody>
            {inv.items.map((it) => (
              <tr key={it.id} className="border-b">
                <td className="py-3">
                  <p className="font-medium">{it.service_name}</p>
                  {it.description && <p className="text-xs text-muted-foreground">{it.description}</p>}
                </td>
                <td className="py-3 text-right">{it.quantity}</td>
                <td className="py-3 text-right">{formatCurrency(it.unit_price)}</td>
                <td className="py-3 text-right font-medium">{formatCurrency(it.total_price)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Totals */}
        <div className="mt-6 flex justify-end">
          <div className="w-full max-w-xs space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Subtotal</span>
              <span>{formatCurrency(inv.subtotal)}</span>
            </div>
            {inv.discount > 0 && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Discount</span>
                <span>−{formatCurrency(inv.discount)}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-muted-foreground">Tax ({inv.tax_percentage}%)</span>
              <span>{formatCurrency(inv.tax_amount)}</span>
            </div>
            <div className="flex justify-between border-t pt-2 text-base font-bold">
              <span>Grand total</span>
              <span className="text-primary">{formatCurrency(inv.grand_total)}</span>
            </div>
          </div>
        </div>

        {inv.notes && (
          <div className="mt-8 border-t pt-4">
            <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Notes
            </p>
            <p className="whitespace-pre-wrap text-sm text-muted-foreground">{inv.notes}</p>
          </div>
        )}

        <p className="mt-10 text-center text-xs text-muted-foreground">
          Thank you for your business · {env.company.name}
        </p>
      </Card>
    </div>
  );
}
