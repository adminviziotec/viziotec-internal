export interface LineItemInput {
  quantity: number;
  unit_price: number;
}

export interface InvoiceTotals {
  subtotal: number;
  discount: number;
  taxable: number;
  taxPercentage: number;
  taxAmount: number;
  grandTotal: number;
}

export function lineTotal(item: LineItemInput): number {
  return round2((Number(item.quantity) || 0) * (Number(item.unit_price) || 0));
}

export function computeTotals(
  items: LineItemInput[],
  taxPercentage: number,
  discount: number,
): InvoiceTotals {
  const subtotal = round2(items.reduce((sum, it) => sum + lineTotal(it), 0));
  const safeDiscount = Math.min(Math.max(Number(discount) || 0, 0), subtotal);
  const taxable = round2(subtotal - safeDiscount);
  const taxPct = Math.max(Number(taxPercentage) || 0, 0);
  const taxAmount = round2((taxable * taxPct) / 100);
  const grandTotal = round2(taxable + taxAmount);
  return {
    subtotal,
    discount: safeDiscount,
    taxable,
    taxPercentage: taxPct,
    taxAmount,
    grandTotal,
  };
}

export function round2(n: number): number {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}
