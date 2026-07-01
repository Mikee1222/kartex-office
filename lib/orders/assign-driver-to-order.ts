import { OrderStatus } from "@/components/orders/types";
import {
  appendStatusHistory,
  type StatusHistoryEntry,
} from "@/lib/orders/status-timeline";
import { resolveScheduleDate } from "@/lib/drivers/capacity";
import { createAdminClient } from "@/lib/supabase/admin";

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

export async function assignDriverToOrder(
  payload: AssignDriverPayload,
): Promise<{ error: string | null }> {
  const admin = createAdminClient();
  const scheduleDate = resolveScheduleDate(payload.deliveryDate);

  const { data: scheduleRow, error: scheduleReadError } = await admin
    .from("driver_schedules")
    .select("total_boxes")
    .eq("driver_id", payload.driverId)
    .eq("schedule_date", scheduleDate)
    .maybeSingle();

  if (scheduleReadError) {
    return { error: scheduleReadError.message };
  }

  const currentBoxes = scheduleRow?.total_boxes ?? 0;
  const nextBoxes = currentBoxes + payload.orderBoxes;

  const nextHistory = appendStatusHistory(
    payload.statusHistory,
    OrderStatus.Shipped,
    payload.changedByEmail,
  );

  const { error: orderError } = await admin
    .from("orders")
    .update({
      assigned_driver_id: payload.driverId,
      assigned_driver_name: payload.driverName,
      vehicle_id: payload.vehicleId,
      status: OrderStatus.Shipped,
      status_history: nextHistory,
    })
    .eq("id", payload.orderId);

  if (orderError) {
    return { error: orderError.message };
  }

  const { error: upsertError } = await admin.from("driver_schedules").upsert(
    {
      driver_id: payload.driverId,
      vehicle_id: payload.vehicleId,
      schedule_date: scheduleDate,
      total_boxes: nextBoxes,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "driver_id,schedule_date" },
  );

  if (upsertError) {
    return { error: upsertError.message };
  }

  return { error: null };
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

  const { data: scheduleRow, error: scheduleError } = await admin
    .from("driver_schedules")
    .select("total_boxes")
    .eq("driver_id", driverId)
    .eq("schedule_date", scheduleDate)
    .maybeSingle();

  if (scheduleError) {
    return {
      vehicleId: vehicleRow.id,
      plate: vehicleRow.plate,
      model: vehicleRow.model,
      maxBoxes: vehicleRow.max_boxes,
      currentBoxes: 0,
      error: scheduleError.message,
    };
  }

  return {
    vehicleId: vehicleRow.id,
    plate: vehicleRow.plate,
    model: vehicleRow.model,
    maxBoxes: vehicleRow.max_boxes,
    currentBoxes: scheduleRow?.total_boxes ?? 0,
    error: null,
  };
}
