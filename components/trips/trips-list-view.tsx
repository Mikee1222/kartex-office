"use client";

import { Package } from "lucide-react";
import * as React from "react";

import { OrderStatusBadge } from "@/components/orders/order-status-badge";
import {
  ORDER_FILTER_TABS,
  type OrderStatus as OrderStatusType,
} from "@/components/orders/types";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { ScheduleTrip } from "@/lib/schedule/types";
import {
  daysRemainingBadgeClass,
  daysRemainingLabel,
  getDaysRemainingUrgency,
  getDeliveryDaysRemaining,
} from "@/lib/schedule/utils";
import type { TripsCalendarOrder } from "@/lib/trips/calendar-types";
import {
  buildTripsListRows,
  tripsListRowTypeLabel,
} from "@/lib/trips/calendar-utils";
import {
  premiumFilterTabActive,
  premiumFilterTabInactive,
  premiumTableHead,
  premiumTableRow,
  premiumTableWrap,
} from "@/lib/ui/premium-styles";
import { formatDateEl, normalizeOrderStatus } from "@/types/database";
import { cn } from "@/lib/utils";

type TripsListFilterType = "all" | "unassigned-picking" | "unassigned-delivery" | "trips";

type TripsListViewProps = {
  trips: ScheduleTrip[];
  unassignedOrders: TripsCalendarOrder[];
  className?: string;
  filterDate?: string | null;
  onTripClick: (trip: ScheduleTrip) => void;
  onUnassignedDeliveryClick: (order: TripsCalendarOrder) => void;
};

const TYPE_TABS: { id: TripsListFilterType; label: string }[] = [
  { id: "all", label: "Όλα" },
  { id: "unassigned-picking", label: "Picking (χωρίς δρομολόγιο)" },
  { id: "unassigned-delivery", label: "Παράδοση (χωρίς δρομολόγιο)" },
  { id: "trips", label: "Δρομολόγια" },
];

export function TripsListView({
  trips,
  unassignedOrders,
  className,
  filterDate,
  onTripClick,
  onUnassignedDeliveryClick,
}: TripsListViewProps) {
  const [dateFrom, setDateFrom] = React.useState(filterDate ?? "");
  const [dateTo, setDateTo] = React.useState(filterDate ?? "");
  const [statusFilter, setStatusFilter] = React.useState<"all" | OrderStatusType>("all");
  const [typeFilter, setTypeFilter] = React.useState<TripsListFilterType>("all");

  const allRows = React.useMemo(
    () => buildTripsListRows(trips, unassignedOrders),
    [trips, unassignedOrders],
  );

  const filtered = React.useMemo(() => {
    let rows = [...allRows];

    if (typeFilter !== "all") {
      rows = rows.filter((row) => row.kind === typeFilter);
    }

    if (statusFilter !== "all") {
      rows = rows.filter(
        (row) => row.kind === "trip" || row.status === statusFilter,
      );
    }

    if (dateFrom) {
      rows = rows.filter((row) => row.date >= dateFrom);
    }
    if (dateTo) {
      rows = rows.filter((row) => row.date <= dateTo);
    }

    return rows;
  }, [allRows, statusFilter, typeFilter, dateFrom, dateTo]);

  function handleRowClick(row: (typeof allRows)[number]) {
    if (row.kind === "trip" && row.tripId) {
      const trip = trips.find((item) => item.id === row.tripId);
      if (trip) onTripClick(trip);
      return;
    }
    if (row.kind === "unassigned-delivery" && row.orderId) {
      const order = unassignedOrders.find((item) => item.id === row.orderId);
      if (order) onUnassignedDeliveryClick(order);
      return;
    }
    if (row.kind === "unassigned-picking" && row.orderId) {
      const order = unassignedOrders.find((item) => item.id === row.orderId);
      if (order) onUnassignedDeliveryClick(order);
    }
  }

  return (
    <div className={cn("space-y-4", className)}>
      <div className="flex flex-col gap-4 rounded-xl border border-border bg-white p-4 shadow-sm">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="trips-list-from">Από</Label>
            <Input
              id="trips-list-from"
              type="date"
              value={dateFrom}
              onChange={(event) => setDateFrom(event.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="trips-list-to">Έως</Label>
            <Input
              id="trips-list-to"
              type="date"
              value={dateTo}
              onChange={(event) => setDateTo(event.target.value)}
            />
          </div>
        </div>

        <div className="flex flex-wrap gap-2" role="tablist" aria-label="Τύπος">
          {TYPE_TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={typeFilter === tab.id}
              onClick={() => setTypeFilter(tab.id)}
              className={cn(
                typeFilter === tab.id
                  ? premiumFilterTabActive
                  : premiumFilterTabInactive,
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap gap-2" role="tablist" aria-label="Κατάσταση">
          <button
            type="button"
            onClick={() => setStatusFilter("all")}
            className={cn(
              statusFilter === "all"
                ? premiumFilterTabActive
                : premiumFilterTabInactive,
            )}
          >
            Όλες οι καταστάσεις
          </button>
          {ORDER_FILTER_TABS.filter((tab) => tab.id !== "all").map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setStatusFilter(tab.id as OrderStatusType)}
              className={cn(
                statusFilter === tab.id
                  ? premiumFilterTabActive
                  : premiumFilterTabInactive,
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className={premiumTableWrap}>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1100px] text-sm">
            <thead>
              <tr className={premiumTableHead}>
                <th className="px-4 py-3">Ημ/νία</th>
                <th className="px-4 py-3">Τύπος</th>
                <th className="px-4 py-3">Παραγγελία / Δρομολόγιο</th>
                <th className="px-4 py-3">Πελάτης / Οδηγός</th>
                <th className="px-4 py-3">Κιβώτια</th>
                <th className="px-4 py-3">Κατάσταση</th>
                <th className="px-4 py-3">Ημέρες απομένουν</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    className="px-4 py-12 text-center text-muted-foreground"
                  >
                    Δεν βρέθηκαν εγγραφές με τα τρέχοντα φίλτρα.
                  </td>
                </tr>
              ) : (
                filtered.map((row) => {
                  const days = getDeliveryDaysRemaining(row.deliveryDateForUrgency);
                  const urgency = getDaysRemainingUrgency(days);
                  const isClickable =
                    row.kind === "trip" ||
                    row.kind === "unassigned-delivery" ||
                    row.kind === "unassigned-picking";

                  return (
                    <tr key={row.rowKey} className={premiumTableRow}>
                      <td className="px-4 py-3 text-muted-foreground">
                        {formatDateEl(`${row.date}T12:00:00Z`)}
                      </td>
                      <td className="px-4 py-3">{tripsListRowTypeLabel(row.kind)}</td>
                      <td className="px-4 py-3">
                        {isClickable ? (
                          <button
                            type="button"
                            onClick={() => handleRowClick(row)}
                            className="font-medium text-kartex-navy hover:text-kartex-gold"
                          >
                            {row.orderNumber}
                          </button>
                        ) : (
                          row.orderNumber
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {row.kind === "trip" ? row.driverName : row.customerName}
                      </td>
                      <td className="px-4 py-3">
                        {row.boxesCount > 0 ? (
                          <span className="inline-flex items-center gap-1">
                            <Package className="size-3.5 shrink-0 text-muted-foreground" aria-hidden />
                            {row.boxesCount}
                          </span>
                        ) : (
                          "—"
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {row.kind === "trip" ? (
                          <span className="text-xs text-muted-foreground">{row.status}</span>
                        ) : (
                          <OrderStatusBadge
                            status={normalizeOrderStatus(row.status as string)}
                          />
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {row.kind === "unassigned-delivery" ? (
                          <span
                            className={cn(
                              "inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold",
                              daysRemainingBadgeClass(urgency),
                            )}
                          >
                            {daysRemainingLabel(days)}
                          </span>
                        ) : (
                          "—"
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
