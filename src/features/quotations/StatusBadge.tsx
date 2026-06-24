import { Badge } from "@/components/ui/badge";
import { QUOTATION_STATUS_LABELS, QUOTATION_STATUS_TONES } from "@/lib/constants";
import { cn } from "@/lib/utils";
import type { Quotation, QuotationStatus } from "@/types/database";

/** A sent quotation past its valid-until date is shown as expired. */
export function effectiveStatus(q: Pick<Quotation, "status" | "valid_until">): QuotationStatus {
  if (
    q.status === "sent" &&
    q.valid_until &&
    new Date(q.valid_until) < new Date(new Date().toDateString())
  ) {
    return "expired";
  }
  return q.status;
}

export function QuotationStatusBadge({ status, className }: { status: QuotationStatus; className?: string }) {
  return (
    <Badge className={cn(QUOTATION_STATUS_TONES[status], className)}>
      {QUOTATION_STATUS_LABELS[status]}
    </Badge>
  );
}
