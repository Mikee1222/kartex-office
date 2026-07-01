"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import * as React from "react";

import { DataError } from "@/components/dashboard/data-error";
import { ScheduleListView } from "@/components/schedule/schedule-list-view";
import { ScheduleMonthView } from "@/components/schedule/schedule-month-view";
import { ScheduleWeekView } from "@/components/schedule/schedule-week-view";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { fetchScheduleOrders } from "@/lib/schedule/fetch-schedule-orders";
import { fetchScheduleTrips } from "@/lib/schedule/fetch-schedule-trips";
import { type ScheduleOrder, type ScheduleTrip } from "@/lib/schedule/types";
import {
  premiumFilterTabActive,
  premiumFilterTabInactive,
  premiumGoldButton,
} from "@/lib/ui/premium-styles";
import { cn } from "@/lib/utils";

export type ScheduleViewMode = "month" | "week" | "list";

const VIEW_TABS: { id: ScheduleViewMode; label: string }[] = [
  { id: "month", label: "Μήνας" },
  { id: "week", label: "Εβδομάδα" },
  { id: "list", label: "Λίστα" },
];

export function ScheduleView() {
  const searchParams = useSearchParams();
  const initialView = (searchParams.get("view") as ScheduleViewMode) || "month";
  const filterDate = searchParams.get("date");

  const [view, setView] = React.useState<ScheduleViewMode>(
    VIEW_TABS.some((tab) => tab.id === initialView) ? initialView : "month",
  );
  const [orders, setOrders] = React.useState<ScheduleOrder[]>([]);
  const [trips, setTrips] = React.useState<ScheduleTrip[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const load = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    const [orderData, tripData] = await Promise.all([
      fetchScheduleOrders(),
      fetchScheduleTrips(),
    ]);
    setOrders(orderData);
    setTrips(tripData);
    setLoading(false);
  }, []);

  React.useEffect(() => {
    void load();
  }, [load]);

  React.useEffect(() => {
    if (filterDate && searchParams.get("view") === "list") {
      setView("list");
    }
  }, [filterDate, searchParams]);

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <PageHeader
        title="Πρόγραμμα"
        subtitle="Προγραμματισμός picking, παραδόσεων και δρομολογίων."
        action={
          <Button asChild className={premiumGoldButton}>
            <Link href="/orders/new">Νέα Παραγγελία</Link>
          </Button>
        }
      />

      <div className="flex flex-wrap gap-2" role="tablist" aria-label="Προβολή προγράμματος">
        {VIEW_TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={view === tab.id}
            onClick={() => setView(tab.id)}
            className={cn(
              view === tab.id ? premiumFilterTabActive : premiumFilterTabInactive,
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {error ? <DataError message={error} onRetry={() => void load()} /> : null}

      {loading ? (
        <Skeleton className="h-[560px] w-full rounded-xl" />
      ) : (
        <>
          {view === "month" ? <ScheduleMonthView orders={orders} trips={trips} /> : null}
          {view === "week" ? (
            <ScheduleWeekView
              orders={orders}
              trips={trips}
              onOrdersChange={setOrders}
            />
          ) : null}
          {view === "list" ? (
            <ScheduleListView
              key={filterDate ?? "all"}
              orders={orders}
              trips={trips}
              filterDate={filterDate}
            />
          ) : null}
        </>
      )}
    </div>
  );
}
