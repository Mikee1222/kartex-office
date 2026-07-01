import { NextResponse } from "next/server";

import { getSessionAccess } from "@/lib/auth/get-session-access";
import { getAthensDateString } from "@/lib/datetime";
import { capacityProgressPercent } from "@/lib/drivers/capacity";
import { createAdminClient } from "@/lib/supabase/admin";
import type { TripStatus } from "@/lib/trips/types";
import { loadDriversWithVehicles } from "@/lib/users/load-drivers-with-vehicles";

type DriverDayStatus = "available" | "on_trip" | "returned";

function resolveDriverDayStatus(
  trips: { status: TripStatus; tripNumber: number }[],
): { status: DriverDayStatus; label: string; activeTripNumber: number | null } {
  if (trips.length === 0) {
    return { status: "available", label: "Διαθέσιμος", activeTripNumber: null };
  }

  const inProgress = trips.find((trip) => trip.status === "in_progress");
  if (inProgress) {
    return {
      status: "on_trip",
      label: `Σε Δρομολόγιο #${inProgress.tripNumber}`,
      activeTripNumber: inProgress.tripNumber,
    };
  }

  const allCompleted = trips.every((trip) => trip.status === "completed");
  if (allCompleted) {
    return { status: "returned", label: "Επέστρεψε", activeTripNumber: null };
  }

  return { status: "available", label: "Διαθέσιμος", activeTripNumber: null };
}

export async function GET() {
  const access = await getSessionAccess();
  if (!access) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const today = getAthensDateString();
  const admin = createAdminClient();
  const { drivers, error: driversError } = await loadDriversWithVehicles();

  if (driversError) {
    return NextResponse.json({ error: driversError }, { status: 500 });
  }

  const driverIds = drivers.map((d) => d.id);

  const { data: tripRows, error: tripsError } = await admin
    .from("delivery_trips")
    .select("id, driver_id, status, total_boxes, trip_number")
    .eq("trip_date", today)
    .in(
      "driver_id",
      driverIds.length > 0 ? driverIds : ["00000000-0000-0000-0000-000000000000"],
    )
    .order("trip_number", { ascending: true });

  if (tripsError) {
    return NextResponse.json({ error: tripsError.message }, { status: 500 });
  }

  const tripIds = (tripRows ?? []).map((row) => row.id);
  const orderCountByTrip = new Map<string, number>();

  if (tripIds.length > 0) {
    const { data: orderRows, error: ordersError } = await admin
      .from("orders")
      .select("trip_id")
      .in("trip_id", tripIds);

    if (ordersError) {
      return NextResponse.json({ error: ordersError.message }, { status: 500 });
    }

    for (const row of orderRows ?? []) {
      if (!row.trip_id) continue;
      orderCountByTrip.set(row.trip_id, (orderCountByTrip.get(row.trip_id) ?? 0) + 1);
    }
  }

  const tripsByDriver = new Map<
    string,
    {
      id: string;
      tripNumber: number;
      status: TripStatus;
      totalBoxes: number;
      ordersCount: number;
    }[]
  >();

  for (const row of tripRows ?? []) {
    const list = tripsByDriver.get(row.driver_id) ?? [];
    list.push({
      id: row.id,
      tripNumber: row.trip_number,
      status: row.status as TripStatus,
      totalBoxes: row.total_boxes,
      ordersCount: orderCountByTrip.get(row.id) ?? 0,
    });
    tripsByDriver.set(row.driver_id, list);
  }

  const rows = drivers.map((driver) => {
    const trips = tripsByDriver.get(driver.id) ?? [];
    const maxBoxes = driver.maxBoxes ?? 0;
    const totalBoxesToday = trips.reduce((sum, trip) => sum + trip.totalBoxes, 0);
    const completedTrips = trips.filter((trip) => trip.status === "completed").length;
    const dayStatus = resolveDriverDayStatus(trips);

    return {
      id: driver.id,
      name: driver.name,
      email: driver.email,
      vehiclePlate: driver.vehiclePlate,
      vehicleModel: driver.vehicleModel,
      maxBoxes,
      totalBoxesToday,
      tripsCount: trips.length,
      completedTrips,
      totalTrips: trips.length,
      progressPercent: capacityProgressPercent(totalBoxesToday, maxBoxes),
      driverStatus: dayStatus.status,
      driverStatusLabel: dayStatus.label,
      activeTripNumber: dayStatus.activeTripNumber,
      todayTrips: trips,
    };
  });

  return NextResponse.json({ drivers: rows, today });
}
