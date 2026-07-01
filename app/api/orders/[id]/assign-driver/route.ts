import { NextResponse } from "next/server";

import { getSessionAccess } from "@/lib/auth/get-session-access";
import { assignDriverToOrder } from "@/lib/orders/assign-driver-to-order";
import type { StatusHistoryEntry } from "@/lib/orders/status-timeline";

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(request: Request, context: RouteContext) {
  const access = await getSessionAccess();
  if (!access) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: orderId } = await context.params;
  const body = (await request.json()) as {
    driverId?: string;
    driverName?: string;
    vehicleId?: string | null;
    deliveryDate?: string | null;
    orderBoxes?: number;
    statusHistory?: StatusHistoryEntry[];
  };

  if (!body.driverId || !body.driverName) {
    return NextResponse.json({ error: "Απαιτείται οδηγός." }, { status: 400 });
  }

  const { error } = await assignDriverToOrder({
    orderId,
    driverId: body.driverId,
    driverName: body.driverName,
    vehicleId: body.vehicleId ?? null,
    deliveryDate: body.deliveryDate ?? null,
    orderBoxes: body.orderBoxes ?? 0,
    statusHistory: body.statusHistory ?? [],
    changedByEmail: access.email,
  });

  if (error) {
    return NextResponse.json({ error }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
