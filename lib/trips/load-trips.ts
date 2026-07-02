import { createAdminClient } from "@/lib/supabase/admin";
import { resolveCustomerName } from "@/lib/orders/resolve-customer-name";
import { loadDriversWithVehicles } from "@/lib/users/load-drivers-with-vehicles";
import type {
  DeliveryTrip,
  DriverTripGroup,
  TripOrderRow,
  TripStatus,
} from "@/lib/trips/types";

type TripDbRow = {
  id: string;
  driver_id: string;
  driver_name: string;
  vehicle_id: string | null;
  trip_date: string;
  trip_number: number;
  status: TripStatus;
  total_boxes: number;
  notes: string | null;
  departed_at: string | null;
  returned_at: string | null;
  created_at: string;
  vehicles?:
    | { plate: string; model: string | null; max_boxes: number }
    | { plate: string; model: string | null; max_boxes: number }[]
    | null;
};

type OrderDbRow = {
  id: string;
  trip_id: string | null;
  order_number: string;
  status: string;
  boxes_count: number | null;
  delivery_sequence: number | null;
  customer_name?: string | null;
  customers?:
    | { name: string; address: string | null }
    | { name: string; address: string | null }[]
    | null;
  quote_request?:
    | { contact_name: string }
    | { contact_name: string }[]
    | null;
};

function mapOrder(row: OrderDbRow): TripOrderRow {
  const customerJoin = Array.isArray(row.customers)
    ? row.customers[0]
    : row.customers;
  return {
    id: row.id,
    orderNumber: row.order_number,
    customerName: resolveCustomerName(row),
    address: customerJoin?.address?.trim() || "—",
    boxesCount: row.boxes_count ?? 0,
    status: row.status,
    deliverySequence: row.delivery_sequence,
  };
}

export async function loadTripsForDate(tripDate: string): Promise<{
  groups: DriverTripGroup[];
  error: string | null;
}> {
  const admin = createAdminClient();
  const { drivers, error: driversError } = await loadDriversWithVehicles();

  if (driversError) {
    return { groups: [], error: driversError };
  }

  const { data: tripRows, error: tripsError } = await admin
    .from("delivery_trips")
    .select(
      `
      id,
      driver_id,
      driver_name,
      vehicle_id,
      trip_date,
      trip_number,
      status,
      total_boxes,
      notes,
      departed_at,
      returned_at,
      created_at,
      vehicles ( plate, model, max_boxes )
    `,
    )
    .eq("trip_date", tripDate)
    .order("trip_number", { ascending: true });

  if (tripsError) {
    return { groups: [], error: tripsError.message };
  }

  const tripIds = (tripRows ?? []).map((row) => row.id);
  const ordersByTrip = new Map<string, TripOrderRow[]>();

  if (tripIds.length > 0) {
    const { data: orderRows, error: ordersError } = await admin
      .from("orders")
      .select(
        `
        id,
        trip_id,
        order_number,
        status,
        boxes_count,
        delivery_sequence,
        customer_name,
        customers ( name, address ),
        quote_request:quote_request_id ( contact_name )
      `,
      )
      .in("trip_id", tripIds)
      .order("delivery_sequence", { ascending: true, nullsFirst: false });

    if (ordersError) {
      return { groups: [], error: ordersError.message };
    }

    for (const row of (orderRows ?? []) as OrderDbRow[]) {
      if (!row.trip_id) continue;
      const list = ordersByTrip.get(row.trip_id) ?? [];
      list.push(mapOrder(row));
      ordersByTrip.set(row.trip_id, list);
    }
  }

  const tripsByDriver = new Map<string, DeliveryTrip[]>();

  for (const raw of tripRows ?? []) {
    const row = raw as TripDbRow;
    const vehicle = row.vehicles;
    const vehicleRow = Array.isArray(vehicle) ? vehicle[0] : vehicle;
    const driverTrips = tripsByDriver.get(row.driver_id) ?? [];

    driverTrips.push({
      id: row.id,
      tripNumber: row.trip_number,
      driverId: row.driver_id,
      driverName: row.driver_name,
      vehicleId: row.vehicle_id,
      vehiclePlate: vehicleRow?.plate ?? null,
      vehicleModel: vehicleRow?.model ?? null,
      maxBoxes: vehicleRow?.max_boxes ?? 0,
      totalBoxes: row.total_boxes,
      status: row.status,
      notes: row.notes,
      departedAt: row.departed_at,
      returnedAt: row.returned_at,
      orders: ordersByTrip.get(row.id) ?? [],
    });

    tripsByDriver.set(row.driver_id, driverTrips);
  }

  const groups: DriverTripGroup[] = drivers.map((driver) => ({
    driverId: driver.id,
    driverName: driver.name,
    vehicleId: driver.vehicleId,
    vehiclePlate: driver.vehiclePlate,
    vehicleModel: driver.vehicleModel,
    maxBoxes: driver.maxBoxes ?? 0,
    trips: tripsByDriver.get(driver.id) ?? [],
  }));

  return { groups, error: null };
}
