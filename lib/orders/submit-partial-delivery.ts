import type { SupabaseClient } from "@supabase/supabase-js";

import { OrderStatus } from "@/components/orders/types";
import { logInventoryMovement } from "@/lib/inventory/log-movement";

export type PartialDeliveryLineInput = {
  orderItemId: string;
  productId: string | null;
  quantity: number;
};

export type SubmitPartialDeliveryInput = {
  orderId: string;
  isReserved: boolean;
  notes?: string;
  lines: PartialDeliveryLineInput[];
};

export type SubmitPartialDeliveryResult =
  | { ok: true; newStatus: string }
  | { ok: false; error: string };

export async function submitPartialDelivery(
  supabase: SupabaseClient,
  input: SubmitPartialDeliveryInput,
): Promise<SubmitPartialDeliveryResult> {
  const activeLines = input.lines.filter((line) => line.quantity > 0);
  if (activeLines.length === 0) {
    return { ok: false, error: "Εισάγετε τουλάχιστον μία ποσότητα παράδοσης." };
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: delivery, error: deliveryError } = await supabase
    .from("deliveries")
    .insert({
      order_id: input.orderId,
      notes: input.notes?.trim() || null,
      created_by: user?.id ?? null,
    })
    .select("id")
    .single();

  if (deliveryError || !delivery) {
    return {
      ok: false,
      error: deliveryError?.message || "Αποτυχία δημιουργίας παράδοσης.",
    };
  }

  for (const line of activeLines) {
    if (!line.productId) {
      return {
        ok: false,
        error: "Μία ή περισσότερες γραμμές δεν έχουν συνδεδεμένο προϊόν.",
      };
    }

    const { data: orderItem, error: fetchItemError } = await supabase
      .from("order_items")
      .select("id, quantity, quantity_delivered, picked_at, color_id")
      .eq("id", line.orderItemId)
      .eq("order_id", input.orderId)
      .single();

    if (fetchItemError || !orderItem) {
      return { ok: false, error: "Η γραμμή παραγγελίας δεν βρέθηκε." };
    }

    const delivered = orderItem.quantity_delivered ?? 0;
    const pending = orderItem.quantity - delivered;
    if (line.quantity > pending) {
      return {
        ok: false,
        error: `Η ποσότητα υπερβαίνει το εκκρεμές (${pending} τεμ.).`,
      };
    }

    const { error: deliveryItemError } = await supabase.from("delivery_items").insert({
      delivery_id: delivery.id,
      order_item_id: line.orderItemId,
      product_id: line.productId,
      quantity: line.quantity,
    });

    if (deliveryItemError) {
      return { ok: false, error: deliveryItemError.message };
    }

    const { error: updateItemError } = await supabase
      .from("order_items")
      .update({ quantity_delivered: delivered + line.quantity })
      .eq("id", line.orderItemId);

    if (updateItemError) {
      return { ok: false, error: updateItemError.message };
    }

    if (!orderItem.picked_at) {
      const { error: stockError } = await supabase.rpc("decrease_stock", {
        p_product_id: line.productId,
        p_quantity: line.quantity,
        p_color_id: orderItem.color_id ?? null,
      });

      if (stockError) {
        return { ok: false, error: stockError.message };
      }

      if (input.isReserved) {
        const { error: releaseError } = await supabase.rpc("release_reserved_stock", {
          p_product_id: line.productId,
          p_quantity: line.quantity,
        });
        if (releaseError) {
          return { ok: false, error: releaseError.message };
        }
      }

      await logInventoryMovement(supabase, {
        product_id: line.productId,
        type: "out",
        quantity: line.quantity,
        reason: "Παράδοση παραγγελίας",
        order_id: input.orderId,
        created_by: user?.id ?? null,
      });
    }
  }

  const { data: allItems, error: itemsError } = await supabase
    .from("order_items")
    .select("quantity, quantity_delivered")
    .eq("order_id", input.orderId);

  if (itemsError || !allItems?.length) {
    return { ok: false, error: itemsError?.message || "Αποτυχία ανάγνωσης γραμμών." };
  }

  const allFullyDelivered = allItems.every(
    (row) => (row.quantity_delivered ?? 0) >= row.quantity,
  );
  const anyDelivered = allItems.some((row) => (row.quantity_delivered ?? 0) > 0);

  const newStatus = allFullyDelivered
    ? OrderStatus.Completed
    : anyDelivered
      ? OrderStatus.PartialShipment
      : OrderStatus.Processing;

  const { error: statusError } = await supabase
    .from("orders")
    .update({ status: newStatus })
    .eq("id", input.orderId);

  if (statusError) {
    return { ok: false, error: statusError.message };
  }

  return { ok: true, newStatus };
}
