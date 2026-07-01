import { NextResponse } from "next/server";

import { getSessionAccess } from "@/lib/auth/get-session-access";
import { loadLiveDrivers } from "@/lib/drivers/load-live-drivers";
import { getGoogleMapsPublicKey } from "@/lib/env/google-maps";

export async function GET() {
  const access = await getSessionAccess();
  if (!access) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { today, drivers, error } = await loadLiveDrivers();

  if (error) {
    return NextResponse.json({ error }, { status: 500 });
  }

  return NextResponse.json({
    today,
    drivers,
    mapsApiKey: getGoogleMapsPublicKey() ?? null,
  });
}
