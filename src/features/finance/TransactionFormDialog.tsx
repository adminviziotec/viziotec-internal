import { useEffect, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { FileText, Loader2, Paperclip, X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";
import { createTransaction, updateTransaction } from "./api";
import { validateReceipt } from "./upload";
import {
  transactionFormSchema,
  defaultTransactionValues,
  type TransactionFormValues,
} from "./schema";
import { listProjects } from "@/features/projects/api";
import { EXPENSE_CATEGORIES, INCOME_CATEGORIES } from "@/lib/constants";
import type { FinanceTransaction, TransactionType } from "@/types/database";

interface TransactionFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultType?: TransactionType;
  transaction?: FinanceTransaction | null;
}

export function TransactionFormDialog({
  open,
  onOpenChange,
  defaultType = "income",
  transaction,
}: TransactionFormDialogProps) {
  const isEdit = Boolean(transaction);
  const queryClient = useQueryClient();
  const [receipt, setReceipt] = useState<File | null>(null);

  const projects = useQuery({ queryKey: ["projects", {}], queryFn: () => listProjects() });

  const { register, handleSubmit, control, reset, watch, setValue, formState } =
    useForm<TransactionFormValues>({
      resolver: zodResolver(transactionFormSchema),
      defaultValues: defaultTransactionValues(defaultType),
    });

  const type = watch("type");
  const categories = type === "income" ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;

  useEffect(() => {
    if (open) {
      setReceipt(null);
      reset(
        transaction
          ? {
              type: transaction.type,
              category: transaction.category,
              title: transaction.title,
              description: transaction.description ?? "",
              amount: transaction.amount,
              transaction_date: transaction.transaction_date,
              project_id: transaction.project_id ?? "",
            }
          : defaultTransactionValues(defaultType),
      );
    }
  }, [open, transaction, defaultType, reset]);

  const mutation = useMutation({
    mutationFn: (values: TransactionFormValues) =>
      isEdit
        ? updateTransaction(transaction!.id, values, receipt, transaction!.receipt_url)
        : createTransaction(values, receipt),
    onSuccess: () => {
      toast.success(isEdit ? "Transaction updated" : "Transaction saved");
      queryClient.invalidateQueries({ queryKey: ["finance"] });
      onOpenChange(false);
    },
    onError: (e) => toast.error("Could not save", e instanceof Error ? e.message : undefined),
  });

  function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const err = validateReceipt(file);
    if (err) {
      toast.error("Invalid file", err);
      e.target.value = "";
      return;
    }
    setReceipt(file);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit transaction" : "Add transaction"}</DialogTitle>
          <DialogDescription>Record income or an expense, optionally with a receipt.</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit((v) => mutation.mutate(v))} className="space-y-4">
          {/* Type toggle */}
          <div className="grid grid-cols-2 gap-2">
            {(["income", "expense"] as TransactionType[]).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => {
                  setValue("type", t);
                  setValue("category", "");
                }}
                className={cn(
                  "rounded-lg border p-2.5 text-sm font-medium capitalize transition-colors",
                  type === t
                    ? t === "income"
                      ? "border-success bg-success/10 text-success"
                      : "border-destructive bg-destructive/10 text-destructive"
                    : "hover:bg-muted",
                )}
              >
                {t}
              </button>
            ))}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>Category</Label>
              <Controller
                control={control}
                name="category"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select…" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((c) => (
                        <SelectItem key={c} value={c}>
                          {c}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {formState.errors.category && (
                <p className="text-xs text-destructive">{formState.errors.category.message}</p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label>Amount</Label>
              <Input type="number" step="any" min="0" {...register("amount")} placeholder="0" />
              {formState.errors.amount && (
                <p className="text-xs text-destructive">{formState.errors.amount.message}</p>
              )}
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Title</Label>
            <Input {...register("title")} placeholder="e.g. Website project payment" />
            {formState.errors.title && (
              <p className="text-xs text-destructive">{formState.errors.title.message}</p>
            )}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>Date</Label>
              <Input type="date" {...register("transaction_date")} />
            </div>
            <div className="space-y-1.5">
              <Label>Linked project</Label>
              <Controller
                control={control}
                name="project_id"
                render={({ field }) => (
                  <Select value={field.value || "none"} onValueChange={(v) => field.onChange(v === "none" ? "" : v)}>
                    <SelectTrigger>
                      <SelectValue placeholder="None" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      {(projects.data ?? []).map((p) => (
                        <SelectItem key={p.id} value={p.id}>
                          {p.project_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Description</Label>
            <Textarea {...register("description")} rows={2} placeholder="Optional notes…" />
          </div>

          {/* Receipt */}
          <div className="space-y-1.5">
            <Label>Receipt / payment proof</Label>
            {receipt ? (
              <div className="flex items-center justify-between rounded-lg border p-2.5 text-sm">
                <span className="flex items-center gap-2 truncate">
                  <FileText className="h-4 w-4 shrink-0 text-primary" />
                  {receipt.name}
                </span>
                <button type="button" onClick={() => setReceipt(null)} className="text-muted-foreground hover:text-destructive">
                  <X className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-dashed p-2.5 text-sm text-muted-foreground hover:bg-muted/50">
                <Paperclip className="h-4 w-4" />
                {isEdit && transaction?.receipt_url ? "Replace receipt" : "Attach JPG, PNG or PDF"}
                <input type="file" accept="image/jpeg,image/png,application/pdf" className="hidden" onChange={onFileChange} />
              </label>
            )}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              {isEdit ? "Save changes" : "Save transaction"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
