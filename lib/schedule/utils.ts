import {
  addDays,
  differenceInCalendarDays,
  format,
  parseISO,
  setHours,
  setMinutes,
  startOfDay,
} from "date-fns";
import { el } from "date-fns/locale";

import { OrderStatus, type OrderStatus as OrderStatusType } from "@/components/orders/types";
import {
  type DaysRemainingUrgency,
  type ScheduleCalendarEvent,
  type ScheduleEventType,
  type ScheduleListRow,
  type ScheduleOrder,
  type ScheduleTrip,
} from "@/lib/schedule/types";
import { getAthensDateString } from "@/lib/datetime";

export { el as scheduleDateFnsLocale };

export function parseScheduleDate(dateStr: string | null): Date | null {
  if (!dateStr?.trim()) return null;
  const parsed = parseISO(dateStr.length === 10 ? `${dateStr}T12:00:00` : dateStr);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

export function formatScheduleDateInput(date: Date): string {
  return format(date, "yyyy-MM-dd");
}

export function getDeliveryDaysRemaining(deliveryDate: string | null): number | null {
  if (!deliveryDate) return null;
  const today = startOfDay(parseISO(`${getAthensDateString()}T12:00:00`));
  const target = startOfDay(parseISO(`${deliveryDate}T12:00:00`));
  return differenceInCalendarDays(target, today);
}

export function getDaysRemainingUrgency(
  days: number | null,
): DaysRemainingUrgency {
  if (days === null) return "none";
  if (days < 0) return "overdue";
  if (days < 3) return "critical";
  if (days <= 7) return "warning";
  return "ok";
}

export function daysRemainingLabel(days: number | null): string {
  if (days === null) return "—";
  if (days < 0) return `${Math.abs(days)} μέρ. καθυστέρηση`;
  if (days === 0) return "Σήμερα";
  if (days === 1) return "1 μέρα";
  return `${days} μέρες`;
}

export function daysRemainingBadgeClass(urgency: DaysRemainingUrgency): string {
  switch (urgency) {
    case "overdue":
      return "bg-red-900 text-white";
    case "critical":
      return "bg-red-100 text-red-800";
    case "warning":
      return "bg-amber-100 text-amber-900";
    case "ok":
      return "bg-emerald-100 text-emerald-800";
    default:
      return "bg-muted text-muted-foreground";
  }
}

export function statusEventColor(status: OrderStatusType | string): string {
  switch (status) {
    case OrderStatus.ReadyForShipment:
    case OrderStatus.Shipped:
    case OrderStatus.Completed:
      return "#10B981";
    case OrderStatus.Confirmed:
      return "#3B82F6";
    case OrderStatus.Reserved:
    case OrderStatus.PartialShipment:
      return "#F59E0B";
    case OrderStatus.Cancelled:
      return "#94A3B8";
    default:
      return "#0A1628";
  }
}

function dayWithHour(dateStr: string, hour: number, minute = 0): Date {
  const base = parseScheduleDate(dateStr)!;
  return setMinutes(setHours(startOfDay(base), hour), minute);
}

function buildOrderEvent(
  order: ScheduleOrder,
  dateStr: string,
  eventType: "picking" | "delivery",
): ScheduleCalendarEvent {
  const isPicking = eventType === "picking";
  const start = isPicking ? dayWithHour(dateStr, 8) : dayWithHour(dateStr, 14);
  const end = isPicking ? dayWithHour(dateStr, 12) : dayWithHour(dateStr, 18);
  const prefix = isPicking ? "🏭" : "🚚";

  return {
    id: `${order.id}-${eventType}`,
    title: `${prefix} ${order.orderNumber}`,
    start,
    end,
    resource: {
      orderId: order.id,
      orderNumber: order.orderNumber,
      customerName: order.customerName,
      status: order.status,
      eventType,
      href: `/orders/${order.id}`,
    },
  };
}

function buildTripEvent(trip: ScheduleTrip): ScheduleCalendarEvent | null {
  const dateStr = trip.tripDate;
  if (!dateStr) return null;

  const start = dayWithHour(dateStr, 9);
  const end = dayWithHour(dateStr, 11);

  return {
    id: `trip-${trip.id}`,
    title: `🚛 Δρομολόγιο #${trip.tripNumber}`,
    start,
    end,
    resource: {
      tripId: trip.id,
      orderNumber: `#${trip.tripNumber}`,
      customerName: trip.driverName,
      status: trip.status,
      eventType: "trip",
      href: `/trips?date=${encodeURIComponent(trip.tripDate)}&driver=${encodeURIComponent(trip.driverId)}`,
    },
  };
}

export function buildCalendarEvents(
  orders: ScheduleOrder[],
  trips: ScheduleTrip[] = [],
): ScheduleCalendarEvent[] {
  const events: ScheduleCalendarEvent[] = [];

  for (const order of orders) {
    if (order.pickingDate) {
      events.push(buildOrderEvent(order, order.pickingDate, "picking"));
    }
    if (order.deliveryDate) {
      events.push(buildOrderEvent(order, order.deliveryDate, "delivery"));
    }
  }

  for (const trip of trips) {
    const event = buildTripEvent(trip);
    if (event) events.push(event);
  }

  return events;
}

export function buildScheduleListRows(
  orders: ScheduleOrder[],
  trips: ScheduleTrip[] = [],
): ScheduleListRow[] {
  const rows: ScheduleListRow[] = [];

  for (const order of orders) {
    if (order.pickingDate) {
      rows.push({
        id: order.id,
        rowKey: `${order.id}-picking`,
        kind: "picking",
        date: order.pickingDate,
        orderId: order.id,
        orderNumber: order.orderNumber,
        customerName: order.customerName,
        assignedDriverName: order.assignedDriverName,
        vehiclePlate: order.vehiclePlate,
        boxesCount: order.boxesCount,
        status: order.status,
        deliveryDateForUrgency: order.deliveryDate,
      });
    }
    if (order.deliveryDate) {
      rows.push({
        id: order.id,
        rowKey: `${order.id}-delivery`,
        kind: "delivery",
        date: order.deliveryDate,
        orderId: order.id,
        orderNumber: order.orderNumber,
        customerName: order.customerName,
        assignedDriverName: order.assignedDriverName,
        vehiclePlate: order.vehiclePlate,
        boxesCount: order.boxesCount,
        status: order.status,
        deliveryDateForUrgency: order.deliveryDate,
      });
    }
  }

  for (const trip of trips) {
    rows.push({
      id: trip.id,
      rowKey: `trip-${trip.id}`,
      kind: "trip",
      date: trip.tripDate,
      tripId: trip.id,
      orderNumber: `Δρομολόγιο #${trip.tripNumber}`,
      customerName: trip.driverName,
      assignedDriverName: trip.driverName,
      vehiclePlate: null,
      boxesCount: trip.totalBoxes,
      status: trip.status,
      deliveryDateForUrgency: null,
    });
  }

  return rows.sort((a, b) => {
    const dateCmp = a.date.localeCompare(b.date);
    if (dateCmp !== 0) return dateCmp;
    const kindOrder = { picking: 0, trip: 1, delivery: 2 };
    return kindOrder[a.kind] - kindOrder[b.kind];
  });
}

export function getOrdersForDay(
  orders: ScheduleOrder[],
  day: Date,
): { pickings: ScheduleOrder[]; deliveries: ScheduleOrder[] } {
  const key = formatScheduleDateInput(day);
  const pickings: ScheduleOrder[] = [];
  const deliveries: ScheduleOrder[] = [];

  for (const order of orders) {
    if (order.pickingDate === key) pickings.push(order);
    if (order.deliveryDate === key) deliveries.push(order);
  }

  return { pickings, deliveries };
}

export function getTomorrowAthens(): string {
  const today = parseISO(`${getAthensDateString()}T12:00:00`);
  return formatScheduleDateInput(addDays(today, 1));
}

export function listRowTypeLabel(kind: ScheduleListRow["kind"]): string {
  if (kind === "picking") return "Picking";
  if (kind === "delivery") return "Παράδοση";
  return "Δρομολόγιο";
}

export function compareListRowDateAsc(a: ScheduleListRow, b: ScheduleListRow): number {
  const dateCmp = a.date.localeCompare(b.date);
  if (dateCmp !== 0) return dateCmp;
  return a.orderNumber.localeCompare(b.orderNumber, "el");
}
