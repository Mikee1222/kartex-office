type LatLng = { lat: number; lng: number };

/** Bearing in degrees clockwise from north (0–360). */
export function computeBearing(from: LatLng, to: LatLng): number {
  const lat1 = (from.lat * Math.PI) / 180;
  const lat2 = (to.lat * Math.PI) / 180;
  const dLng = ((to.lng - from.lng) * Math.PI) / 180;

  const y = Math.sin(dLng) * Math.cos(lat2);
  const x =
    Math.cos(lat1) * Math.sin(lat2) -
    Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLng);

  return ((Math.atan2(y, x) * 180) / Math.PI + 360) % 360;
}

/** Bearing from the last two trail points, if available. */
export function bearingFromTrail(
  trail: LatLng[],
): number | undefined {
  if (trail.length < 2) return undefined;
  const prev = trail[trail.length - 2]!;
  const last = trail[trail.length - 1]!;
  if (prev.lat === last.lat && prev.lng === last.lng) return undefined;
  return computeBearing(prev, last);
}
