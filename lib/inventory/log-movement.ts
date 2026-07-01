import type { SupabaseClient } from "@supabase/supabase-js";

export type InventoryMovementType = "in" | "out" | "adjustment";

export type LogInventoryMovementInput = {
  product_id: string;
  type: InventoryMovementType;
  quantity: number;
  reason?: string | null;
  order_id?: string | null;
  created_by?: string | null;
};

export async function logInventoryMovement(
  supabase: SupabaseClient,
  input: LogInventoryMovementInput,
) {
  const quantity = Math.abs(Math.round(input.quantity));
  if (quantity <= 0) return { error: null };

  let createdBy = input.created_by ?? null;
  if (!createdBy) {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    createdBy = user?.id ?? null;
  }

  const { error } = await supabase.from("inventory_movements").insert({
    product_id: input.product_id,
    type: input.type,
    quantity,
    reason: input.reason?.trim() || null,
    order_id: input.order_id ?? null,
    created_by: createdBy,
  });

  return { error };
}
