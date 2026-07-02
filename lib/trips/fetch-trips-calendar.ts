import { normalizeOrderStatus } from "@/types/database";
import { createClient } from "@/lib/supabase/client";
import { resolveCustomerName } from "@/lib/orders/resolve-customer-name";
import { fetchScheduleTrips } from "@/lib/schedule/fetch-schedule-trips";
import type { TripsCalendarData, TripsCalendarOrder } from "@/lib/trips/calendar-types";

type OrderItemRow = {
  picked_at: string | null;
};

type UnassignedOrderRow = {
  id: string;
  order_number: string;
  status: string;
  picking_date: string | null;
  delivery_date: string | null;
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
  order_items?: OrderItemRow[] | null;
};

function mapUnassignedOrder(row: UnassignedOrderRow): TripsCalendarOrder {
  const items = row.order_items ?? [];
  const totalItemCount = items.length;
  const pickedItemCount = items.filter((item) => item.picked_at).length;
  const pickedTimes = items
    .map((item) => item.picked_at)
    .filter((value): value is string => Boolean(value))
    .map((iso) => new Date(iso).getTime())
    .filter((time) => !Number.isNaN(time));

  const latestPickedAt =
    pickedTimes.length > 0
      ? new Date(Math.max(...pickedTimes)).toISOString()
      : null;

  const pickingComplete = totalItemCount > 0 && pickedItemCount === totalItemCount;
  const pickingInProgress = pickedItemCount > 0 && !pickingComplete;

  return {
    id: row.id,
    orderNumber: row.order_number,
    customerName: resolveCustomerName(row),
    status: normalizeOrderStatus(row.status),
    pickingDate: row.picking_date,
    deliveryDate: row.delivery_date,
    boxesCount: row.boxes_count ?? 0,
    latestPickedAt,
    pickedItemCount,
    totalItemCount,
    pickingComplete,
    pickingInProgress,
  };
}

const UNASSIGNED_SELECT = `
  id,
  order_number,
  status,
  picking_date,
  delivery_date,
  boxes_count,
  customer_name,
  customers ( name ),
  quote_request:quote_request_id ( contact_name ),
  order_items ( picked_at )
`;

export async function fetchUnassignedCalendarOrders(): Promise<TripsCalendarOrder[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("orders")
    .select(UNASSIGNED_SELECT)
    .is("trip_id", null)
    .or("picking_date.not.is.null,delivery_date.not.is.null")
    .order("picking_date", { ascending: true, nullsFirst: false });

  if (error || !data) return [];
  return (data as UnassignedOrderRow[]).map(mapUnassignedOrder);
}

export async function fetchTripsCalendarData(): Promise<TripsCalendarData> {
  const [trips, unassignedOrders] = await Promise.all([
    fetchScheduleTrips(),
    fetchUnassignedCalendarOrders(),
  ]);

  return { trips, unassignedOrders };
}
