import { useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Loader2, Plus, Trash2 } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FullScreenLoader } from "@/components/FullScreenLoader";
import { toast } from "@/components/ui/toast";
import {
  quotationFormSchema,
  defaultQuotationValues,
  emptyItem,
  type QuotationFormValues,
} from "@/features/quotations/schema";
import { createQuotation, getQuotation, updateQuotation } from "@/features/quotations/api";
import { computeTotals, lineTotal } from "@/features/invoices/calc";
import { QUOTATION_STATUS_LABELS } from "@/lib/constants";
import { formatCurrency } from "@/lib/utils";
import type { QuotationStatus } from "@/types/database";

export function QuotationFormPage() {
  const { id } = useParams<{ id: string }>();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const existing = useQuery({
    queryKey: ["quotation", id],
    queryFn: () => getQuotation(id!),
    enabled: isEdit,
  });

  const form = useForm<QuotationFormValues>({
    resolver: zodResolver(quotationFormSchema),
    defaultValues: defaultQuotationValues,
  });
  const { register, control, handleSubmit, reset, watch, setValue, formState } = form;
  const { fields, append, remove } = useFieldArray({ control, name: "items" });

  useEffect(() => {
    if (existing.data) {
      const q = existing.data;
      reset({
        client_name: q.client_name,
        client_email: q.client_email ?? "",
        client_phone: q.client_phone ?? "",
        project_name: q.project_name ?? "",
        quotation_date: q.quotation_date,
        valid_until: q.valid_until ?? "",
        status: q.status,
        tax_percentage: q.tax_percentage,
        discount: q.discount,
        notes: q.notes ?? "",
        items: q.items.length
          ? q.items.map((it) => ({
              id: it.id,
              service_name: it.service_name,
              description: it.description ?? "",
              quantity: it.quantity,
              unit_price: it.unit_price,
            }))
          : [{ ...emptyItem }],
      });
    }
  }, [existing.data, reset]);

  const items = watch("items");
  const taxPct = watch("tax_percentage");
  const discount = watch("discount");
  const totals = computeTotals(items ?? [], Number(taxPct) || 0, Number(discount) || 0);

  const mutation = useMutation({
    mutationFn: (values: QuotationFormValues) =>
      isEdit ? updateQuotation(id!, values).then(() => id!) : createQuotation(values).then((q) => q.id),
    onSuccess: (savedId) => {
      toast.success(isEdit ? "Quotation updated" : "Quotation created");
      queryClient.invalidateQueries({ queryKey: ["quotations"] });
      queryClient.invalidateQueries({ queryKey: ["quotation", savedId] });
      navigate(`/quotations/${savedId}`);
    },
    onError: (e) => toast.error("Could not save quotation", e instanceof Error ? e.message : undefined),
  });

  if (isEdit && existing.isLoading) return <FullScreenLoader label="Loading quotation…" />;

  return (
    <form onSubmit={handleSubmit((v) => mutation.mutate(v))}>
      <PageHeader
        title={isEdit ? "Edit quotation" : "New quotation"}
        description={isEdit ? existing.data?.quotation_number : "The quotation number is generated automatically."}
      >
        <Button type="button" variant="outline" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-4 w-4" /> Cancel
        </Button>
        <Button type="submit" disabled={mutation.isPending}>
          {mutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
          {isEdit ? "Save changes" : "Create quotation"}
        </Button>
      </PageHeader>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Client information</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <Field label="Client name" error={formState.errors.client_name?.message}>
                <Input {...register("client_name")} placeholder="Acme Corp" />
              </Field>
              <Field label="Project name" error={formState.errors.project_name?.message}>
                <Input {...register("project_name")} placeholder="Website redesign" />
              </Field>
              <Field label="Client email" error={formState.errors.client_email?.message}>
                <Input type="email" {...register("client_email")} placeholder="billing@acme.com" />
              </Field>
              <Field label="Client phone" error={formState.errors.client_phone?.message}>
                <Input {...register("client_phone")} placeholder="+62…" />
              </Field>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex-row items-center justify-between">
              <CardTitle>Items</CardTitle>
              <Button type="button" variant="outline" size="sm" onClick={() => append({ ...emptyItem })}>
                <Plus className="h-4 w-4" /> Add item
              </Button>
            </CardHeader>
            <CardContent className="space-y-3">
              {fields.map((field, index) => (
                <div key={field.id} className="grid grid-cols-12 gap-2 rounded-lg border p-3">
                  <div className="col-span-12 sm:col-span-5">
                    <Label className="text-xs text-muted-foreground">Service</Label>
                    <Input {...register(`items.${index}.service_name`)} placeholder="Service name" />
                    <Input
                      {...register(`items.${index}.description`)}
                      placeholder="Description (optional)"
                      className="mt-1.5 text-xs"
                    />
                  </div>
                  <div className="col-span-3 sm:col-span-2">
                    <Label className="text-xs text-muted-foreground">Qty</Label>
                    <Input type="number" step="any" min="0" {...register(`items.${index}.quantity`)} />
                  </div>
                  <div className="col-span-5 sm:col-span-3">
                    <Label className="text-xs text-muted-foreground">Unit price</Label>
                    <Input type="number" step="any" min="0" {...register(`items.${index}.unit_price`)} />
                  </div>
                  <div className="col-span-3 sm:col-span-2 flex flex-col">
                    <Label className="text-xs text-muted-foreground">Total</Label>
                    <div className="flex flex-1 items-center justify-between gap-1">
                      <span className="truncate text-sm font-medium">
                        {formatCurrency(lineTotal(items?.[index] ?? { quantity: 0, unit_price: 0 }))}
                      </span>
                      <button
                        type="button"
                        onClick={() => fields.length > 1 && remove(index)}
                        className="text-muted-foreground hover:text-destructive disabled:opacity-30"
                        disabled={fields.length <= 1}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
              {formState.errors.items?.message && (
                <p className="text-sm text-destructive">{formState.errors.items.message}</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Notes</CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                {...register("notes")}
                placeholder="Scope, terms, validity note, bank details…"
                rows={4}
              />
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Field label="Quotation date" error={formState.errors.quotation_date?.message}>
                <Input type="date" {...register("quotation_date")} />
              </Field>
              <Field label="Valid until" error={formState.errors.valid_until?.message}>
                <Input type="date" {...register("valid_until")} />
              </Field>
              <div className="space-y-1.5">
                <Label>Status</Label>
                <Select value={watch("status")} onValueChange={(v) => setValue("status", v as QuotationStatus)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {(Object.keys(QUOTATION_STATUS_LABELS) as QuotationStatus[]).map((s) => (
                      <SelectItem key={s} value={s}>
                        {QUOTATION_STATUS_LABELS[s]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Row label="Subtotal" value={formatCurrency(totals.subtotal)} />
              <div className="flex items-center justify-between gap-2">
                <Label className="text-sm text-muted-foreground">Discount</Label>
                <Input type="number" step="any" min="0" className="h-8 w-28 text-right" {...register("discount")} />
              </div>
              <div className="flex items-center justify-between gap-2">
                <Label className="text-sm text-muted-foreground">Tax %</Label>
                <Input type="number" step="any" min="0" max="100" className="h-8 w-28 text-right" {...register("tax_percentage")} />
              </div>
              <Row label="Tax amount" value={formatCurrency(totals.taxAmount)} />
              <div className="border-t pt-3">
                <div className="flex items-center justify-between">
                  <span className="font-semibold">Grand total</span>
                  <span className="text-xl font-bold text-primary">{formatCurrency(totals.grandTotal)}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </form>
  );
}

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      {children}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}
