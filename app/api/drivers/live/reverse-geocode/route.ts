import { NextResponse } from "next/server";

import { getSessionAccess } from "@/lib/auth/get-session-access";
import { reverseGeocodeWithGoogle } from "@/lib/geo/reverse-geocode-google";

export async function GET(request: Request) {
  const access = await getSessionAccess();
  if (!access) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const latRaw = searchParams.get("lat");
  const lngRaw = searchParams.get("lng");

  const lat = latRaw != null ? Number(latRaw) : NaN;
  const lng = lngRaw != null ? Number(lngRaw) : NaN;

  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    return NextResponse.json(
      { error: "Invalid lat/lng parameters." },
      { status: 400 },
    );
  }

  const result = await reverseGeocodeWithGoogle(lat, lng);

  if (!result) {
    return NextResponse.json(
      { error: "Reverse geocode failed." },
      { status: 502 },
    );
  }

  return NextResponse.json(result);
}
