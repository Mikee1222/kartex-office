"use client";

import { useRouter } from "next/navigation";
import * as React from "react";
import { Calendar, type SlotInfo, type View } from "react-big-calendar";

import { ScheduleDayPanel } from "@/components/schedule/schedule-day-panel";
import { ScheduleEventCard } from "@/components/schedule/schedule-event-card";
import {
  scheduleLocalizer,
  scheduleMessages,
} from "@/components/schedule/schedule-calendar-config";
import "@/components/schedule/schedule-calendar.css";
import {
  buildCalendarEvents,
  getOrdersForDay,
} from "@/lib/schedule/utils";
import { type ScheduleOrder, type ScheduleTrip } from "@/lib/schedule/types";
import { cn } from "@/lib/utils";

type ScheduleMonthViewProps = {
  orders: ScheduleOrder[];
  trips?: ScheduleTrip[];
  className?: string;
};

export function ScheduleMonthView({
  orders,
  trips = [],
  className,
}: ScheduleMonthViewProps) {
  const router = useRouter();
  const [currentDate, setCurrentDate] = React.useState(() => new Date());
  const [selectedDay, setSelectedDay] = React.useState<Date | null>(null);

  const events = React.useMemo(
    () => buildCalendarEvents(orders, trips),
    [orders, trips],
  );

  const dayOrders = React.useMemo(() => {
    if (!selectedDay) return { pickings: [], deliveries: [] };
    return getOrdersForDay(orders, selectedDay);
  }, [orders, selectedDay]);

  function eventPropGetter(event: (typeof events)[number]) {
    const type = event.resource.eventType;
    return {
      className: cn(
        type === "picking" && "schedule-event--picking",
        type === "delivery" && "schedule-event--delivery",
        type === "trip" && "schedule-event--trip",
      ),
    };
  }

  function handleSelectSlot(slot: SlotInfo) {
    setSelectedDay(slot.start);
  }

  function handleSelectEvent(event: (typeof events)[number]) {
    router.push(event.resource.href);
  }

  return (
    <div className={cn("grid gap-6 lg:grid-cols-[1fr_320px]", className)}>
      <div className="schedule-calendar rounded-xl border border-border bg-white p-4 shadow-sm">
        <div className="mb-3 flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <span className="size-2 rounded-full bg-amber-500" aria-hidden />
            Picking (πορτοκαλί)
          </span>
          <span className="flex items-center gap-1.5">
            <span className="size-2 rounded-full bg-blue-500" aria-hidden />
            Παράδοση (μπλε)
          </span>
          <span className="flex items-center gap-1.5">
            <span className="size-2 rounded-full bg-violet-600" aria-hidden />
            Δρομολόγιο (μωβ)
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
          eventPropGetter={eventPropGetter}
          components={{ event: ScheduleEventCard }}
          popup
          style={{ minHeight: 560 }}
        />
      </div>

      {selectedDay ? (
        <ScheduleDayPanel
          date={selectedDay}
          pickings={dayOrders.pickings}
          deliveries={dayOrders.deliveries}
          onClose={() => setSelectedDay(null)}
        />
      ) : (
        <aside className="hidden rounded-xl border border-dashed border-border bg-[#F8F9FC]/80 p-6 text-sm text-muted-foreground lg:flex lg:items-center lg:justify-center">
          Επιλέξτε μια ημέρα στο ημερολόγιο για να δείτε τις παραγγελίες.
        </aside>
      )}
    </div>
  );
}
