import type { LiveDriverLocation } from "@/lib/drivers/live-map-types";

export const TRAIL_WINDOW_MS = 20 * 60 * 1000;
export const MAX_TRAIL_POINTS = 120;

export function trimLocationTrail(
  trail: LiveDriverLocation[],
  now = Date.now(),
): LiveDriverLocation[] {
  const cutoff = now - TRAIL_WINDOW_MS;
  const trimmed = trail.filter((point) => {
    const ts = new Date(point.recordedAt).getTime();
    return !Number.isNaN(ts) && ts >= cutoff;
  });
  if (trimmed.length <= MAX_TRAIL_POINTS) return trimmed;
  return trimmed.slice(trimmed.length - MAX_TRAIL_POINTS);
}

export function appendLocationTrail(
  trail: LiveDriverLocation[],
  point: LiveDriverLocation,
  now = Date.now(),
): LiveDriverLocation[] {
  const last = trail[trail.length - 1];
  if (
    last &&
    last.lat === point.lat &&
    last.lng === point.lng &&
    last.recordedAt === point.recordedAt
  ) {
    return trail;
  }
  return trimLocationTrail([...trail, point], now);
}
