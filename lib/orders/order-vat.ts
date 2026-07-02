/** Greek VAT rate for B2C receipts (Απόδειξη). */
export const ORDER_VAT_RATE = 0.24;

export type OrderDocumentType = "receipt" | "invoice" | string | null | undefined;

export type OrderVatSummary = {
  subtotal: number;
  vatRate: number;
  vatAmount: number;
  grandTotal: number;
  vatApplies: boolean;
};

function roundMoney(value: number): number {
  return Math.round(value * 100) / 100;
}

/** Unit prices on order_items are stored VAT-exclusive. */
export function computeSubtotalFromLines(
  items: { unitPrice: number; quantity: number }[],
): number {
  const raw = items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
  return roundMoney(raw);
}

export function computeOrderVatSummary(input: {
  subtotal: number;
  documentType?: OrderDocumentType;
  storedTotal?: number | null;
}): OrderVatSummary {
  const subtotal = roundMoney(input.subtotal);
  const isInvoice = input.documentType === "invoice";
  const vatApplies = !isInvoice;
  const vatRate = vatApplies ? ORDER_VAT_RATE : 0;
  const vatAmount = vatApplies ? roundMoney(subtotal * vatRate) : 0;
  const computedTotal = roundMoney(subtotal + vatAmount);
  const storedTotal =
    input.storedTotal != null && input.storedTotal > 0
      ? roundMoney(input.storedTotal)
      : null;

  // Receipts (Απόδειξη) must always show subtotal + VAT. Legacy rows may store
  // the net subtotal in orders.total — never let that override the gross total.
  const grandTotal = vatApplies ? computedTotal : (storedTotal ?? computedTotal);

  return {
    subtotal,
    vatRate,
    vatAmount,
    grandTotal,
    vatApplies,
  };
}
