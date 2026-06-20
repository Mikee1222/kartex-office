import { type OrderDetail } from "@/components/orders/order-detail-types";
import {
  mapSupabaseOrderToDetail,
  ORDER_DETAIL_SELECT,
  type OrderDetailQueryRow,
} from "@/components/orders/map-order-detail";
import { createClient } from "@/lib/supabase/client";

export async function fetchOrderDetailById(
  orderId: string,
): Promise<OrderDetail | null> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("orders")
    .select(ORDER_DETAIL_SELECT)
    .eq("id", orderId)
    .single();

  if (error || !data) return null;
  return mapSupabaseOrderToDetail(data as OrderDetailQueryRow);
}
