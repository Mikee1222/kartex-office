export type CustomerNameJoin = {
  name?: string | null;
};

export type QuoteContactJoin = {
  contact_name?: string | null;
};

export type ResolveCustomerNameInput = {
  customer_name?: string | null;
  customers?: CustomerNameJoin | CustomerNameJoin[] | null;
  quote_request?: QuoteContactJoin | QuoteContactJoin[] | null;
};

export function pickOne<T>(value: T | T[] | null | undefined): T | null {
  if (!value) return null;
  return Array.isArray(value) ? (value[0] ?? null) : value;
}

/** customers.name → orders.customer_name → quote_request.contact_name → "—" */
export function resolveCustomerName(input: ResolveCustomerNameInput): string {
  const customer = pickOne(input.customers);
  const quoteRequest = pickOne(input.quote_request);

  return (
    customer?.name?.trim() ||
    input.customer_name?.trim() ||
    quoteRequest?.contact_name?.trim() ||
    "—"
  );
}
