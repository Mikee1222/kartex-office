import { NextResponse } from "next/server";

import { getSessionAccess } from "@/lib/auth/get-session-access";
import { addOrderToTrip } from "@/lib/trips/trip-mutations";

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(request: Request, context: RouteContext) {
  const access = await getSessionAccess();
  if (!access) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: tripId } = await context.params;
  const body = (await request.json()) as { orderId?: string };

  if (!body.orderId) {
    return NextResponse.json({ error: "Απαιτείται παραγγελία." }, { status: 400 });
  }

  const { error, totalBoxes } = await addOrderToTrip({
    tripId,
    orderId: body.orderId,
    changedByEmail: access.email,
  });

  if (error) {
    return NextResponse.json({ error }, { status: 400 });
  }

  return NextResponse.json({ ok: true, totalBoxes });
}
