export type ReportOrderRow = {
  id: string;
  order_number?: string;
  customer_id: string | null;
  customer_name?: string | null;
  status: string;
  total: number | string;
  created_at: string;
  updated_at?: string;
  delivery_date?: string | null;
  status_history?: unknown;
  assigned_driver_id?: string | null;
  trip_id?: string | null;
  customers?:
    | { id?: string; name: string; type: string }
    | { id?: string; name: string; type: string }[]
    | null;
  quote_request?:
    | { contact_name: string }
    | { contact_name: string }[]
    | null;
};

export type ReportOrderItemRow = {
  order_id: string;
  product_id: string | null;
  quantity: number;
  unit_price: number | string;
  picked_at?: string | null;
  products?:
    | {
        id?: string;
        name: string;
        sku?: string | null;
        clean_name?: string | null;
        category?: string | null;
        master_id?: string | null;
        purchase_price?: number | string;
        sale_price?: number | string;
        internal_price_eur?: number | string | null;
        product_masters?:
          | { clean_name: string; category: string }
          | { clean_name: string; category: string }[]
          | null;
      }
    | {
        id?: string;
        name: string;
        sku?: string | null;
        clean_name?: string | null;
        category?: string | null;
        master_id?: string | null;
        purchase_price?: number | string;
        sale_price?: number | string;
        internal_price_eur?: number | string | null;
        product_masters?:
          | { clean_name: string; category: string }
          | { clean_name: string; category: string }[]
          | null;
      }[]
    | null;
};

export function toNumber(value: number | string | null | undefined): number {
  if (value === null || value === undefined) return 0;
  const n = typeof value === "number" ? value : Number.parseFloat(String(value));
  return Number.isFinite(n) ? n : 0;
}

export function normalizeJoin<T>(value: T | T[] | null | undefined): T | null {
  if (!value) return null;
  return Array.isArray(value) ? (value[0] ?? null) : value;
}

/** Group key for analytics when customer_id may be null (quote-converted orders). */
export function customerGroupKey(order: Pick<ReportOrderRow, "id" | "customer_id">): string {
  return order.customer_id ?? order.id;
}
