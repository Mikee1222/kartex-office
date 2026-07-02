import { normalizeOrderStatus } from "@/types/database";
import { createClient } from "@/lib/supabase/client";
import { resolveCustomerName } from "@/lib/orders/resolve-customer-name";
import { type ScheduleOrder } from "@/lib/schedule/types";

type ScheduleOrderRow = {
  id: string;
  order_number: string;
  status: string;
  picking_date: string | null;
  delivery_date: string | null;
  reminder_days: number | null;
  assigned_driver_name: string | null;
  boxes_count: number | null;
  customer_name?: string | null;
  customers?:
    | { name: string }
    | { name: string }[]
    | null;
  quote_request?:
    | { contact_name: string }
    | { contact_name: string }[]
    | null;
  vehicles?:
    | { plate: string }
    | { plate: string }[]
    | null;
};

function pickVehiclePlate(
  vehicles: ScheduleOrderRow["vehicles"],
): string | null {
  if (!vehicles) return null;
  const row = Array.isArray(vehicles) ? vehicles[0] : vehicles;
  return row?.plate?.trim() || null;
}

function mapRow(row: ScheduleOrderRow): ScheduleOrder {
  return {
    id: row.id,
    orderNumber: row.order_number,
    customerName: resolveCustomerName(row),
    status: normalizeOrderStatus(row.status),
    pickingDate: row.picking_date,
    deliveryDate: row.delivery_date,
    reminderDays: row.reminder_days ?? 2,
    assignedDriverName: row.assigned_driver_name?.trim() || null,
    vehiclePlate: pickVehiclePlate(row.vehicles),
    boxesCount: row.boxes_count ?? 0,
  };
}

const SCHEDULE_SELECT = `
  id,
  order_number,
  status,
  picking_date,
  delivery_date,
  reminder_days,
  assigned_driver_name,
  boxes_count,
  customer_name,
  customers ( name ),
  quote_request:quote_request_id ( contact_name ),
  vehicles ( plate )
`;

export async function fetchScheduleOrders(): Promise<ScheduleOrder[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("orders")
    .select(SCHEDULE_SELECT)
    .order("picking_date", { ascending: true, nullsFirst: false });

  if (error || !data) return [];
  return (data as ScheduleOrderRow[]).map(mapRow);
}

export async function updateScheduleOrderDate(
  orderId: string,
  field: "picking_date" | "delivery_date",
  date: string | null,
): Promise<string | null> {
  const supabase = createClient();
  const { error } = await supabase
    .from("orders")
    .update({ [field]: date })
    .eq("id", orderId);

  return error?.message ?? null;
}
