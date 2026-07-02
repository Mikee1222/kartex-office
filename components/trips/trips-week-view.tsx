"use client";

import Link from "next/link";
import * as React from "react";
import {
  Calendar,
  type EventProps,
  type View,
} from "react-big-calendar";
import withDragAndDrop from "react-big-calendar/lib/addons/dragAndDrop";
import { toast } from "sonner";

import { TripsEventCard } from "@/components/trips/trips-event-card";
import {
  scheduleLocalizer,
  scheduleMessages,
} from "@/components/schedule/schedule-calendar-config";
import "@/components/schedule/schedule-calendar.css";
import { updateScheduleOrderDate } from "@/lib/schedule/fetch-schedule-orders";
import type { ScheduleTrip } from "@/lib/schedule/types";
import { formatScheduleDateInput } from "@/lib/schedule/utils";
import type { TripsCalendarEvent, TripsCalendarOrder } from "@/lib/trips/calendar-types";
import {
  buildTripsCalendarEvents,
  tripsEventStyle,
} from "@/lib/trips/calendar-utils";
import { cn } from "@/lib/utils";

const DnDCalendar = withDragAndDrop<TripsCalendarEvent>(Calendar);

type TripsWeekViewProps = {
  trips: ScheduleTrip[];
  unassignedOrders: TripsCalendarOrder[];
  onTripClick: (trip: ScheduleTrip) => void;
  onUnassignedDeliveryClick: (order: TripsCalendarOrder) => void;
  onDataChange: () => void;
  className?: string;
};

function WeekEventCard({ event }: EventProps<TripsCalendarEvent>) {
  const { resource } = event;
  const isTrip = resource.eventType === "trip";
  const isUnassigned = resource.eventType.startsWith("unassigned");

  const inner = (
    <>
      <p className="text-xs font-bold">{resource.orderNumber}</p>
      <p className="truncate text-[11px]">{resource.customerName}</p>
      <p className="mt-1 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
        {resource.eventType === "unassigned-picking"
          ? "Picking · χωρίς δρομολόγιο"
          : resource.eventType === "unassigned-delivery"
            ? "Παράδοση · χωρίς δρομολόγιο"
            : "Δρομολόγιο"}
      </p>
    </>
  );

  if (isTrip || isUnassigned) {
    return (
      <div className="block h-full rounded-md border-l-[3px] bg-white/95 p-2 text-kartex-navy shadow-sm">
        {inner}
      </div>
    );
  }

  return (
    <Link
      href={`/orders/${resource.orderId}`}
      className="block h-full rounded-md border-l-[3px] bg-white/95 p-2 text-kartex-navy shadow-sm no-underline"
    >
      {inner}
    </Link>
  );
}

export function TripsWeekView({
  trips,
  unassignedOrders,
  onTripClick,
  onUnassignedDeliveryClick,
  onDataChange,
  className,
}: TripsWeekViewProps) {
  const [currentDate, setCurrentDate] = React.useState(() => new Date());

  const events = React.useMemo(
    () => buildTripsCalendarEvents(trips, unassignedOrders),
    [trips, unassignedOrders],
  );

  async function handleEventDrop({
    event,
    start,
  }: {
    event: TripsCalendarEvent;
    start: Date | string;
  }) {
    const startDate = start instanceof Date ? start : new Date(start);
    const date = formatScheduleDateInput(startDate);

    if (event.resource.eventType === "trip" && event.resource.tripId) {
      const res = await fetch(`/api/trips/${event.resource.tripId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tripDate: date }),
      });
      const json = (await res.json()) as { error?: string };
      if (!res.ok) {
        toast.error(json.error ?? "Αποτυχία μετακίνησης δρομολογίου.");
        return;
      }
      toast.success("Το δρομολόγιο μετακινήθηκε.");
      onDataChange();
      return;
    }

    if (event.resource.eventType === "unassigned-picking") {
      const error = await updateScheduleOrderDate(
        event.resource.orderId!,
        "picking_date",
        date,
      );
      if (error) {
        toast.error(error);
        return;
      }
      toast.success("Η ημερομηνία picking ενημερώθηκε.");
      onDataChange();
      return;
    }

    if (event.resource.eventType === "unassigned-delivery") {
      const error = await updateScheduleOrderDate(
        event.resource.orderId!,
        "delivery_date",
        date,
      );
      if (error) {
        toast.error(error);
        return;
      }
      toast.success("Η ημερομηνία παράδοσης ενημερώθηκε.");
      onDataChange();
    }
  }

  function handleSelectEvent(event: TripsCalendarEvent) {
    const { resource } = event;
    if (resource.eventType === "trip" && resource.tripId) {
      const trip = trips.find((row) => row.id === resource.tripId);
      if (trip) onTripClick(trip);
      return;
    }
    if (resource.eventType === "unassigned-delivery" && resource.orderId) {
      const order = unassignedOrders.find((row) => row.id === resource.orderId);
      if (order) onUnassignedDeliveryClick(order);
      return;
    }
    if (resource.eventType === "unassigned-picking" && resource.orderId) {
      const order = unassignedOrders.find((row) => row.id === resource.orderId);
      if (order) onUnassignedDeliveryClick(order);
    }
  }

  return (
    <div
      className={cn(
        "schedule-calendar rounded-xl border border-border bg-white p-4 shadow-sm",
        className,
      )}
    >
      <p className="mb-3 text-sm text-muted-foreground">
        Σύρετε δρομολόγια για αλλαγή ημερομηνίας · Σύρετε μη ανατεθειμένες παραγγελίες
        για αλλαγή picking/παράδοσης.
      </p>
      <DnDCalendar
        localizer={scheduleLocalizer}
        culture="el"
        messages={scheduleMessages}
        events={events}
        startAccessor="start"
        endAccessor="end"
        views={["week"] as View[]}
        view="week"
        date={currentDate}
        onNavigate={setCurrentDate}
        draggableAccessor={() => true}
        resizable={false}
        onEventDrop={(args) => void handleEventDrop(args)}
        onSelectEvent={handleSelectEvent}
        eventPropGetter={tripsEventStyle}
        components={{ event: WeekEventCard }}
        min={new Date(1970, 0, 1, 7, 0, 0)}
        max={new Date(1970, 0, 1, 20, 0, 0)}
        step={60}
        timeslots={1}
        style={{ minHeight: 640 }}
      />
    </div>
  );
}
