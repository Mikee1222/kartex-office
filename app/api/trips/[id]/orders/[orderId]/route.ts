import { NextResponse } from "next/server";

import { getSessionAccess } from "@/lib/auth/get-session-access";
import { removeOrderFromTrip } from "@/lib/trips/trip-mutations";

type RouteContext = { params: Promise<{ id: string; orderId: string }> };

export async function DELETE(_request: Request, context: RouteContext) {
  const access = await getSessionAccess();
  if (!access) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: tripId, orderId } = await context.params;

  const { error, totalBoxes } = await removeOrderFromTrip({
    tripId,
    orderId,
    changedByEmail: access.email,
  });

  if (error) {
    return NextResponse.json({ error }, { status: 400 });
  }

  return NextResponse.json({ ok: true, totalBoxes });
}
