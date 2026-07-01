import { getGoogleMapsGeocodeKey } from "@/lib/env/google-maps";
import type { EtaSource } from "@/lib/drivers/eta";

type LatLng = { lat: number; lng: number };

export type DistanceMatrixResult = {
  minutes: number;
  source: EtaSource;
};

type MatrixElement = {
  status: string;
  duration?: { value: number };
  duration_in_traffic?: { value: number };
};

type MatrixResponse = {
  status: string;
  rows?: { elements: MatrixElement[] }[];
  error_message?: string;
};

/**
 * Google Distance Matrix API (driving, with traffic when available).
 * Requires GOOGLE_MAPS_API_KEY with Distance Matrix API enabled.
 */
export async function fetchDrivingEtaMinutes(
  origin: LatLng,
  destination: LatLng,
): Promise<DistanceMatrixResult | null> {
  const apiKey = getGoogleMapsGeocodeKey();
  if (!apiKey) return null;

  const params = new URLSearchParams({
    origins: `${origin.lat},${origin.lng}`,
    destinations: `${destination.lat},${destination.lng}`,
    mode: "driving",
    departure_time: "now",
    traffic_model: "best_guess",
    key: apiKey,
  });

  const url = `https://maps.googleapis.com/maps/api/distancematrix/json?${params}`;

  const res = await fetch(url, { next: { revalidate: 0 } });
  if (!res.ok) return null;

  const data = (await res.json()) as MatrixResponse;
  if (data.status !== "OK") return null;

  const element = data.rows?.[0]?.elements?.[0];
  if (!element || element.status !== "OK") return null;

  const seconds =
    element.duration_in_traffic?.value ?? element.duration?.value ?? null;
  if (seconds == null) return null;

  return {
    minutes: Math.max(1, Math.round(seconds / 60)),
    source: "matrix",
  };
}
