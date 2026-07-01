"use client";

import * as React from "react";
import {
  Calendar,
  type EventProps,
  type View,
} from "react-big-calendar";
import withDragAndDrop from "react-big-calendar/lib/addons/dragAndDrop";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import {
  scheduleLocalizer,
  scheduleMessages,
} from "@/components/schedule/schedule-calendar-config";
import "@/components/schedule/schedule-calendar.css";
import {
  fetchScheduleOrders,
  updateScheduleOrderDate,
} from "@/lib/schedule/fetch-schedule-orders";
import {
  buildCalendarEvents,
  formatScheduleDateInput,
  statusEventColor,
} from "@/lib/schedule/utils";
import { type ScheduleCalendarEvent, type ScheduleOrder, type ScheduleTrip } from "@/lib/schedule/types";
import { cn } from "@/lib/utils";

const DnDCalendar = withDragAndDrop<ScheduleCalendarEvent>(Calendar);

type ScheduleWeekViewProps = {
  orders: ScheduleOrder[];
  trips?: ScheduleTrip[];
  onOrdersChange: (orders: ScheduleOrder[]) => void;
  className?: string;
};

function WeekEventCard({ event }: EventProps<ScheduleCalendarEvent>) {
  const { resource } = event;
  const isTrip = resource.eventType === "trip";
  const borderColor = isTrip ? "#7C3AED" : statusEventColor(resource.status as string);

  return (
    <Link
      href={resource.href}
      className="block h-full rounded-md border-l-[3px] bg-white/95 p-2 text-kartex-navy shadow-sm no-underline"
      style={{ borderLeftColor: borderColor }}
      onClick={(clickEvent) => clickEvent.stopPropagation()}
    >
      <p className="text-xs font-bold">{resource.orderNumber}</p>
      <p className="truncate text-[11px]">{resource.customerName}</p>
      <p className="mt-1 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
        {resource.eventType === "picking"
          ? "Πρωί · Picking"
          : resource.eventType === "delivery"
            ? "Απόγευμα · Παράδοση"
            : "Δρομολόγιο"}
      </p>
    </Link>
  );
}

export function ScheduleWeekView({
  orders,
  trips = [],
  onOrdersChange,
  className,
}: ScheduleWeekViewProps) {
  const router = useRouter();
  const [currentDate, setCurrentDate] = React.useState(() => new Date());
  const events = React.useMemo(
    () => buildCalendarEvents(orders, trips),
    [orders, trips],
  );

  async function reload() {
    const next = await fetchScheduleOrders();
    onOrdersChange(next);
  }

  async function handleEventDrop({
    event,
    start,
  }: {
    event: ScheduleCalendarEvent;
    start: Date | string;
  }) {
    if (event.resource.eventType === "trip") {
      toast.message("Τα δρομολόγια δεν μετακινούνται από εδώ.");
      return;
    }

    const field =
      event.resource.eventType === "picking" ? "picking_date" : "delivery_date";
    const startDate = start instanceof Date ? start : new Date(start);
    const date = formatScheduleDateInput(startDate);
    const error = await updateScheduleOrderDate(event.resource.orderId!, field, date);
    if (error) {
      toast.error(error);
      return;
    }
    toast.success("Η ημερομηνία ενημερώθηκε");
    await reload();
  }

  function eventStyleGetter(event: ScheduleCalendarEvent) {
    const type = event.resource.eventType;
    if (type === "trip") {
      return {
        style: {
          backgroundColor: "#EDE9FE",
          border: "1px solid #7C3AED",
          color: "#0A1628",
          borderRadius: "0.5rem",
        },
      };
    }
    const isPicking = type === "picking";
    return {
      style: {
        backgroundColor: isPicking ? "#FEF3C7" : "#DBEAFE",
        border: `1px solid ${isPicking ? "#F59E0B" : "#3B82F6"}`,
        color: "#0A1628",
        borderRadius: "0.5rem",
      },
    };
  }

  return (
    <div
      className={cn(
        "schedule-calendar rounded-xl border border-border bg-white p-4 shadow-sm",
        className,
      )}
    >
      <p className="mb-3 text-sm text-muted-foreground">
        Πρωί (08:00–12:00): picking · Απόγευμα (14:00–18:00): παραδόσεις · Χρώμα κατά
        κατάσταση. Σύρετε παραγγελία για αλλαγή ημερομηνίας.
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
        draggableAccessor={(event) => event.resource.eventType !== "trip"}
        resizable={false}
        onEventDrop={(args) => void handleEventDrop(args)}
        onSelectEvent={(event) => router.push(event.resource.href)}
        eventPropGetter={eventStyleGetter}
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
