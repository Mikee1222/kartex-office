import { NextResponse } from "next/server";

import { getSessionAccess } from "@/lib/auth/get-session-access";
import { estimateEtaMinutes } from "@/lib/drivers/eta";
import { fetchDrivingEtaMinutes } from "@/lib/google-maps/distance-matrix";

type EtaRequestItem = {
  tripId: string;
  origin: { lat: number; lng: number };
  destination: { lat: number; lng: number };
};

type EtaResponseItem = {
  minutes: number;
  source: "matrix" | "estimate";
};

export async function POST(request: Request) {
  const access = await getSessionAccess();
  if (!access) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { requests?: EtaRequestItem[] };
  try {
    body = (await request.json()) as { requests?: EtaRequestItem[] };
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const requests = body.requests ?? [];
  if (requests.length === 0) {
    return NextResponse.json({ etas: {} });
  }

  if (requests.length > 20) {
    return NextResponse.json({ error: "Too many requests" }, { status: 400 });
  }

  const etas: Record<string, EtaResponseItem> = {};

  await Promise.all(
    requests.map(async (item) => {
      const matrix = await fetchDrivingEtaMinutes(item.origin, item.destination);
      if (matrix) {
        etas[item.tripId] = matrix;
        return;
      }

      etas[item.tripId] = {
        minutes: estimateEtaMinutes(item.origin, item.destination),
        source: "estimate",
      };
    }),
  );

  return NextResponse.json({ etas });
}
