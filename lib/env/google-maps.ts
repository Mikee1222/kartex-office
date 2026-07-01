/** Server-side Geocoding API key (never exposed to the client bundle). */
export function getGoogleMapsServerKey(): string | undefined {
  return process.env.GOOGLE_MAPS_API_KEY?.trim() || undefined;
}

/** Client-safe key for Maps JavaScript API in the browser. */
export function getGoogleMapsPublicKey(): string | undefined {
  return process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY?.trim() || undefined;
}

/** Prefer server key; fall back to public key for server-only geocode routes. */
export function getGoogleMapsGeocodeKey(): string | undefined {
  return getGoogleMapsServerKey() ?? getGoogleMapsPublicKey();
}
