import type { SupabaseClient } from "@supabase/supabase-js";

import { type OrderDeliveryHistoryEntry } from "@/components/orders/order-detail-types";
import { formatDateEl } from "@/types/database";

type DeliveryRow = {
  id: string;
  notes: string | null;
  created_at: string;
  delivery_items:
    | {
        quantity: number;
        order_items:
          | { products: { name: string } | { name: string }[] | null }
          | { products: { name: string } | { name: string }[] | null }[]
          | null;
      }[]
    | null;
};

function pickProductName(
  value: { name: string } | { name: string }[] | null | undefined,
): string {
  if (!value) return "—";
  const row = Array.isArray(value) ? value[0] : value;
  return row?.name?.trim() || "—";
}

export async function loadOrderDeliveries(
  supabase: SupabaseClient,
  orderId: string,
): Promise<OrderDeliveryHistoryEntry[]> {
  const { data, error } = await supabase
    .from("deliveries")
    .select(
      `
      id,
      notes,
      created_at,
      delivery_items (
        quantity,
        order_items (
          products ( name )
        )
      )
    `,
    )
    .eq("order_id", orderId)
    .order("created_at", { ascending: false });

  if (error || !data) return [];

  return (data as DeliveryRow[]).map((row) => ({
    id: row.id,
    createdAt: formatDateEl(row.created_at),
    notes: row.notes,
    items: (row.delivery_items ?? []).map((item) => {
      const orderItem = Array.isArray(item.order_items)
        ? item.order_items[0]
        : item.order_items;
      return {
        productName: pickProductName(orderItem?.products ?? null),
        quantity: item.quantity,
      };
    }),
  }));
}
