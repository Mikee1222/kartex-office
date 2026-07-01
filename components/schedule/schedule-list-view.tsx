"use client";

import Link from "next/link";
import { Package } from "lucide-react";
import * as React from "react";

import { OrderStatusBadge } from "@/components/orders/order-status-badge";
import {
  ORDER_FILTER_TABS,
  type OrderStatus as OrderStatusType,
} from "@/components/orders/types";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  premiumFilterTabActive,
  premiumFilterTabInactive,
  premiumTableHead,
  premiumTableRow,
  premiumTableWrap,
} from "@/lib/ui/premium-styles";
import {
  type ScheduleListFilterType,
  type ScheduleOrder,
  type ScheduleTrip,
} from "@/lib/schedule/types";
import {
  buildScheduleListRows,
  daysRemainingBadgeClass,
  daysRemainingLabel,
  getDaysRemainingUrgency,
  getDeliveryDaysRemaining,
  listRowTypeLabel,
} from "@/lib/schedule/utils";
import { formatDateEl } from "@/types/database";
import { normalizeOrderStatus } from "@/types/database";
import { cn } from "@/lib/utils";

type ScheduleListViewProps = {
  orders: ScheduleOrder[];
  trips?: ScheduleTrip[];
  className?: string;
  filterDate?: string | null;
};

const TYPE_TABS: { id: ScheduleListFilterType; label: string }[] = [
  { id: "all", label: "Όλα" },
  { id: "picking", label: "Picking" },
  { id: "delivery", label: "Παραδόσεις" },
  { id: "trips", label: "Δρομολόγια" },
];

export function ScheduleListView({
  orders,
  trips = [],
  className,
  filterDate,
}: ScheduleListViewProps) {
  const [dateFrom, setDateFrom] = React.useState(filterDate ?? "");
  const [dateTo, setDateTo] = React.useState(filterDate ?? "");
  const [statusFilter, setStatusFilter] = React.useState<"all" | OrderStatusType>("all");
  const [typeFilter, setTypeFilter] = React.useState<ScheduleListFilterType>("all");

  const allRows = React.useMemo(
    () => buildScheduleListRows(orders, trips),
    [orders, trips],
  );

  const filtered = React.useMemo(() => {
    let rows = [...allRows];

    if (typeFilter === "picking") {
      rows = rows.filter((row) => row.kind === "picking");
    } else if (typeFilter === "delivery") {
      rows = rows.filter((row) => row.kind === "delivery");
    } else if (typeFilter === "trips") {
      rows = rows.filter((row) => row.kind === "trip");
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

  return (
    <div className={cn("space-y-4", className)}>
      <div className="flex flex-col gap-4 rounded-xl border border-border bg-white p-4 shadow-sm">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="schedule-from">Από</Label>
            <Input
              id="schedule-from"
              type="date"
              value={dateFrom}
              onChange={(event) => setDateFrom(event.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="schedule-to">Έως</Label>
            <Input
              id="schedule-to"
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
                <th className="px-4 py-3">Παραγγελία #</th>
                <th className="px-4 py-3">Πελάτης</th>
                <th className="px-4 py-3">Οδηγός</th>
                <th className="px-4 py-3">Κιβώτια</th>
                <th className="px-4 py-3">Κατάσταση</th>
                <th className="px-4 py-3">Ημέρες απομένουν</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td
                    colSpan={8}
                    className="px-4 py-12 text-center text-muted-foreground"
                  >
                    Δεν βρέθηκαν εγγραφές με τα τρέχοντα φίλτρα.
                  </td>
                </tr>
              ) : (
                filtered.map((row) => {
                  const days = getDeliveryDaysRemaining(row.deliveryDateForUrgency);
                  const urgency = getDaysRemainingUrgency(days);
                  const href =
                    row.kind === "trip" && row.tripId
                      ? `/trips?date=${encodeURIComponent(row.date)}`
                      : row.orderId
                        ? `/orders/${row.orderId}`
                        : "#";

                  return (
                    <tr key={row.rowKey} className={premiumTableRow}>
                      <td className="px-4 py-3 text-muted-foreground">
                        {formatDateEl(`${row.date}T12:00:00Z`)}
                      </td>
                      <td className="px-4 py-3">{listRowTypeLabel(row.kind)}</td>
                      <td className="px-4 py-3">
                        <Link
                          href={href}
                          className="font-medium text-kartex-navy hover:text-kartex-gold"
                        >
                          {row.orderNumber}
                        </Link>
                      </td>
                      <td className="px-4 py-3">{row.customerName}</td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {row.assignedDriverName ?? "—"}
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
                        {row.kind === "delivery" ? (
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
