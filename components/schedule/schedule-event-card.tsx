"use client";

import Link from "next/link";
import type { EventProps } from "react-big-calendar";

import { OrderStatusBadge } from "@/components/orders/order-status-badge";
import { type ScheduleCalendarEvent } from "@/lib/schedule/types";
import { normalizeOrderStatus } from "@/types/database";

export function ScheduleEventCard({ event }: EventProps<ScheduleCalendarEvent>) {
  const { resource } = event;
  const isTrip = resource.eventType === "trip";

  return (
    <Link
      href={resource.href}
      className="block h-full min-h-[2.5rem] overflow-hidden rounded px-1 py-0.5 text-inherit no-underline"
      onClick={(clickEvent) => clickEvent.stopPropagation()}
    >
      <p className="truncate text-[11px] font-semibold leading-tight">
        {resource.orderNumber}
      </p>
      <p className="truncate text-[10px] opacity-90">{resource.customerName}</p>
      {!isTrip ? (
        <span className="mt-0.5 inline-block scale-[0.85] origin-left">
          <OrderStatusBadge status={normalizeOrderStatus(resource.status as string)} />
        </span>
      ) : (
        <span className="mt-0.5 block text-[10px] opacity-90">Δρομολόγιο</span>
      )}
    </Link>
  );
}
