import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{ id: string }>;
};

type OrderItemRow = {
  product_id: string | null;
  quantity: number;
};

export async function POST(_request: Request, context: RouteContext) {
  const { id: orderId } = await context.params;

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: order, error: orderError } = await supabase
    .from("orders")
    .select("id, stock_deducted")
    .eq("id", orderId)
    .single();

  if (orderError || !order) {
    return NextResponse.json({ error: "Η παραγγελία δεν βρέθηκε." }, { status: 404 });
  }

  if (order.stock_deducted) {
    return NextResponse.json({ ok: true, alreadyDeducted: true });
  }

  const { data: items, error: itemsError } = await supabase
    .from("order_items")
    .select("product_id, quantity")
    .eq("order_id", orderId);

  if (itemsError) {
    console.error("[confirm] order_items error", itemsError);
    return NextResponse.json({ error: itemsError.message }, { status: 500 });
  }

  const lines = (items ?? []) as OrderItemRow[];

  for (const item of lines) {
    if (!item.product_id) continue;

    const quantity = item.quantity ?? 0;
    if (quantity <= 0) continue;

    const { error: rpcError } = await supabase.rpc("decrease_stock", {
      p_product_id: item.product_id,
      p_quantity: quantity,
    });

    if (rpcError) {
      console.error("[confirm] decrease_stock failed", item.product_id, rpcError);
      return NextResponse.json({ error: rpcError.message }, { status: 500 });
    }
  }

  const { error: flagError } = await supabase
    .from("orders")
    .update({ stock_deducted: true })
    .eq("id", orderId)
    .eq("stock_deducted", false);

  if (flagError) {
    console.error("[confirm] stock_deducted flag error", flagError);
    return NextResponse.json({ error: flagError.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
