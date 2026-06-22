import { Badge } from "@/components/ui/badge";
import { INVOICE_STATUS_LABELS, INVOICE_STATUS_TONES } from "@/lib/constants";
import { cn } from "@/lib/utils";
import type { Invoice, InvoiceStatus } from "@/types/database";

/** An invoice is shown as overdue if it's sent and past its due date. */
export function effectiveStatus(invoice: Pick<Invoice, "status" | "due_date">): InvoiceStatus {
  if (
    invoice.status === "sent" &&
    invoice.due_date &&
    new Date(invoice.due_date) < new Date(new Date().toDateString())
  ) {
    return "overdue";
  }
  return invoice.status;
}

export function InvoiceStatusBadge({ status, className }: { status: InvoiceStatus; className?: string }) {
  return (
    <Badge className={cn(INVOICE_STATUS_TONES[status], className)}>
      {INVOICE_STATUS_LABELS[status]}
    </Badge>
  );
}
