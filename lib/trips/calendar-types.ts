import { type OrderStatus } from "@/components/orders/types";
import { type ScheduleTrip } from "@/lib/schedule/types";

export type TripsCalendarOrder = {
  id: string;
  orderNumber: string;
  customerName: string;
  status: OrderStatus;
  pickingDate: string | null;
  deliveryDate: string | null;
  boxesCount: number;
  /** Latest picked_at across order_items, if any. */
  latestPickedAt: string | null;
  /** Count of line items with picked_at set. */
  pickedItemCount: number;
  /** Total order line items. */
  totalItemCount: number;
  pickingComplete: boolean;
  pickingInProgress: boolean;
};

export type TripsCalendarEventType = "trip" | "unassigned-picking" | "unassigned-delivery";

export type TripsCalendarEvent = {
  id: string;
  title: string;
  start: Date;
  end: Date;
  resource: {
    eventType: TripsCalendarEventType;
    tripId?: string;
    orderId?: string;
    orderNumber: string;
    customerName: string;
    status: OrderStatus | string;
    driverId?: string;
    driverName?: string;
    tripDate?: string;
    pickingComplete?: boolean;
    pickingInProgress?: boolean;
  };
};

export type TripsListRow = {
  id: string;
  rowKey: string;
  kind: "trip" | "unassigned-picking" | "unassigned-delivery";
  date: string;
  orderId?: string;
  tripId?: string;
  orderNumber: string;
  customerName: string;
  driverName: string | null;
  boxesCount: number;
  status: OrderStatus | string;
  deliveryDateForUrgency: string | null;
  pickingComplete?: boolean;
  pickingInProgress?: boolean;
  pickedItemCount?: number;
  totalItemCount?: number;
};

export type TripsCalendarKpis = {
  tripsToday: number;
  unassignedOrders: number;
  pickingBacklog: number;
};

export type TripsCalendarData = {
  trips: ScheduleTrip[];
  unassignedOrders: TripsCalendarOrder[];
};
