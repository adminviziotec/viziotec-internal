import { useNavigate, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, ChevronDown, FileOutput, Loader2, Pencil, Printer, Trash2 } from "lucide-react";
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
import { QuotationStatusBadge, effectiveStatus } from "@/features/quotations/StatusBadge";
import {
  convertQuotationToInvoice,
  deleteQuotation,
  getQuotation,
  updateQuotationStatus,
  type QuotationWithItems,
} from "@/features/quotations/api";
import { useAuth } from "@/features/auth/useAuth";
import { toast } from "@/components/ui/toast";
import { env } from "@/lib/env";
import { formatCurrency, formatDate } from "@/lib/utils";
import { QUOTATION_STATUS_LABELS } from "@/lib/constants";
import type { QuotationStatus } from "@/types/database";

export function QuotationDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { canManageInvoices } = useAuth();

  const query = useQuery({ queryKey: ["quotation", id], queryFn: () => getQuotation(id!), enabled: !!id });

  const statusMutation = useMutation({
    mutationFn: (status: QuotationStatus) => updateQuotationStatus(id!, status),
    onSuccess: () => {
      toast.success("Status updated");
      queryClient.invalidateQueries({ queryKey: ["quotation", id] });
      queryClient.invalidateQueries({ queryKey: ["quotations"] });
    },
    onError: (e) => toast.error("Failed", e instanceof Error ? e.message : undefined),
  });

  const deleteMutation = useMutation({
    mutationFn: () => deleteQuotation(id!),
    onSuccess: () => {
      toast.success("Quotation deleted");
      queryClient.invalidateQueries({ queryKey: ["quotations"] });
      navigate("/quotations");
    },
    onError: (e) => toast.error("Failed to delete", e instanceof Error ? e.message : undefined),
  });

  const convertMutation = useMutation({
    mutationFn: (quotation: QuotationWithItems) => convertQuotationToInvoice(quotation),
    onSuccess: (invoice) => {
      toast.success("Converted to invoice", `${invoice.invoice_number} created as a draft.`);
      queryClient.invalidateQueries({ queryKey: ["quotation", id] });
      queryClient.invalidateQueries({ queryKey: ["quotations"] });
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
      navigate(`/invoices/${invoice.id}`);
    },
    onError: (e) => toast.error("Could not convert", e instanceof Error ? e.message : undefined),
  });

  if (query.isLoading) return <FullScreenLoader label="Loading quotation…" />;
  if (query.isError || !query.data) {
    return (
      <div className="py-20 text-center">
        <p className="text-muted-foreground">Quotation not found.</p>
        <Button className="mt-4" onClick={() => navigate("/quotations")}>
          Back to quotations
        </Button>
      </div>
    );
  }

  const q = query.data;
  const eff = effectiveStatus(q);

  return (
    <div>
      <div className="no-print mb-6 flex flex-wrap items-center justify-between gap-3">
        <Button variant="outline" onClick={() => navigate("/quotations")}>
          <ArrowLeft className="h-4 w-4" /> Back
        </Button>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" onClick={() => window.print()}>
            <Printer className="h-4 w-4" /> Print / Download PDF
          </Button>
          {canManageInvoices && (
            <>
              <Button
                onClick={() => {
                  if (confirm(`Create a draft invoice from ${q.quotation_number}? The quotation will be marked accepted.`)) {
                    convertMutation.mutate(q);
                  }
                }}
                disabled={convertMutation.isPending}
              >
                {convertMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <FileOutput className="h-4 w-4" />
                )}
                Convert to invoice
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline">
                    Status <ChevronDown className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>Set status</DropdownMenuLabel>
                  {(Object.keys(QUOTATION_STATUS_LABELS) as QuotationStatus[]).map((s) => (
                    <DropdownMenuItem key={s} onClick={() => statusMutation.mutate(s)}>
                      {QUOTATION_STATUS_LABELS[s]}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
              <Button variant="outline" onClick={() => navigate(`/quotations/${q.id}/edit`)}>
                <Pencil className="h-4 w-4" /> Edit
              </Button>
              <Button
                variant="outline"
                className="text-destructive hover:text-destructive"
                onClick={() => {
                  if (confirm(`Delete quotation ${q.quotation_number}? This cannot be undone.`)) {
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
      <Card id="document-print" className="mx-auto max-w-3xl p-8 sm:p-12">
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
            {env.company.phone && <p className="text-sm text-muted-foreground">{env.company.phone}</p>}
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold tracking-tight">QUOTATION</p>
            <p className="mt-1 font-mono text-sm">{q.quotation_number}</p>
            <div className="mt-2">
              <QuotationStatusBadge status={eff} />
            </div>
          </div>
        </div>

        <div className="mt-8 grid grid-cols-2 gap-6 text-sm">
          <div>
            <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Prepared for
            </p>
            <p className="font-medium">{q.client_name}</p>
            {q.project_name && <p className="text-muted-foreground">{q.project_name}</p>}
            {q.client_email && <p className="text-muted-foreground">{q.client_email}</p>}
            {q.client_phone && <p className="text-muted-foreground">{q.client_phone}</p>}
          </div>
          <div className="text-right">
            <p className="text-muted-foreground">
              Date: <span className="font-medium text-foreground">{formatDate(q.quotation_date)}</span>
            </p>
            <p className="text-muted-foreground">
              Valid until: <span className="font-medium text-foreground">{formatDate(q.valid_until)}</span>
            </p>
          </div>
        </div>

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
            {q.items.map((it) => (
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

        <div className="mt-6 flex justify-end">
          <div className="w-full max-w-xs space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Subtotal</span>
              <span>{formatCurrency(q.subtotal)}</span>
            </div>
            {q.discount > 0 && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Discount</span>
                <span>−{formatCurrency(q.discount)}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-muted-foreground">Tax ({q.tax_percentage}%)</span>
              <span>{formatCurrency(q.tax_amount)}</span>
            </div>
            <div className="flex justify-between border-t pt-2 text-base font-bold">
              <span>Estimated total</span>
              <span className="text-primary">{formatCurrency(q.grand_total)}</span>
            </div>
          </div>
        </div>

        {q.notes && (
          <div className="mt-8 border-t pt-4">
            <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Notes</p>
            <p className="whitespace-pre-wrap text-sm text-muted-foreground">{q.notes}</p>
          </div>
        )}

        <p className="mt-10 text-center text-xs text-muted-foreground">
          {q.valid_until
            ? `This quotation is valid until ${formatDate(q.valid_until)}.`
            : "This is a quotation, not a tax invoice."}{" "}
          · {env.company.name}
        </p>
      </Card>
    </div>
  );
}
