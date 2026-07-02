import { type OrderStatus } from "@/components/orders/types";

export type ScheduleEventType = "picking" | "delivery" | "trip";

export type ScheduleOrder = {
  id: string;
  orderNumber: string;
  customerName: string;
  status: OrderStatus;
  pickingDate: string | null;
  deliveryDate: string | null;
  reminderDays: number;
  assignedDriverName: string | null;
  vehiclePlate: string | null;
  boxesCount: number;
};

export type ScheduleTrip = {
  id: string;
  tripNumber: number;
  tripDate: string;
  driverId: string;
  driverName: string;
  status: string;
  totalBoxes: number;
  orderCount: number;
  departedAt: string | null;
};

export type ScheduleCalendarEvent = {
  id: string;
  title: string;
  start: Date;
  end: Date;
  resource: {
    orderId?: string;
    tripId?: string;
    orderNumber: string;
    customerName: string;
    status: OrderStatus | string;
    eventType: ScheduleEventType;
    href: string;
  };
};

export type ScheduleListFilterType = "all" | "picking" | "delivery" | "trips";

export type ScheduleListRow = {
  id: string;
  rowKey: string;
  kind: "picking" | "delivery" | "trip";
  date: string;
  orderId?: string;
  tripId?: string;
  orderNumber: string;
  customerName: string;
  assignedDriverName: string | null;
  vehiclePlate: string | null;
  boxesCount: number;
  status: OrderStatus | string;
  deliveryDateForUrgency: string | null;
};

export type DaysRemainingUrgency = "overdue" | "critical" | "warning" | "ok" | "none";

export type ScheduleAlertKind =
  | "picking-today"
  | "delivery-tomorrow"
  | "overdue"
  | "ready-for-shipment";

export type ScheduleAlert = {
  id: string;
  orderId?: string;
  href: string;
  message: string;
  kind: ScheduleAlertKind;
  read: boolean;
  createdAt: number;
};
