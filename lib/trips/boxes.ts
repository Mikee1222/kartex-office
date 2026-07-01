import type { DeliveryTrip, TripOrderRow } from "@/lib/trips/types";

/** Sum boxes_count from trip orders (for UI checks). */
export function sumOrderBoxes(
  orders: Pick<TripOrderRow, "boxesCount">[],
): number {
  return orders.reduce((sum, order) => sum + (order.boxesCount ?? 0), 0);
}

/**
 * Boxes currently on the trip: prefer DB total_boxes (source of truth after sync),
 * but never show less than the sum of linked orders.
 */
export function displayTripTotalBoxes(trip: Pick<DeliveryTrip, "totalBoxes" | "orders">): number {
  const fromOrders = sumOrderBoxes(trip.orders);
  return Math.max(trip.totalBoxes ?? 0, fromOrders);
}
