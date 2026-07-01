import { OrderStatus } from "@/components/orders/types";

const DELIVERED_STATUSES = new Set<string>([
  OrderStatus.Completed,
  OrderStatus.PartialShipment,
]);

export function isStopDelivered(status: string): boolean {
  return DELIVERED_STATUSES.has(status);
}
