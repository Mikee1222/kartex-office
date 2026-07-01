import { toast } from "sonner";

import { OrderStatus } from "@/components/orders/types";
import { useNotificationsStore } from "@/lib/notifications-store";
import {
  parseRealtimeOrderRow,
  type RealtimeOrderRow,
} from "@/lib/orders/realtime-payload";

function notifyStatusChange(
  order: RealtimeOrderRow,
  title: string,
  message: string,
  type: "info" | "success" | "warning" | "error",
  toastMessage?: string,
) {
  const { addNotification } = useNotificationsStore.getState();

  addNotification({
    id: `${order.id}-${order.status}-${Date.now()}`,
    title,
    message,
    href: `/orders/${order.id}`,
    type,
  });

  if (toastMessage) {
    toast.success(toastMessage);
  }
}

export function handleOrderRealtimeUpdate(
  newRecord: Record<string, unknown> | undefined,
  oldRecord: Record<string, unknown> | undefined,
) {
  const order = parseRealtimeOrderRow(newRecord);
  const oldOrder = parseRealtimeOrderRow(oldRecord);

  if (!order) return;

  useNotificationsStore.getState().bumpOrders(order.id);

  if (!oldOrder || oldOrder.status === order.status) {
    return;
  }

  switch (order.status) {
    case OrderStatus.Processing:
      notifyStatusChange(
        order,
        "🏭 Picking ξεκίνησε",
        `${order.orderNumber} - Αποθήκη ξεκίνησε picking`,
        "info",
      );
      break;

    case OrderStatus.ReadyForShipment:
      notifyStatusChange(
        order,
        "✅ Έτοιμο για αποστολή!",
        order.boxesCount != null && order.boxesCount > 0
          ? `${order.orderNumber} - ${order.boxesCount} κιβώτια έτοιμα`
          : `${order.orderNumber} έτοιμο για αποστολή`,
        "success",
        `${order.orderNumber} έτοιμο για αποστολή!`,
      );
      break;

    case OrderStatus.Completed:
      notifyStatusChange(
        order,
        "🎉 Παραδόθηκε!",
        `${order.orderNumber} παραδόθηκε επιτυχώς`,
        "success",
        `${order.orderNumber} παραδόθηκε!`,
      );
      break;

    case OrderStatus.PartialShipment:
      notifyStatusChange(
        order,
        "⚠️ Μερική παράδοση",
        `${order.orderNumber} - Μερική παράδοση`,
        "warning",
      );
      break;

    default:
      break;
  }
}
