"use client";

import { Package, Route, X } from "lucide-react";
import { format } from "date-fns";
import { el } from "date-fns/locale";

import { OrderStatusBadge } from "@/components/orders/order-status-badge";
import { TripStatusBadge } from "@/components/trips/trip-status-badge";
import type { ScheduleTrip } from "@/lib/schedule/types";
import type { TripsCalendarOrder } from "@/lib/trips/calendar-types";
import { normalizeOrderStatus } from "@/types/database";

type TripsDayPanelProps = {
  date: Date;
  trips: ScheduleTrip[];
  unassignedPickings: TripsCalendarOrder[];
  unassignedDeliveries: TripsCalendarOrder[];
  onTripClick: (trip: ScheduleTrip) => void;
  onUnassignedDeliveryClick: (order: TripsCalendarOrder) => void;
  onClose: () => void;
};

export function TripsDayPanel({
  date,
  trips,
  unassignedPickings,
  unassignedDeliveries,
  onTripClick,
  onUnassignedDeliveryClick,
  onClose,
}: TripsDayPanelProps) {
  const label = format(date, "EEEE d MMMM yyyy", { locale: el });
  const isEmpty =
    trips.length === 0 &&
    unassignedPickings.length === 0 &&
    unassignedDeliveries.length === 0;

  return (
    <aside className="rounded-xl border border-border bg-white p-4 shadow-sm lg:sticky lg:top-4">
      <div className="mb-4 flex items-start justify-between gap-2">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Επιλεγμένη ημέρα
          </p>
          <h2 className="text-lg font-semibold capitalize text-kartex-navy">{label}</h2>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="rounded-md p-1 text-muted-foreground hover:bg-[#F8F9FC] hover:text-kartex-navy"
          aria-label="Κλείσιμο"
        >
          <X className="size-5" />
        </button>
      </div>

      {isEmpty ? (
        <p className="text-sm text-muted-foreground">
          Δεν υπάρχουν δρομολόγια ή μη ανατεθειμένες παραγγελίες αυτή την ημέρα.
        </p>
      ) : (
        <div className="space-y-5">
          {trips.length > 0 ? (
            <section className="space-y-2">
              <h3 className="flex items-center gap-2 text-sm font-semibold text-kartex-navy">
                <Route className="size-4 text-violet-600" aria-hidden />
                Δρομολόγια
                <span className="text-muted-foreground">({trips.length})</span>
              </h3>
              <ul className="space-y-2">
                {trips.map((trip) => (
                  <li key={trip.id}>
                    <button
                      type="button"
                      onClick={() => onTripClick(trip)}
                      className="block w-full rounded-lg border border-violet-200 bg-violet-50/50 p-3 text-left transition-shadow hover:shadow-md"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="font-medium text-kartex-navy">
                            Δρομολόγιο #{trip.tripNumber}
                          </p>
                          <p className="text-sm text-muted-foreground">{trip.driverName}</p>
                        </div>
                        <TripStatusBadge
                          status={trip.status as "pending" | "in_progress" | "completed"}
                        />
                      </div>
                      <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                        <Package className="size-3.5 shrink-0" aria-hidden />
                        {trip.totalBoxes} κιβώτια
                      </p>
                    </button>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          {unassignedPickings.length > 0 ? (
            <section className="space-y-2">
              <h3 className="flex items-center gap-2 text-sm font-semibold text-kartex-navy">
                <span className="size-2 rounded-full bg-amber-500" aria-hidden />
                Picking (χωρίς δρομολόγιο)
                <span className="text-muted-foreground">({unassignedPickings.length})</span>
              </h3>
              <ul className="space-y-2">
                {unassignedPickings.map((order) => (
                  <li key={`pick-${order.id}`}>
                    <button
                      type="button"
                      onClick={() => onUnassignedDeliveryClick(order)}
                      className="block w-full rounded-lg border border-dashed border-amber-300 bg-amber-50/50 p-3 text-left transition-shadow hover:shadow-md"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="font-medium text-kartex-navy">{order.orderNumber}</p>
                          <p className="text-sm text-muted-foreground">{order.customerName}</p>
                        </div>
                        <OrderStatusBadge status={normalizeOrderStatus(order.status)} />
                      </div>
                      <p className="mt-1 text-xs text-amber-700">Κλικ για ανάθεση σε δρομολόγιο</p>
                    </button>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          {unassignedDeliveries.length > 0 ? (
            <section className="space-y-2">
              <h3 className="flex items-center gap-2 text-sm font-semibold text-kartex-navy">
                <span className="size-2 rounded-full bg-blue-500" aria-hidden />
                Παράδοση (χωρίς δρομολόγιο)
                <span className="text-muted-foreground">({unassignedDeliveries.length})</span>
              </h3>
              <ul className="space-y-2">
                {unassignedDeliveries.map((order) => (
                  <li key={`del-${order.id}`}>
                    <button
                      type="button"
                      onClick={() => onUnassignedDeliveryClick(order)}
                      className="block w-full rounded-lg border border-dashed border-blue-300 bg-blue-50/50 p-3 text-left transition-shadow hover:shadow-md"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="font-medium text-kartex-navy">{order.orderNumber}</p>
                          <p className="text-sm text-muted-foreground">{order.customerName}</p>
                        </div>
                        <OrderStatusBadge status={normalizeOrderStatus(order.status)} />
                      </div>
                      <p className="mt-1 text-xs text-blue-600">Κλικ για ανάθεση σε δρομολόγιο</p>
                    </button>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}
        </div>
      )}
    </aside>
  );
}
