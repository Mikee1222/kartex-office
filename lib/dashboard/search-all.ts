import type { SupabaseClient } from "@supabase/supabase-js";

function escapeIlike(value: string) {
  return value.replace(/[%_\\,]/g, "\\$&");
}

export type GlobalSearchResults = {
  orders: {
    id: string;
    order_number: string;
    status: string;
    total: number | string;
    customer_name?: string | null;
    customers: { name: string } | { name: string }[] | null;
    quote_request?:
      | { contact_name: string }
      | { contact_name: string }[]
      | null;
  }[];
  customers: {
    id: string;
    name: string;
    type: string;
    city: string | null;
  }[];
  products: {
    id: string;
    name: string;
    sku: string;
    stock: number;
  }[];
};

export async function searchAll(
  supabase: SupabaseClient,
  query: string,
): Promise<GlobalSearchResults> {
  const trimmed = query.trim();
  if (trimmed.length < 2) {
    return { orders: [], customers: [], products: [] };
  }

  const safe = escapeIlike(trimmed);
  const pattern = `%${safe}%`;

  const [orders, customers, products] = await Promise.all([
    supabase
      .from("orders")
      .select(
        "id, order_number, status, total, customer_name, customers(name), quote_request:quote_request_id(contact_name)",
      )
      .ilike("order_number", pattern)
      .order("created_at", { ascending: false })
      .limit(5),
    supabase
      .from("customers")
      .select("id, name, type, city")
      .ilike("name", pattern)
      .order("name", { ascending: true })
      .limit(5),
    supabase
      .from("products")
      .select("id, name, sku, stock")
      .or(`name.ilike.${pattern},sku.ilike.${pattern}`)
      .order("name", { ascending: true })
      .limit(5),
  ]);

  return {
    orders: (orders.data ?? []) as GlobalSearchResults["orders"],
    customers: (customers.data ?? []) as GlobalSearchResults["customers"],
    products: (products.data ?? []) as GlobalSearchResults["products"],
  };
}
