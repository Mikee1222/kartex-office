import { NextResponse } from "next/server";

import { getSessionAccess } from "@/lib/auth/get-session-access";
import { getAthensDateString } from "@/lib/datetime";
import { loadTripsForDate } from "@/lib/trips/load-trips";
import { createDeliveryTrip } from "@/lib/trips/trip-mutations";
import { loadDriversWithVehicles } from "@/lib/users/load-drivers-with-vehicles";

export async function GET(request: Request) {
  const access = await getSessionAccess();
  if (!access) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const date = searchParams.get("date") ?? getAthensDateString();

  const { groups, error } = await loadTripsForDate(date);
  if (error) {
    return NextResponse.json({ error }, { status: 500 });
  }

  return NextResponse.json({ groups, date });
}

export async function POST(request: Request) {
  const access = await getSessionAccess();
  if (!access) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json()) as {
    driverId?: string;
    tripDate?: string;
    notes?: string | null;
    tripNumber?: number;
  };

  if (!body.driverId) {
    return NextResponse.json({ error: "Απαιτείται οδηγός." }, { status: 400 });
  }

  const tripDate = body.tripDate ?? getAthensDateString();
  const { drivers, error: driversError } = await loadDriversWithVehicles();

  if (driversError) {
    return NextResponse.json({ error: driversError }, { status: 500 });
  }

  const driver = drivers.find((row) => row.id === body.driverId);
  if (!driver) {
    return NextResponse.json({ error: "Δεν βρέθηκε ο οδηγός." }, { status: 404 });
  }

  const { id, tripNumber, error } = await createDeliveryTrip({
    driverId: driver.id,
    driverName: driver.name,
    vehicleId: driver.vehicleId,
    tripDate,
    notes: body.notes,
    tripNumber: body.tripNumber,
  });

  if (error || !id) {
    return NextResponse.json({ error: error ?? "Αποτυχία δημιουργίας." }, { status: 500 });
  }

  return NextResponse.json({ id, tripNumber });
}
