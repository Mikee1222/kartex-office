import { getGoogleMapsGeocodeKey } from "@/lib/env/google-maps";

export type ReverseGeocodeResult = {
  streetLabel: string;
};

function pickComponent(
  components: Array<{ long_name: string; types: string[] }>,
  ...types: string[]
): string | null {
  for (const type of types) {
    const match = components.find((c) => c.types.includes(type));
    if (match?.long_name) return match.long_name;
  }
  return null;
}

/** Format Google address_components as "Street, City" (Greek-style). */
export function formatStreetLabel(
  components: Array<{ long_name: string; types: string[] }>,
): string | null {
  const route = pickComponent(components, "route");
  const city = pickComponent(
    components,
    "locality",
    "administrative_area_level_2",
    "administrative_area_level_3",
  );

  if (route && city) return `${route}, ${city}`;
  if (route) return route;
  if (city) return city;

  const neighborhood = pickComponent(
    components,
    "neighborhood",
    "sublocality",
    "sublocality_level_1",
  );
  return neighborhood;
}

/** Google Reverse Geocoding API — server-side only. */
export async function reverseGeocodeWithGoogle(
  lat: number,
  lng: number,
): Promise<ReverseGeocodeResult | null> {
  const key = getGoogleMapsGeocodeKey();
  if (!key) return null;

  const url = new URL("https://maps.googleapis.com/maps/api/geocode/json");
  url.searchParams.set("latlng", `${lat},${lng}`);
  url.searchParams.set("language", "el");
  url.searchParams.set("key", key);

  const res = await fetch(url.toString());
  if (!res.ok) return null;

  const json = (await res.json()) as {
    status?: string;
    results?: Array<{
      address_components?: Array<{ long_name: string; types: string[] }>;
    }>;
  };

  if (json.status !== "OK" || !json.results?.length) return null;

  for (const result of json.results) {
    const components = result.address_components ?? [];
    const streetLabel = formatStreetLabel(components);
    if (streetLabel) return { streetLabel };
  }

  return null;
}
