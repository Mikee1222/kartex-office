import { getGoogleMapsGeocodeKey } from "@/lib/env/google-maps";

export type GeoPoint = { lat: number; lng: number };

/** Google Geocoding API — server-side only. */
export async function geocodeWithGoogle(
  address: string,
): Promise<GeoPoint | null> {
  const key = getGoogleMapsGeocodeKey();
  if (!key || !address.trim()) return null;

  const url = new URL("https://maps.googleapis.com/maps/api/geocode/json");
  url.searchParams.set("address", address);
  url.searchParams.set("key", key);

  const res = await fetch(url.toString());
  if (!res.ok) return null;

  const json = (await res.json()) as {
    status?: string;
    results?: Array<{
      geometry?: { location?: { lat: number; lng: number } };
    }>;
  };

  if (json.status !== "OK" || !json.results?.[0]?.geometry?.location) {
    return null;
  }

  const { lat, lng } = json.results[0].geometry.location;
  return { lat, lng };
}
