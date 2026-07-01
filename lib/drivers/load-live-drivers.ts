import { getAthensDateString } from "@/lib/datetime";
import { isStopDelivered } from "@/lib/drivers/is-stop-delivered";
import type { LiveDriverRow } from "@/lib/drivers/live-map-types";
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
    .select("trip_id, status")
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

  const driverIds = [...new Set(trips.map((trip) => trip.driver_id))];

  const { data: locationRows, error: locationsError } = await admin
    .from("driver_locations")
    .select("driver_id, trip_id, lat, lng, recorded_at")
    .in("driver_id", driverIds)
    .order("recorded_at", { ascending: false })
    .limit(500);

  if (locationsError) {
    return { today, drivers: [], error: locationsError.message };
  }

  const latestByTrip = latestLocationByTrip(
    (locationRows ?? []) as LocationRow[],
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
    };
  });

  return { today, drivers, error: null };
}
