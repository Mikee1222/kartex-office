"use client";

import * as React from "react";
import { Calendar, type SlotInfo, type View } from "react-big-calendar";

import { TripsDayPanel } from "@/components/trips/trips-day-panel";
import { TripsEventCard } from "@/components/trips/trips-event-card";
import {
  scheduleLocalizer,
  scheduleMessages,
} from "@/components/schedule/schedule-calendar-config";
import "@/components/schedule/schedule-calendar.css";
import type { ScheduleTrip } from "@/lib/schedule/types";
import type { TripsCalendarEvent, TripsCalendarOrder } from "@/lib/trips/calendar-types";
import {
  buildTripsCalendarEvents,
  getTripsForDay,
  getUnassignedOrdersForDay,
  tripsEventStyle,
} from "@/lib/trips/calendar-utils";
import { cn } from "@/lib/utils";

type TripsMonthViewProps = {
  trips: ScheduleTrip[];
  unassignedOrders: TripsCalendarOrder[];
  onTripClick: (trip: ScheduleTrip) => void;
  onUnassignedDeliveryClick: (order: TripsCalendarOrder) => void;
  className?: string;
};

export function TripsMonthView({
  trips,
  unassignedOrders,
  onTripClick,
  onUnassignedDeliveryClick,
  className,
}: TripsMonthViewProps) {
  const [currentDate, setCurrentDate] = React.useState(() => new Date());
  const [selectedDay, setSelectedDay] = React.useState<Date | null>(null);

  const events = React.useMemo(
    () => buildTripsCalendarEvents(trips, unassignedOrders),
    [trips, unassignedOrders],
  );

  const dayTrips = React.useMemo(() => {
    if (!selectedDay) return [];
    return getTripsForDay(trips, selectedDay);
  }, [trips, selectedDay]);

  const dayUnassigned = React.useMemo(() => {
    if (!selectedDay) return { pickings: [], deliveries: [] };
    return getUnassignedOrdersForDay(unassignedOrders, selectedDay);
  }, [unassignedOrders, selectedDay]);

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
      return;
    }
  }

  function handleSelectSlot(slot: SlotInfo) {
    setSelectedDay(slot.start);
  }

  return (
    <div className={cn("grid gap-6 lg:grid-cols-[1fr_320px]", className)}>
      <div className="schedule-calendar rounded-xl border border-border bg-white p-4 shadow-sm">
        <div className="mb-3 flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <span className="size-2 rounded-full bg-violet-600" aria-hidden />
            Δρομολόγιο
          </span>
          <span className="flex items-center gap-1.5">
            <span className="size-2 rounded-full border border-dashed border-amber-500 bg-amber-100" aria-hidden />
            Picking (χωρίς δρομολόγιο)
          </span>
          <span className="flex items-center gap-1.5">
            <span className="size-2 rounded-full border border-dashed border-blue-500 bg-blue-100" aria-hidden />
            Παράδοση (χωρίς δρομολόγιο)
          </span>
        </div>
        <Calendar
          localizer={scheduleLocalizer}
          culture="el"
          messages={scheduleMessages}
          events={events}
          startAccessor="start"
          endAccessor="end"
          views={["month"] as View[]}
          view="month"
          date={currentDate}
          onNavigate={setCurrentDate}
          selectable
          onSelectSlot={handleSelectSlot}
          onSelectEvent={handleSelectEvent}
          eventPropGetter={tripsEventStyle}
          components={{ event: TripsEventCard }}
          popup
          style={{ minHeight: 560 }}
        />
      </div>

      {selectedDay ? (
        <TripsDayPanel
          date={selectedDay}
          trips={dayTrips}
          unassignedPickings={dayUnassigned.pickings}
          unassignedDeliveries={dayUnassigned.deliveries}
          onTripClick={onTripClick}
          onUnassignedDeliveryClick={onUnassignedDeliveryClick}
          onClose={() => setSelectedDay(null)}
        />
      ) : (
        <aside className="hidden rounded-xl border border-dashed border-border bg-[#F8F9FC]/80 p-6 text-sm text-muted-foreground lg:flex lg:items-center lg:justify-center">
          Επιλέξτε μια ημέρα για δρομολόγια και μη ανατεθειμένες παραγγελίες.
        </aside>
      )}
    </div>
  );
}
