export const STALE_LOCATION_MS = 2 * 60 * 1000;

export function secondsSince(iso: string, now = Date.now()): number {
  const parsed = new Date(iso).getTime();
  if (Number.isNaN(parsed)) return Number.POSITIVE_INFINITY;
  return Math.max(0, Math.floor((now - parsed) / 1000));
}

export function formatLocationAgeGreek(iso: string, now = Date.now()): string {
  const seconds = secondsSince(iso, now);
  return `πριν ${seconds} δευτερόλεπτα`;
}

export function isLocationStale(iso: string, now = Date.now()): boolean {
  const parsed = new Date(iso).getTime();
  if (Number.isNaN(parsed)) return true;
  return now - parsed > STALE_LOCATION_MS;
}
