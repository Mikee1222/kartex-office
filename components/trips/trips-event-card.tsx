"use client";

import type { EventProps } from "react-big-calendar";

import { OrderStatusBadge } from "@/components/orders/order-status-badge";
import type { TripsCalendarEvent } from "@/lib/trips/calendar-types";
import { normalizeOrderStatus } from "@/types/database";

export function TripsEventCard({ event }: EventProps<TripsCalendarEvent>) {
  const { resource } = event;
  const isTrip = resource.eventType === "trip";
  const isUnassignedPicking = resource.eventType === "unassigned-picking";

  return (
    <div className="block h-full min-h-[2.5rem] overflow-hidden rounded px-1 py-0.5 text-inherit">
      <p className="truncate text-[11px] font-semibold leading-tight">
        {resource.orderNumber}
      </p>
      <p className="truncate text-[10px] opacity-90">{resource.customerName}</p>
      {isTrip ? (
        <span className="mt-0.5 block text-[10px] font-medium opacity-90">
          {resource.status}
        </span>
      ) : isUnassignedPicking ? (
        <span className="mt-0.5 block text-[10px] font-medium opacity-90">
          {resource.pickingComplete
            ? "Picking ολοκληρ."
            : resource.pickingInProgress
              ? "Picking σε εξέλιξη"
              : "Χωρίς δρομολόγιο"}
        </span>
      ) : (
        <span className="mt-0.5 inline-block scale-[0.85] origin-left">
          <OrderStatusBadge status={normalizeOrderStatus(resource.status as string)} />
        </span>
      )}
    </div>
  );
}
