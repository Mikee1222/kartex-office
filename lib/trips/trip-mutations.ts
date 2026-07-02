import { OrderStatus } from "@/components/orders/types";
import {
  appendStatusHistory,
  type StatusHistoryEntry,
} from "@/lib/orders/status-timeline";
import { createAdminClient } from "@/lib/supabase/admin";
import type { TripStatus } from "@/lib/trips/types";

type TripRow = {
  id: string;
  driver_id: string;
  driver_name: string;
  vehicle_id: string | null;
  trip_date: string;
  status: TripStatus;
  total_boxes: number;
  notes: string | null;
  departed_at: string | null;
  returned_at: string | null;
  created_at: string;
};

type VehicleRow = {
  id: string;
  plate: string;
  model: string | null;
  max_boxes: number;
  is_active: boolean;
};

async function loadTrip(tripId: string): Promise<{
  trip: TripRow | null;
  vehicle: VehicleRow | null;
  error: string | null;
}> {
  const admin = createAdminClient();
  const { data: trip, error } = await admin
    .from("delivery_trips")
    .select(
      "id, driver_id, driver_name, vehicle_id, trip_date, status, total_boxes, notes, departed_at, returned_at, created_at",
    )
    .eq("id", tripId)
    .maybeSingle();

  if (error) {
    return { trip: null, vehicle: null, error: error.message };
  }
  if (!trip) {
    return { trip: null, vehicle: null, error: "Δεν βρέθηκε το δρομολόγιο." };
  }

  let vehicle: VehicleRow | null = null;
  if (trip.vehicle_id) {
    const { data: vehicleRow } = await admin
      .from("vehicles")
      .select("id, plate, model, max_boxes, is_active")
      .eq("id", trip.vehicle_id)
      .maybeSingle();
    vehicle = vehicleRow;
  }

  return { trip: trip as TripRow, vehicle, error: null };
}

/** Recompute delivery_trips.total_boxes from all linked orders. */
export async function recalculateTripTotalBoxes(
  tripId: string,
  admin: ReturnType<typeof createAdminClient> = createAdminClient(),
): Promise<{ totalBoxes: number; error: string | null }> {
  const { data: tripOrders, error: fetchError } = await admin
    .from("orders")
    .select("boxes_count")
    .eq("trip_id", tripId);

  if (fetchError) {
    return { totalBoxes: 0, error: fetchError.message };
  }

  const totalBoxes =
    tripOrders?.reduce((sum, order) => sum + (order.boxes_count ?? 0), 0) ?? 0;

  const { error: updateError } = await admin
    .from("delivery_trips")
    .update({
      total_boxes: totalBoxes,
      updated_at: new Date().toISOString(),
    })
    .eq("id", tripId);

  if (updateError) {
    return { totalBoxes: 0, error: updateError.message };
  }

  return { totalBoxes, error: null };
}

async function getNextTripNumber(
  admin: ReturnType<typeof createAdminClient>,
  driverId: string,
  tripDate: string,
): Promise<{ tripNumber: number; error: string | null }> {
  const { data: existingTrips, error } = await admin
    .from("delivery_trips")
    .select("trip_number")
    .eq("driver_id", driverId)
    .eq("trip_date", tripDate)
    .order("trip_number", { ascending: false })
    .limit(1);

  if (error) {
    return { tripNumber: 1, error: error.message };
  }

  const nextTripNumber =
    existingTrips && existingTrips.length > 0
      ? (existingTrips[0].trip_number ?? 0) + 1
      : 1;

  return { tripNumber: nextTripNumber, error: null };
}

export async function createDeliveryTrip(input: {
  driverId: string;
  driverName: string;
  vehicleId: string | null;
  tripDate: string;
  notes?: string | null;
  tripNumber?: number;
}): Promise<{ id: string | null; tripNumber: number | null; error: string | null }> {
  const admin = createAdminClient();

  let tripNumber = input.tripNumber;

  if (tripNumber == null || tripNumber < 1) {
    const resolved = await getNextTripNumber(admin, input.driverId, input.tripDate);
    if (resolved.error) {
      return { id: null, tripNumber: null, error: resolved.error };
    }
    tripNumber = resolved.tripNumber;
  }

  const { data, error } = await admin
    .from("delivery_trips")
    .insert({
      driver_id: input.driverId,
      driver_name: input.driverName,
      vehicle_id: input.vehicleId,
      trip_date: input.tripDate,
      trip_number: tripNumber,
      notes: input.notes?.trim() || null,
      status: "pending",
      total_boxes: 0,
    })
    .select("id, trip_number")
    .single();

  if (error) {
    return { id: null, tripNumber: null, error: error.message };
  }

  return { id: data.id, tripNumber: data.trip_number, error: null };
}

export async function addOrderToTrip(input: {
  tripId: string;
  orderId: string;
  changedByEmail: string;
}): Promise<{ error: string | null; totalBoxes?: number }> {
  const admin = createAdminClient();
  const { trip, vehicle, error: tripError } = await loadTrip(input.tripId);

  if (tripError || !trip) {
    return { error: tripError ?? "Δεν βρέθηκε το δρομολόγιο." };
  }

  if (trip.status === "completed") {
    return { error: "Το δρομολόγιο έχει ολοκληρωθεί." };
  }

  const { data: order, error: orderError } = await admin
    .from("orders")
    .select(
      "id, status, trip_id, boxes_count, status_history, delivery_sequence",
    )
    .eq("id", input.orderId)
    .maybeSingle();

  if (orderError) {
    return { error: orderError.message };
  }
  if (!order) {
    return { error: "Δεν βρέθηκε η παραγγελία." };
  }
  if (order.trip_id) {
    return { error: "Η παραγγελία ανήκει ήδη σε δρομολόγιο." };
  }
  if (order.status !== OrderStatus.ReadyForShipment) {
    return { error: "Η παραγγελία δεν είναι έτοιμη για αποστολή." };
  }

  const { data: existingOrders } = await admin
    .from("orders")
    .select("delivery_sequence")
    .eq("trip_id", input.tripId);

  const maxSequence = (existingOrders ?? []).reduce((max, row) => {
    const seq = row.delivery_sequence ?? 0;
    return seq > max ? seq : max;
  }, 0);

  const nextHistory = appendStatusHistory(
    (order.status_history as StatusHistoryEntry[] | null) ?? [],
    OrderStatus.Shipped,
    input.changedByEmail,
  );

  const { error: updateOrderError } = await admin
    .from("orders")
    .update({
      trip_id: input.tripId,
      assigned_driver_id: trip.driver_id,
      assigned_driver_name: trip.driver_name,
      vehicle_id: trip.vehicle_id,
      status: OrderStatus.Shipped,
      status_history: nextHistory,
      delivery_sequence: maxSequence + 1,
    })
    .eq("id", input.orderId);

  if (updateOrderError) {
    return { error: updateOrderError.message };
  }

  const { totalBoxes, error: recalcError } = await recalculateTripTotalBoxes(
    input.tripId,
    admin,
  );

  if (recalcError) {
    return { error: recalcError };
  }

  void vehicle;
  return {
    error: null,
    totalBoxes,
  };
}

export async function removeOrderFromTrip(input: {
  tripId: string;
  orderId: string;
  changedByEmail: string;
}): Promise<{ error: string | null; totalBoxes?: number }> {
  const admin = createAdminClient();
  const { trip, error: tripError } = await loadTrip(input.tripId);

  if (tripError || !trip) {
    return { error: tripError ?? "Δεν βρέθηκε το δρομολόγιο." };
  }

  if (trip.status !== "pending") {
    return { error: "Δεν μπορείτε να αφαιρέσετε παραγγελία από ενεργό δρομολόγιο." };
  }

  const { data: order, error: orderError } = await admin
    .from("orders")
    .select("id, trip_id, status_history")
    .eq("id", input.orderId)
    .maybeSingle();

  if (orderError) {
    return { error: orderError.message };
  }
  if (!order || order.trip_id !== input.tripId) {
    return { error: "Η παραγγελία δεν ανήκει σε αυτό το δρομολόγιο." };
  }

  const nextHistory = appendStatusHistory(
    (order.status_history as StatusHistoryEntry[] | null) ?? [],
    OrderStatus.ReadyForShipment,
    input.changedByEmail,
  );

  const { error: updateOrderError } = await admin
    .from("orders")
    .update({
      trip_id: null,
      assigned_driver_id: null,
      assigned_driver_name: null,
      vehicle_id: null,
      delivery_sequence: null,
      status: OrderStatus.ReadyForShipment,
      status_history: nextHistory,
    })
    .eq("id", input.orderId);

  if (updateOrderError) {
    return { error: updateOrderError.message };
  }

  const { totalBoxes, error: recalcError } = await recalculateTripTotalBoxes(
    input.tripId,
    admin,
  );

  if (recalcError) {
    return { error: recalcError };
  }

  return { error: null, totalBoxes };
}

export async function startTrip(tripId: string): Promise<{ error: string | null }> {
  const admin = createAdminClient();
  const { trip, error: tripError } = await loadTrip(tripId);

  if (tripError || !trip) {
    return { error: tripError ?? "Δεν βρέθηκε το δρομολόγιο." };
  }

  if (trip.status !== "pending") {
    return { error: "Το δρομολόγιο δεν είναι σε κατάσταση αναμονής." };
  }

  const { count, error: countError } = await admin
    .from("orders")
    .select("id", { count: "exact", head: true })
    .eq("trip_id", tripId);

  if (countError) {
    return { error: countError.message };
  }
  if (!count) {
    return { error: "Προσθέστε τουλάχιστον μία παραγγελία πριν την εκκίνηση." };
  }

  const now = new Date().toISOString();
  const { error } = await admin
    .from("delivery_trips")
    .update({
      status: "in_progress",
      departed_at: now,
      updated_at: now,
    })
    .eq("id", tripId);

  return { error: error?.message ?? null };
}

export async function completeTrip(tripId: string): Promise<{ error: string | null }> {
  const admin = createAdminClient();
  const { trip, error: tripError } = await loadTrip(tripId);

  if (tripError || !trip) {
    return { error: tripError ?? "Δεν βρέθηκε το δρομολόγιο." };
  }

  if (trip.status !== "in_progress") {
    return { error: "Το δρομολόγιο δεν είναι σε εξέλιξη." };
  }

  const now = new Date().toISOString();
  const { error } = await admin
    .from("delivery_trips")
    .update({
      status: "completed",
      returned_at: now,
      updated_at: now,
    })
    .eq("id", tripId);

  return { error: error?.message ?? null };
}

export async function updateTripDate(
  tripId: string,
  tripDate: string,
): Promise<{ error: string | null }> {
  const admin = createAdminClient();
  const { trip, error: tripError } = await loadTrip(tripId);

  if (tripError || !trip) {
    return { error: tripError ?? "Δεν βρέθηκε το δρομολόγιο." };
  }

  if (trip.status === "completed") {
    return { error: "Δεν μπορείτε να μετακινήσετε ολοκληρωμένο δρομολόγιο." };
  }

  const { error } = await admin
    .from("delivery_trips")
    .update({
      trip_date: tripDate,
      updated_at: new Date().toISOString(),
    })
    .eq("id", tripId);

  return { error: error?.message ?? null };
}

export async function reorderTripOrders(
  tripId: string,
  orderIds: string[],
): Promise<{ error: string | null }> {
  const admin = createAdminClient();
  const { trip, error: tripError } = await loadTrip(tripId);

  if (tripError || !trip) {
    return { error: tripError ?? "Δεν βρέθηκε το δρομολόγιο." };
  }

  if (trip.status === "completed") {
    return { error: "Δεν μπορείτε να αλλάξετε τη σειρά σε ολοκληρωμένο δρομολόγιο." };
  }

  for (let index = 0; index < orderIds.length; index++) {
    const orderId = orderIds[index];
    const { error } = await admin
      .from("orders")
      .update({ delivery_sequence: index + 1 })
      .eq("id", orderId)
      .eq("trip_id", tripId);

    if (error) {
      return { error: error.message };
    }
  }

  return { error: null };
}

export async function deleteDeliveryTrip(input: {
  tripId: string;
  changedByEmail: string;
}): Promise<{ error: string | null; detachedOrderCount?: number }> {
  const admin = createAdminClient();
  const { trip, error: tripError } = await loadTrip(input.tripId);

  if (tripError || !trip) {
    return { error: tripError ?? "Δεν βρέθηκε το δρομολόγιο." };
  }

  if (trip.status !== "pending") {
    if (trip.status === "in_progress") {
      return {
        error:
          "Δεν μπορείτε να διαγράψετε δρομολόγιο σε εξέλιξη — περιέχει ιστορικό GPS και ενεργές παραδόσεις.",
      };
    }
    return {
      error:
        "Δεν μπορείτε να διαγράψετε ολοκληρωμένο δρομολόγιο — το ιστορικό παράδοσης διατηρείται.",
    };
  }

  const { data: tripOrders, error: ordersError } = await admin
    .from("orders")
    .select("id")
    .eq("trip_id", input.tripId);

  if (ordersError) {
    return { error: ordersError.message };
  }

  const orderIds = (tripOrders ?? []).map((row) => row.id);

  for (const orderId of orderIds) {
    const { error } = await removeOrderFromTrip({
      tripId: input.tripId,
      orderId,
      changedByEmail: input.changedByEmail,
    });
    if (error) {
      return { error };
    }
  }

  const { error: deleteError } = await admin
    .from("delivery_trips")
    .delete()
    .eq("id", input.tripId);

  if (deleteError) {
    return { error: deleteError.message };
  }

  return { error: null, detachedOrderCount: orderIds.length };
}
