import { NextResponse } from "next/server";

import { getSessionAccess } from "@/lib/auth/get-session-access";
import { reorderTripOrders } from "@/lib/trips/trip-mutations";

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, context: RouteContext) {
  const access = await getSessionAccess();
  if (!access) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: tripId } = await context.params;
  const body = (await request.json()) as { orderIds?: string[] };

  if (!body.orderIds?.length) {
    return NextResponse.json({ error: "Απαιτείται σειρά παραγγελιών." }, { status: 400 });
  }

  const { error } = await reorderTripOrders(tripId, body.orderIds);

  if (error) {
    return NextResponse.json({ error }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}
