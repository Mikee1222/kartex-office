import {
  addHours,
  addMinutes,
  differenceInCalendarDays,
  format,
  parseISO,
  setHours,
  setMinutes,
  startOfDay,
} from "date-fns";

import { OrderStatus } from "@/components/orders/types";
import { getAthensDateString } from "@/lib/datetime";
import type { ScheduleTrip } from "@/lib/schedule/types";
import {
  formatScheduleDateInput,
  parseScheduleDate,
} from "@/lib/schedule/utils";
import type {
  TripsCalendarEvent,
  TripsCalendarKpis,
  TripsCalendarOrder,
  TripsListRow,
} from "@/lib/trips/calendar-types";

function dayWithHour(dateStr: string, hour: number, minute = 0): Date {
  const base = parseScheduleDate(dateStr)!;
  return setMinutes(setHours(startOfDay(base), hour), minute);
}

function eventFromTimestamp(
  iso: string,
  durationMinutes = 60,
): { start: Date; end: Date } {
  const start = new Date(iso);
  if (Number.isNaN(start.getTime())) {
    const today = getAthensDateString();
    const fallback = dayWithHour(today, 9);
    return { start: fallback, end: addMinutes(fallback, durationMinutes) };
  }
  return { start, end: addMinutes(start, durationMinutes) };
}

function buildTripEvent(trip: ScheduleTrip): TripsCalendarEvent | null {
  const dateStr = trip.tripDate;
  if (!dateStr) return null;

  let start: Date;
  let end: Date;

  if (trip.status === "in_progress" && trip.departedAt) {
    ({ start, end } = eventFromTimestamp(trip.departedAt, 120));
  } else if (trip.status === "completed" && trip.departedAt) {
    ({ start, end } = eventFromTimestamp(trip.departedAt, 90));
  } else {
    start = dayWithHour(dateStr, 9);
    end = dayWithHour(dateStr, 11);
  }

  const statusLabel =
    trip.status === "in_progress"
      ? "Σε εξέλιξη"
      : trip.status === "completed"
        ? "Ολοκληρωμένο"
        : "Αναμονή";

  return {
    id: `trip-${trip.id}`,
    title: `🚛 #${trip.tripNumber} · ${trip.driverName}`,
    start,
    end,
    resource: {
      eventType: "trip",
      tripId: trip.id,
      orderNumber: `#${trip.tripNumber}`,
      customerName: trip.driverName,
      status: statusLabel,
      driverId: trip.driverId,
      driverName: trip.driverName,
      tripDate: trip.tripDate,
    },
  };
}

function buildUnassignedPickingEvent(order: TripsCalendarOrder): TripsCalendarEvent | null {
  if (!order.pickingDate) return null;

  let start: Date;
  let end: Date;

  if (order.latestPickedAt) {
    ({ start, end } = eventFromTimestamp(order.latestPickedAt, 45));
  } else {
    start = dayWithHour(order.pickingDate, 8);
    end = dayWithHour(order.pickingDate, 10);
  }

  const suffix = order.pickingComplete
    ? " · Ολοκληρ."
    : order.pickingInProgress
      ? " · Σε εξέλιξη"
      : "";

  return {
    id: `${order.id}-unassigned-picking`,
    title: `🏭 ${order.orderNumber}${suffix}`,
    start,
    end,
    resource: {
      eventType: "unassigned-picking",
      orderId: order.id,
      orderNumber: order.orderNumber,
      customerName: order.customerName,
      status: order.status,
      pickingComplete: order.pickingComplete,
      pickingInProgress: order.pickingInProgress,
    },
  };
}

function buildUnassignedDeliveryEvent(order: TripsCalendarOrder): TripsCalendarEvent | null {
  if (!order.deliveryDate) return null;

  const start = dayWithHour(order.deliveryDate, 14);
  const end = dayWithHour(order.deliveryDate, 16);

  return {
    id: `${order.id}-unassigned-delivery`,
    title: `📦 ${order.orderNumber}`,
    start,
    end,
    resource: {
      eventType: "unassigned-delivery",
      orderId: order.id,
      orderNumber: order.orderNumber,
      customerName: order.customerName,
      status: order.status,
    },
  };
}

export function buildTripsCalendarEvents(
  trips: ScheduleTrip[],
  unassignedOrders: TripsCalendarOrder[],
): TripsCalendarEvent[] {
  const events: TripsCalendarEvent[] = [];

  for (const trip of trips) {
    const event = buildTripEvent(trip);
    if (event) events.push(event);
  }

  for (const order of unassignedOrders) {
    const picking = buildUnassignedPickingEvent(order);
    if (picking) events.push(picking);
    const delivery = buildUnassignedDeliveryEvent(order);
    if (delivery) events.push(delivery);
  }

  return events;
}

export function buildTripsListRows(
  trips: ScheduleTrip[],
  unassignedOrders: TripsCalendarOrder[],
): TripsListRow[] {
  const rows: TripsListRow[] = [];

  for (const order of unassignedOrders) {
    if (order.pickingDate) {
      rows.push({
        id: order.id,
        rowKey: `${order.id}-unassigned-picking`,
        kind: "unassigned-picking",
        date: order.pickingDate,
        orderId: order.id,
        orderNumber: order.orderNumber,
        customerName: order.customerName,
        driverName: null,
        boxesCount: order.boxesCount,
        status: order.status,
        deliveryDateForUrgency: order.deliveryDate,
        pickingComplete: order.pickingComplete,
        pickingInProgress: order.pickingInProgress,
        pickedItemCount: order.pickedItemCount,
        totalItemCount: order.totalItemCount,
      });
    }
    if (order.deliveryDate) {
      rows.push({
        id: order.id,
        rowKey: `${order.id}-unassigned-delivery`,
        kind: "unassigned-delivery",
        date: order.deliveryDate,
        orderId: order.id,
        orderNumber: order.orderNumber,
        customerName: order.customerName,
        driverName: null,
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
      tripNumber: trip.tripNumber,
      orderCount: trip.orderCount,
      orderNumber: `Δρομολόγιο #${trip.tripNumber}`,
      customerName: trip.driverName,
      driverName: trip.driverName,
      boxesCount: trip.totalBoxes,
      status: trip.status,
      deliveryDateForUrgency: null,
    });
  }

  return rows.sort((a, b) => {
    const dateCmp = a.date.localeCompare(b.date);
    if (dateCmp !== 0) return dateCmp;
    const kindOrder = { "unassigned-picking": 0, trip: 1, "unassigned-delivery": 2 };
    return kindOrder[a.kind] - kindOrder[b.kind];
  });
}

export function computeTripsCalendarKpis(
  trips: ScheduleTrip[],
  unassignedOrders: TripsCalendarOrder[],
): TripsCalendarKpis {
  const today = getAthensDateString();
  const tripsToday = trips.filter((trip) => trip.tripDate === today).length;

  const unassignedOrdersCount = unassignedOrders.filter(
    (order) => order.pickingDate || order.deliveryDate,
  ).length;

  const pickingBacklog = unassignedOrders.filter((order) => {
    if (!order.pickingDate) return false;
    if (order.status === OrderStatus.Cancelled || order.status === OrderStatus.Completed) {
      return false;
    }
    if (order.pickingComplete) return false;
    const daysUntil = differenceInCalendarDays(
      startOfDay(parseISO(`${order.pickingDate}T12:00:00`)),
      startOfDay(parseISO(`${today}T12:00:00`)),
    );
    return daysUntil <= 0;
  }).length;

  return {
    tripsToday,
    unassignedOrders: unassignedOrdersCount,
    pickingBacklog,
  };
}

export function getUnassignedOrdersForDay(
  orders: TripsCalendarOrder[],
  day: Date,
): { pickings: TripsCalendarOrder[]; deliveries: TripsCalendarOrder[] } {
  const key = formatScheduleDateInput(day);
  const pickings: TripsCalendarOrder[] = [];
  const deliveries: TripsCalendarOrder[] = [];

  for (const order of orders) {
    if (order.pickingDate === key) pickings.push(order);
    if (order.deliveryDate === key) deliveries.push(order);
  }

  return { pickings, deliveries };
}

export function getTripsForDay(trips: ScheduleTrip[], day: Date): ScheduleTrip[] {
  const key = formatScheduleDateInput(day);
  return trips.filter((trip) => trip.tripDate === key);
}

export function tripsListRowTypeLabel(kind: TripsListRow["kind"]): string {
  if (kind === "unassigned-picking") return "Picking (χωρίς δρομολόγιο)";
  if (kind === "unassigned-delivery") return "Παράδοση (χωρίς δρομολόγιο)";
  return "Δρομολόγιο";
}

export function tripsEventStyle(event: TripsCalendarEvent): {
  className?: string;
  style?: Record<string, string | number>;
} {
  const type = event.resource.eventType;

  if (type === "trip") {
    const status = event.resource.status;
    const isActive = status === "Σε εξέλιξη";
    const isDone = status === "Ολοκληρωμένο";
    return {
      style: {
        backgroundColor: isDone ? "#D1FAE5" : isActive ? "#EDE9FE" : "#DDD6FE",
        border: `1px solid ${isDone ? "#10B981" : "#7C3AED"}`,
        color: "#0A1628",
        borderRadius: "0.5rem",
      },
    };
  }

  if (type === "unassigned-picking") {
    const complete = event.resource.pickingComplete;
    const inProgress = event.resource.pickingInProgress;
    return {
      style: {
        backgroundColor: complete ? "#D1FAE5" : inProgress ? "#FEF3C7" : "#FFEDD5",
        border: `1px dashed ${complete ? "#10B981" : "#F59E0B"}`,
        color: "#0A1628",
        borderRadius: "0.5rem",
      },
    };
  }

  return {
    style: {
      backgroundColor: "#EFF6FF",
      border: "1px dashed #3B82F6",
      color: "#0A1628",
      borderRadius: "0.5rem",
    },
  };
}

export function formatTripsLastUpdated(date: Date): string {
  return format(date, "HH:mm");
}
