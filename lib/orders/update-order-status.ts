import type { OrderStatus } from "@/components/orders/types";
import {
  appendStatusHistory,
  type StatusHistoryEntry,
} from "@/lib/orders/status-timeline";
import { createClient } from "@/lib/supabase/client";

type UpdateOrderStatusOptions = {
  orderId: string;
  newStatus: OrderStatus;
  statusHistory: StatusHistoryEntry[];
  extra?: Record<string, unknown>;
};

export async function updateOrderStatus({
  orderId,
  newStatus,
  statusHistory,
  extra,
}: UpdateOrderStatusOptions): Promise<{ error: string | null }> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const nextHistory = appendStatusHistory(
    statusHistory,
    newStatus,
    user?.email ?? "—",
  );

  const { error } = await supabase
    .from("orders")
    .update({
      status: newStatus,
      status_history: nextHistory,
      ...extra,
    })
    .eq("id", orderId);

  return { error: error?.message ?? null };
}
