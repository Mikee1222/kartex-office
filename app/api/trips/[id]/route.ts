import { NextResponse } from "next/server";

import { getSessionAccess } from "@/lib/auth/get-session-access";
import { deleteDeliveryTrip, updateTripDate } from "@/lib/trips/trip-mutations";

type RouteContext = { params: Promise<{ id: string }> };

export async function DELETE(_request: Request, context: RouteContext) {
  const access = await getSessionAccess();
  if (!access) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;
  const { error, detachedOrderCount } = await deleteDeliveryTrip({
    tripId: id,
    changedByEmail: access.email,
  });

  if (error) {
    const status = error.includes("GPS") || error.includes("ιστορικό") ? 409 : 400;
    return NextResponse.json({ error }, { status });
  }

  return NextResponse.json({ ok: true, detachedOrderCount: detachedOrderCount ?? 0 });
}

export async function PATCH(request: Request, context: RouteContext) {
  const access = await getSessionAccess();
  if (!access) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;
  const body = (await request.json()) as { tripDate?: string };

  if (!body.tripDate?.trim()) {
    return NextResponse.json({ error: "Απαιτείται ημερομηνία." }, { status: 400 });
  }

  const { error } = await updateTripDate(id, body.tripDate.trim());
  if (error) {
    return NextResponse.json({ error }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}
