"use client";

import * as React from "react";

import { haversineKm } from "@/lib/geo/haversine";
import type { LiveDriverRow } from "@/lib/drivers/live-map-types";

const MIN_DISTANCE_KM = 0.1;
const MIN_INTERVAL_MS = 75_000;

type GeocodeMeta = {
  lat: number;
  lng: number;
  fetchedAt: number;
};

async function fetchStreetLabel(lat: number, lng: number): Promise<string | null> {
  const params = new URLSearchParams({
    lat: String(lat),
    lng: String(lng),
  });

  const res = await fetch(`/api/drivers/live/reverse-geocode?${params}`);
  if (!res.ok) return null;

  const json = (await res.json()) as { streetLabel?: string };
  return json.streetLabel?.trim() || null;
}

function shouldReverseGeocode(
  lat: number,
  lng: number,
  meta: GeocodeMeta | undefined,
  now: number,
): boolean {
  if (!meta) return true;
  const distanceKm = haversineKm(meta.lat, meta.lng, lat, lng);
  if (distanceKm >= MIN_DISTANCE_KM) return true;
  return now - meta.fetchedAt >= MIN_INTERVAL_MS;
}

/**
 * Throttled reverse geocoding for live driver positions.
 * Re-fetches when the driver moves ≥100 m or ≥75 s since the last lookup.
 * Keeps the last known street label visible while a new lookup is in flight.
 */
export function useDriverStreetNames(drivers: LiveDriverRow[]): Record<string, string> {
  const [streetNames, setStreetNames] = React.useState<Record<string, string>>({});
  const metaRef = React.useRef<Map<string, GeocodeMeta>>(new Map());
  const inFlightRef = React.useRef<Set<string>>(new Set());

  React.useEffect(() => {
    const now = Date.now();
    const activeTripIds = new Set<string>();

    for (const driver of drivers) {
      const loc = driver.location;
      if (!loc) continue;

      activeTripIds.add(driver.tripId);
      const meta = metaRef.current.get(driver.tripId);

      if (!shouldReverseGeocode(loc.lat, loc.lng, meta, now)) continue;
      if (inFlightRef.current.has(driver.tripId)) continue;

      inFlightRef.current.add(driver.tripId);

      void fetchStreetLabel(loc.lat, loc.lng)
        .then((label) => {
          if (!label) return;
          metaRef.current.set(driver.tripId, {
            lat: loc.lat,
            lng: loc.lng,
            fetchedAt: Date.now(),
          });
          setStreetNames((current) =>
            current[driver.tripId] === label
              ? current
              : { ...current, [driver.tripId]: label },
          );
        })
        .finally(() => {
          inFlightRef.current.delete(driver.tripId);
        });
    }

    for (const tripId of metaRef.current.keys()) {
      if (!activeTripIds.has(tripId)) {
        metaRef.current.delete(tripId);
      }
    }

    setStreetNames((current) => {
      let changed = false;
      const next = { ...current };
      for (const tripId of Object.keys(next)) {
        if (!activeTripIds.has(tripId)) {
          delete next[tripId];
          changed = true;
        }
      }
      return changed ? next : current;
    });
  }, [drivers]);

  return streetNames;
}
