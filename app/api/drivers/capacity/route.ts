import { NextResponse } from "next/server";

import { getSessionAccess } from "@/lib/auth/get-session-access";
import {
  getCapacityStatus,
  capacityStatusLabel,
} from "@/lib/drivers/capacity";
import { getDriverCapacityForAssign } from "@/lib/orders/assign-driver-to-order";

export async function GET(request: Request) {
  const access = await getSessionAccess();
  if (!access) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const driverId = searchParams.get("driverId");
  const deliveryDate = searchParams.get("deliveryDate");

  if (!driverId) {
    return NextResponse.json({ error: "driverId required" }, { status: 400 });
  }

  const capacity = await getDriverCapacityForAssign(driverId, deliveryDate);
  if (capacity.error) {
    return NextResponse.json({ error: capacity.error }, { status: 500 });
  }

  const status = getCapacityStatus(capacity.currentBoxes, capacity.maxBoxes);

  return NextResponse.json({
    ...capacity,
    status,
    statusLabel: capacityStatusLabel(status),
  });
}
