import { OrderStatus } from "@/components/orders/types";
import { getAthensDateString } from "@/lib/datetime";
import {
  type ScheduleAlert,
  type ScheduleOrder,
} from "@/lib/schedule/types";
import { getDeliveryDaysRemaining, getTomorrowAthens } from "@/lib/schedule/utils";

export function computeScheduleAlerts(orders: ScheduleOrder[]): ScheduleAlert[] {
  const today = getAthensDateString();
  const tomorrow = getTomorrowAthens();
  const now = Date.now();

  let pickingToday = 0;
  let deliveryTomorrow = 0;
  let overdue = 0;
  let readyForShipment = 0;

  for (const order of orders) {
    if (order.status === OrderStatus.Cancelled || order.status === OrderStatus.Completed) {
      continue;
    }

    if (order.pickingDate === today) {
      pickingToday += 1;
    }

    if (order.deliveryDate === tomorrow) {
      deliveryTomorrow += 1;
    }

    if (order.deliveryDate) {
      const daysLeft = getDeliveryDaysRemaining(order.deliveryDate);
      if (daysLeft !== null && daysLeft < 0) {
        overdue += 1;
      }
    }

    if (order.status === OrderStatus.ReadyForShipment) {
      readyForShipment += 1;
    }
  }

  const alerts: ScheduleAlert[] = [];

  if (pickingToday > 0) {
    alerts.push({
      id: "aggregate-picking-today",
      href: `/schedule?view=list&date=${today}`,
      message: `🏭 Σήμερα για picking: ${pickingToday} ${pickingToday === 1 ? "παραγγελία" : "παραγγελίες"}`,
      kind: "picking-today",
      read: false,
      createdAt: now,
    });
  }

  if (deliveryTomorrow > 0) {
    alerts.push({
      id: "aggregate-delivery-tomorrow",
      href: `/schedule?view=list&date=${tomorrow}`,
      message: `🚛 Αύριο παράδοση: ${deliveryTomorrow} ${deliveryTomorrow === 1 ? "παραγγελία" : "παραγγελίες"}`,
      kind: "delivery-tomorrow",
      read: false,
      createdAt: now,
    });
  }

  if (overdue > 0) {
    alerts.push({
      id: "aggregate-overdue",
      href: "/schedule?view=list",
      message: `⚠️ Καθυστερημένο: ${overdue} ${overdue === 1 ? "παραγγελία" : "παραγγελίες"}`,
      kind: "overdue",
      read: false,
      createdAt: now,
    });
  }

  if (readyForShipment > 0) {
    alerts.push({
      id: "aggregate-ready-shipment",
      href: "/orders",
      message: `📦 Έτοιμο για αποστολή: ${readyForShipment} ${readyForShipment === 1 ? "παραγγελία" : "παραγγελίες"}`,
      kind: "ready-for-shipment",
      read: false,
      createdAt: now,
    });
  }

  return alerts;
}
