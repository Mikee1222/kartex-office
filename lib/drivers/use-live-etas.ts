import { formatEtaGreek } from "@/lib/drivers/eta";
import type { TripEta } from "@/lib/drivers/eta";

/** Minimum interval between ETA API calls per trip (ms). */
export const ETA_REFRESH_MS = 60_000;

export function buildEtaRequests(
  drivers: {
    tripId: string;
    location: { lat: number; lng: number } | null;
    nextStop: { lat: number; lng: number } | null;
  }[],
): { tripId: string; origin: { lat: number; lng: number }; destination: { lat: number; lng: number } }[] {
  return drivers
    .filter((d) => d.location && d.nextStop)
    .map((d) => ({
      tripId: d.tripId,
      origin: { lat: d.location!.lat, lng: d.location!.lng },
      destination: { lat: d.nextStop!.lat, lng: d.nextStop!.lng },
    }));
}

export async function fetchTripEtas(
  requests: ReturnType<typeof buildEtaRequests>,
): Promise<Record<string, TripEta>> {
  if (requests.length === 0) return {};

  const res = await fetch("/api/drivers/live/eta", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ requests }),
  });

  if (!res.ok) return {};

  const json = (await res.json()) as {
    etas?: Record<string, TripEta>;
  };

  return json.etas ?? {};
}

export { formatEtaGreek };
