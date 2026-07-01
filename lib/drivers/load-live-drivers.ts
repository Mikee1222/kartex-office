import { getAthensDateString } from "@/lib/datetime";
import { isStopDelivered } from "@/lib/drivers/is-stop-delivered";
import { resolveNextStopsByTrip } from "@/lib/drivers/load-next-stops";
import { TRAIL_WINDOW_MS } from "@/lib/drivers/location-trail";
import type { LiveDriverLocation, LiveDriverRow } from "@/lib/drivers/live-map-types";
import { createAdminClient } from "@/lib/supabase/admin";

type TripRow = {
  id: string;
  driver_id: string;
  driver_name: string;
  trip_number: number;
};

type OrderRow = {
  trip_id: string | null;
  status: string;
  delivery_sequence: number | null;
  customers?:
    | { lat: number | null; lng: number | null }
    | { lat: number | null; lng: number | null }[]
    | null;
};

type LocationRow = {
  driver_id: string;
  trip_id: string | null;
  lat: number;
  lng: number;
  recorded_at: string;
};

function latestLocationByTrip(
  rows: LocationRow[],
  tripIds: Set<string>,
  tripIdByDriver: Map<string, string>,
): Map<string, LocationRow> {
  const latest = new Map<string, LocationRow>();

  for (const row of rows) {
    const tripKey =
      row.trip_id && tripIds.has(row.trip_id)
        ? row.trip_id
        : tripIdByDriver.get(row.driver_id);

    if (!tripKey || latest.has(tripKey)) continue;
    latest.set(tripKey, row);
  }

  return latest;
}

function trailsByTrip(
  rows: LocationRow[],
  tripIds: Set<string>,
  tripIdByDriver: Map<string, string>,
): Map<string, LiveDriverLocation[]> {
  const trails = new Map<string, LiveDriverLocation[]>();

  for (const row of rows) {
    const tripKey =
      row.trip_id && tripIds.has(row.trip_id)
        ? row.trip_id
        : tripIdByDriver.get(row.driver_id);

    if (!tripKey) continue;

    const point: LiveDriverLocation = {
      lat: row.lat,
      lng: row.lng,
      recordedAt: row.recorded_at,
    };

    const list = trails.get(tripKey) ?? [];
    list.push(point);
    trails.set(tripKey, list);
  }

  return trails;
}

export async function loadLiveDrivers(today = getAthensDateString()): Promise<{
  today: string;
  drivers: LiveDriverRow[];
  error: string | null;
}> {
  const admin = createAdminClient();

  const { data: tripRows, error: tripsError } = await admin
    .from("delivery_trips")
    .select("id, driver_id, driver_name, trip_number")
    .eq("trip_date", today)
    .eq("status", "in_progress")
    .order("trip_number", { ascending: true });

  if (tripsError) {
    return { today, drivers: [], error: tripsError.message };
  }

  const trips = (tripRows ?? []) as TripRow[];
  if (trips.length === 0) {
    return { today, drivers: [], error: null };
  }

  const tripIds = trips.map((trip) => trip.id);
  const tripIdSet = new Set(tripIds);
  const tripIdByDriver = new Map(
    trips.map((trip) => [trip.driver_id, trip.id] as const),
  );

  const { data: orderRows, error: ordersError } = await admin
    .from("orders")
    .select(
      `
      trip_id,
      status,
      delivery_sequence,
      customers ( lat, lng )
    `,
    )
    .in("trip_id", tripIds);

  if (ordersError) {
    return { today, drivers: [], error: ordersError.message };
  }

  const stopsByTrip = new Map<string, { total: number; remaining: number }>();
  for (const row of (orderRows ?? []) as OrderRow[]) {
    if (!row.trip_id) continue;
    const current = stopsByTrip.get(row.trip_id) ?? { total: 0, remaining: 0 };
    current.total += 1;
    if (!isStopDelivered(row.status)) {
      current.remaining += 1;
    }
    stopsByTrip.set(row.trip_id, current);
  }

  const nextStopsByTrip = resolveNextStopsByTrip((orderRows ?? []) as OrderRow[]);

  const driverIds = [...new Set(trips.map((trip) => trip.driver_id))];
  const trailSince = new Date(Date.now() - TRAIL_WINDOW_MS).toISOString();

  const [latestLocationsResult, trailLocationsResult] = await Promise.all([
    admin
      .from("driver_locations")
      .select("driver_id, trip_id, lat, lng, recorded_at")
      .in("driver_id", driverIds)
      .order("recorded_at", { ascending: false })
      .limit(500),
    admin
      .from("driver_locations")
      .select("driver_id, trip_id, lat, lng, recorded_at")
      .in("driver_id", driverIds)
      .gte("recorded_at", trailSince)
      .order("recorded_at", { ascending: true })
      .limit(2000),
  ]);

  if (latestLocationsResult.error) {
    return { today, drivers: [], error: latestLocationsResult.error.message };
  }

  if (trailLocationsResult.error) {
    return { today, drivers: [], error: trailLocationsResult.error.message };
  }

  const latestByTrip = latestLocationByTrip(
    (latestLocationsResult.data ?? []) as LocationRow[],
    tripIdSet,
    tripIdByDriver,
  );

  const trailsMap = trailsByTrip(
    (trailLocationsResult.data ?? []) as LocationRow[],
    tripIdSet,
    tripIdByDriver,
  );

  const drivers: LiveDriverRow[] = trips.map((trip) => {
    const stops = stopsByTrip.get(trip.id) ?? { total: 0, remaining: 0 };
    const locationRow = latestByTrip.get(trip.id);

    return {
      tripId: trip.id,
      tripNumber: trip.trip_number,
      driverId: trip.driver_id,
      driverName: trip.driver_name,
      stopsRemaining: stops.remaining,
      totalStops: stops.total,
      location: locationRow
        ? {
            lat: locationRow.lat,
            lng: locationRow.lng,
            recordedAt: locationRow.recorded_at,
          }
        : null,
      locationTrail: trailsMap.get(trip.id) ?? [],
      nextStop: nextStopsByTrip.get(trip.id) ?? null,
    };
  });

  return { today, drivers, error: null };
}
