import { isStopDelivered } from "@/lib/drivers/is-stop-delivered";
import type { LiveStopCoords } from "@/lib/drivers/live-map-types";

type OrderStopRow = {
  trip_id: string | null;
  status: string;
  delivery_sequence: number | null;
  customers?:
    | { lat: number | null; lng: number | null }
    | { lat: number | null; lng: number | null }[]
    | null;
};

function pickCustomerCoords(
  customers: OrderStopRow["customers"],
): LiveStopCoords | null {
  if (!customers) return null;
  const row = Array.isArray(customers) ? customers[0] : customers;
  if (row?.lat == null || row?.lng == null) return null;
  return { lat: row.lat, lng: row.lng };
}

/** First undelivered stop per trip, ordered by delivery_sequence. */
export function resolveNextStopsByTrip(
  orderRows: OrderStopRow[],
): Map<string, LiveStopCoords> {
  const pendingByTrip = new Map<string, OrderStopRow[]>();

  for (const row of orderRows) {
    if (!row.trip_id || isStopDelivered(row.status)) continue;
    const list = pendingByTrip.get(row.trip_id) ?? [];
    list.push(row);
    pendingByTrip.set(row.trip_id, list);
  }

  const nextStops = new Map<string, LiveStopCoords>();

  for (const [tripId, orders] of pendingByTrip) {
    orders.sort((a, b) => {
      const seqA = a.delivery_sequence ?? Number.MAX_SAFE_INTEGER;
      const seqB = b.delivery_sequence ?? Number.MAX_SAFE_INTEGER;
      return seqA - seqB;
    });

    for (const order of orders) {
      const coords = pickCustomerCoords(order.customers);
      if (coords) {
        nextStops.set(tripId, coords);
        break;
      }
    }
  }

  return nextStops;
}
