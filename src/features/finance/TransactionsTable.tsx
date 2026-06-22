import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowDownLeft, ArrowUpRight, Loader2, Paperclip, Pencil, Trash2 } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/components/ui/toast";
import { cn, formatCurrency, formatDate } from "@/lib/utils";
import { deleteTransaction } from "./api";
import { getReceiptUrl } from "./upload";
import type { FinanceTransaction } from "@/types/database";

function ReceiptButton({ path }: { path: string }) {
  const [loading, setLoading] = useState(false);
  async function open() {
    setLoading(true);
    const url = await getReceiptUrl(path);
    setLoading(false);
    if (url) window.open(url, "_blank", "noopener");
    else toast.error("Could not open receipt");
  }
  return (
    <button onClick={open} className="text-muted-foreground hover:text-primary" title="View receipt">
      {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Paperclip className="h-4 w-4" />}
    </button>
  );
}

export function TransactionsTable({
  transactions,
  onEdit,
}: {
  transactions: FinanceTransaction[];
  onEdit: (tx: FinanceTransaction) => void;
}) {
  const queryClient = useQueryClient();
  const deleteMutation = useMutation({
    mutationFn: (tx: FinanceTransaction) => deleteTransaction(tx),
    onSuccess: () => {
      toast.success("Transaction deleted");
      queryClient.invalidateQueries({ queryKey: ["finance"] });
    },
    onError: (e) => toast.error("Failed to delete", e instanceof Error ? e.message : undefined),
  });

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Date</TableHead>
          <TableHead>Description</TableHead>
          <TableHead>Category</TableHead>
          <TableHead className="text-right">Amount</TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {transactions.map((tx) => {
          const income = tx.type === "income";
          return (
            <TableRow key={tx.id}>
              <TableCell className="whitespace-nowrap text-muted-foreground">
                {formatDate(tx.transaction_date)}
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  <span
                    className={cn(
                      "flex h-7 w-7 shrink-0 items-center justify-center rounded-full",
                      income ? "bg-success/10 text-success" : "bg-destructive/10 text-destructive",
                    )}
                  >
                    {income ? <ArrowDownLeft className="h-4 w-4" /> : <ArrowUpRight className="h-4 w-4" />}
                  </span>
                  <div className="min-w-0">
                    <p className="truncate font-medium">{tx.title}</p>
                    {tx.description && <p className="truncate text-xs text-muted-foreground">{tx.description}</p>}
                  </div>
                </div>
              </TableCell>
              <TableCell>
                <Badge className="bg-muted text-muted-foreground">{tx.category}</Badge>
              </TableCell>
              <TableCell className="text-right">
                <span className={cn("font-semibold", income ? "text-success" : "text-destructive")}>
                  {income ? "+" : "−"}
                  {formatCurrency(tx.amount)}
                </span>
              </TableCell>
              <TableCell>
                <div className="flex items-center justify-end gap-2">
                  {tx.receipt_url && <ReceiptButton path={tx.receipt_url} />}
                  <button onClick={() => onEdit(tx)} className="text-muted-foreground hover:text-foreground" title="Edit">
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => {
                      if (confirm(`Delete "${tx.title}"?`)) deleteMutation.mutate(tx);
                    }}
                    className="text-muted-foreground hover:text-destructive"
                    title="Delete"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </TableCell>
            </TableRow>
          );
        })}
        {transactions.length === 0 && (
          <TableRow>
            <TableCell colSpan={5} className="py-12 text-center text-muted-foreground">
              No transactions found for this period.
            </TableCell>
          </TableRow>
        )}
      </TableBody>
    </Table>
  );
}
