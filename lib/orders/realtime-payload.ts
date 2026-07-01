import { normalizeOrderStatus } from "@/types/database";
import { type OrderStatus } from "@/components/orders/types";

export type RealtimeOrderRow = {
  id: string;
  orderNumber: string;
  status: OrderStatus;
  boxesCount: number | null;
};

export function parseRealtimeOrderRow(
  record: Record<string, unknown> | undefined,
): RealtimeOrderRow | null {
  if (!record?.id) return null;
  const orderNumber = record.order_number;
  const status = record.status;
  if (typeof orderNumber !== "string" || typeof status !== "string") return null;

  const boxesRaw = record.boxes_count;
  const boxesCount =
    boxesRaw == null
      ? null
      : typeof boxesRaw === "number"
        ? boxesRaw
        : Number.parseInt(String(boxesRaw), 10);

  return {
    id: String(record.id),
    orderNumber,
    status: normalizeOrderStatus(status),
    boxesCount:
      boxesCount != null && Number.isFinite(boxesCount) ? boxesCount : null,
  };
}
