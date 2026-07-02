import { resolveScheduleDate } from "@/lib/drivers/capacity";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  addOrderToTrip,
  createDeliveryTrip,
} from "@/lib/trips/trip-mutations";
import type { StatusHistoryEntry } from "@/lib/orders/status-timeline";

export type AssignDriverPayload = {
  orderId: string;
  driverId: string;
  driverName: string;
  vehicleId: string | null;
  deliveryDate: string | null;
  orderBoxes: number;
  statusHistory: StatusHistoryEntry[];
  changedByEmail: string;
};

export type AssignDriverResult = {
  error: string | null;
  tripId?: string;
  tripNumber?: number;
  deliverySequence?: number;
  totalBoxes?: number;
  warning?: string;
};

type ActiveTripRow = {
  id: string;
  status: string;
  trip_number: number;
};

/**
 * Assign an order to a driver by finding or creating a delivery trip for the day,
 * then appending the order as a stop via trip-mutations.
 */
export async function assignDriverToOrder(
  payload: AssignDriverPayload,
): Promise<AssignDriverResult> {
  const admin = createAdminClient();
  const scheduleDate = resolveScheduleDate(payload.deliveryDate);

  const { data: existingTrips, error: tripsError } = await admin
    .from("delivery_trips")
    .select("id, status, trip_number")
    .eq("driver_id", payload.driverId)
    .eq("trip_date", scheduleDate)
    .neq("status", "completed")
    .order("trip_number", { ascending: false });

  if (tripsError) {
    return { error: tripsError.message };
  }

  let tripId: string;
  let tripNumber: number;
  let warning: string | undefined;

  const trips = (existingTrips ?? []) as ActiveTripRow[];

  if (trips.length > 0) {
    const pendingTrip = trips.find((trip) => trip.status === "pending");
    const chosen = pendingTrip ?? trips[0];
    tripId = chosen.id;
    tripNumber = chosen.trip_number;
    if (trips.length > 1) {
      warning = `Βρέθηκαν ${trips.length} ενεργά δρομολόγια — προστέθηκε στο #${tripNumber}.`;
    }
  } else {
    const created = await createDeliveryTrip({
      driverId: payload.driverId,
      driverName: payload.driverName,
      vehicleId: payload.vehicleId,
      tripDate: scheduleDate,
    });

    if (created.error || !created.id) {
      return {
        error: created.error ?? "Αποτυχία δημιουργίας δρομολογίου.",
      };
    }

    tripId = created.id;
    tripNumber = created.tripNumber ?? 1;
  }

  const { error: addError, totalBoxes } = await addOrderToTrip({
    tripId,
    orderId: payload.orderId,
    changedByEmail: payload.changedByEmail,
  });

  if (addError) {
    return { error: addError };
  }

  const { data: orderRow, error: orderError } = await admin
    .from("orders")
    .select("delivery_sequence")
    .eq("id", payload.orderId)
    .maybeSingle();

  if (orderError) {
    return { error: orderError.message };
  }

  return {
    error: null,
    tripId,
    tripNumber,
    deliverySequence: orderRow?.delivery_sequence ?? undefined,
    totalBoxes,
    warning,
  };
}

export async function getDriverCapacityForAssign(
  driverId: string,
  deliveryDate: string | null,
): Promise<{
  vehicleId: string | null;
  plate: string | null;
  model: string | null;
  maxBoxes: number;
  currentBoxes: number;
  error: string | null;
}> {
  const admin = createAdminClient();
  const scheduleDate = resolveScheduleDate(deliveryDate);

  const { data: roleRow, error: roleError } = await admin
    .from("user_roles")
    .select("vehicle_id, vehicles ( id, plate, model, max_boxes, is_active )")
    .eq("user_id", driverId)
    .eq("role", "driver")
    .maybeSingle();

  if (roleError) {
    return {
      vehicleId: null,
      plate: null,
      model: null,
      maxBoxes: 0,
      currentBoxes: 0,
      error: roleError.message,
    };
  }

  const vehicle = roleRow?.vehicles;
  const vehicleRow = Array.isArray(vehicle) ? vehicle[0] : vehicle;

  if (!vehicleRow || !vehicleRow.is_active) {
    return {
      vehicleId: null,
      plate: null,
      model: null,
      maxBoxes: 0,
      currentBoxes: 0,
      error: "Ο οδηγός δεν έχει ενεργό όχημα.",
    };
  }

  const { data: tripRows, error: tripsError } = await admin
    .from("delivery_trips")
    .select("total_boxes")
    .eq("driver_id", driverId)
    .eq("trip_date", scheduleDate)
    .neq("status", "completed");

  if (tripsError) {
    return {
      vehicleId: vehicleRow.id,
      plate: vehicleRow.plate,
      model: vehicleRow.model,
      maxBoxes: vehicleRow.max_boxes,
      currentBoxes: 0,
      error: tripsError.message,
    };
  }

  const currentBoxes =
    tripRows?.reduce((sum, row) => sum + (row.total_boxes ?? 0), 0) ?? 0;

  return {
    vehicleId: vehicleRow.id,
    plate: vehicleRow.plate,
    model: vehicleRow.model,
    maxBoxes: vehicleRow.max_boxes,
    currentBoxes,
    error: null,
  };
}
