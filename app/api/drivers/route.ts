import { NextResponse } from "next/server";

import { getSessionAccess } from "@/lib/auth/get-session-access";
import { loadDriversWithVehicles } from "@/lib/users/load-drivers-with-vehicles";

export async function GET() {
  const access = await getSessionAccess();
  if (!access) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { drivers, error } = await loadDriversWithVehicles();
  if (error) {
    return NextResponse.json({ error }, { status: 500 });
  }

  return NextResponse.json({ drivers });
}
