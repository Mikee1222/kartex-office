import { isStopDelivered } from "@/lib/drivers/is-stop-delivered";
import { resolveGeocodeQuery } from "@/lib/drivers/resolve-geocode-query";
import type { LiveStopCoords } from "@/lib/drivers/live-map-types";
import { geocodeWithGoogle } from "@/lib/geo/google-geocode";

type CustomerRow = {
  lat: number | null;
  lng: number | null;
  address?: string | null;
  city?: string | null;
  postal_code?: string | null;
};

type OrderStopRow = {
  trip_id: string | null;
  status: string;
  delivery_sequence: number | null;
  delivery_method?: string | null;
  delivery_address?: string | null;
  delivery_city?: string | null;
  delivery_postal_code?: string | null;
  pickup_agency?: string | null;
  customer_address?: string | null;
  customers?: CustomerRow | CustomerRow[] | null;
};

function pickCustomer(customers: OrderStopRow["customers"]): CustomerRow | null {
  if (!customers) return null;
  return Array.isArray(customers) ? (customers[0] ?? null) : customers;
}

function pickCustomerCoords(
  customers: OrderStopRow["customers"],
): LiveStopCoords | null {
  const row = pickCustomer(customers);
  if (row?.lat == null || row?.lng == null) return null;
  return { lat: row.lat, lng: row.lng };
}

async function resolveStopCoords(order: OrderStopRow): Promise<LiveStopCoords | null> {
  const fromCustomer = pickCustomerCoords(order.customers);
  if (fromCustomer) return fromCustomer;

  const customer = pickCustomer(order.customers);
  const query = resolveGeocodeQuery(order, customer);
  if (!query.trim()) return null;

  return geocodeWithGoogle(query);
}

/** First undelivered stop per trip, ordered by delivery_sequence. */
export async function resolveNextStopsByTrip(
  orderRows: OrderStopRow[],
): Promise<Map<string, LiveStopCoords>> {
  const pendingByTrip = new Map<string, OrderStopRow[]>();

  for (const row of orderRows) {
    if (!row.trip_id || isStopDelivered(row.status)) continue;
    const list = pendingByTrip.get(row.trip_id) ?? [];
    list.push(row);
    pendingByTrip.set(row.trip_id, list);
  }

  const nextStops = new Map<string, LiveStopCoords>();

  await Promise.all(
    [...pendingByTrip.entries()].map(async ([tripId, orders]) => {
      orders.sort((a, b) => {
        const seqA = a.delivery_sequence ?? Number.MAX_SAFE_INTEGER;
        const seqB = b.delivery_sequence ?? Number.MAX_SAFE_INTEGER;
        return seqA - seqB;
      });

      for (const order of orders) {
        const coords = await resolveStopCoords(order);
        if (coords) {
          nextStops.set(tripId, coords);
          break;
        }
      }
    }),
  );

  return nextStops;
}
