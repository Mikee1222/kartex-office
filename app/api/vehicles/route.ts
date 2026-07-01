import { NextResponse } from "next/server";

import { getSessionAccess } from "@/lib/auth/get-session-access";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Vehicle } from "@/lib/vehicles/types";

export async function GET() {
  const access = await getSessionAccess();
  if (!access) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const admin = createAdminClient();
  const [{ data, error }, { drivers }] = await Promise.all([
    admin
      .from("vehicles")
      .select("id, plate, model, max_boxes, notes, is_active")
      .order("plate"),
    import("@/lib/users/load-drivers-with-vehicles").then((m) =>
      m.loadDriversWithVehicles(),
    ),
  ]);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const driverNames = new Map(drivers.map((d) => [d.id, d.name]));

  const vehicleIds = (data ?? []).map((row) => row.id);
  const { data: roleRows } = await admin
    .from("user_roles")
    .select("user_id, vehicle_id")
    .eq("role", "driver")
    .in("vehicle_id", vehicleIds.length > 0 ? vehicleIds : ["00000000-0000-0000-0000-000000000000"]);

  const driverByVehicle = new Map(
    (roleRows ?? []).map((row) => [row.vehicle_id, row.user_id] as const),
  );

  const vehicles = (data ?? []).map((row) => {
    const driverId = driverByVehicle.get(row.id) ?? null;
    return {
      id: row.id,
      plate: row.plate,
      model: row.model,
      maxBoxes: row.max_boxes,
      notes: row.notes,
      isActive: row.is_active,
      assignedDriverId: driverId,
      assignedDriverName: driverId ? driverNames.get(driverId) ?? "—" : null,
    } satisfies Vehicle;
  });
  return NextResponse.json({ vehicles });
}

export async function POST(request: Request) {
  const access = await getSessionAccess();
  if (!access) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json()) as {
    plate?: string;
    model?: string;
    maxBoxes?: number;
    notes?: string;
    isActive?: boolean;
  };

  const plate = body.plate?.trim().toUpperCase();
  if (!plate) {
    return NextResponse.json({ error: "Η πινακίδα είναι υποχρεωτική." }, { status: 400 });
  }
  if (!body.maxBoxes || body.maxBoxes < 1) {
    return NextResponse.json(
      { error: "Τα μέγιστα κιβώτια πρέπει να είναι ≥ 1." },
      { status: 400 },
    );
  }

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("vehicles")
    .insert({
      plate,
      model: body.model?.trim() || null,
      max_boxes: body.maxBoxes,
      notes: body.notes?.trim() || null,
      is_active: body.isActive ?? true,
    })
    .select("id")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ id: data.id });
}
