import { NextResponse } from "next/server";

import { OrderStatus } from "@/components/orders/types";
import { getSessionAccess } from "@/lib/auth/get-session-access";
import { createAdminClient } from "@/lib/supabase/admin";
import type { AvailableTripOrder } from "@/lib/trips/types";

export async function GET() {
  const access = await getSessionAccess();
  if (!access) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("orders")
    .select(
      `
      id,
      order_number,
      boxes_count,
      delivery_date,
      customers ( name, address )
    `,
    )
    .eq("status", OrderStatus.ReadyForShipment)
    .is("trip_id", null)
    .order("order_number", { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const orders: AvailableTripOrder[] = (data ?? []).map((row) => {
    const customer = row.customers;
    const customerRow = Array.isArray(customer) ? customer[0] : customer;
    return {
      id: row.id,
      orderNumber: row.order_number,
      customerName: customerRow?.name?.trim() || "—",
      address: customerRow?.address?.trim() || "—",
      boxesCount: row.boxes_count ?? 0,
      deliveryDate: row.delivery_date,
    };
  });

  return NextResponse.json({ orders });
}
