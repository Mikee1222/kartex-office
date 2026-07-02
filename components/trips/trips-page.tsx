"use client";

import { CalendarDays, List, Package, Route, User } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import * as React from "react";

import { DataError } from "@/components/dashboard/data-error";
import { EmptyState } from "@/components/dashboard/empty-state";
import { AddOrderToTripModal } from "@/components/trips/add-order-to-trip-modal";
import { NewTripModal } from "@/components/trips/new-trip-modal";
import { TripDetail } from "@/components/trips/trip-detail";
import { TripsKpiRow } from "@/components/trips/trips-kpi-row";
import { TripsListView } from "@/components/trips/trips-list-view";
import { TripsMonthView } from "@/components/trips/trips-month-view";
import { TripsWeekView } from "@/components/trips/trips-week-view";
import { UnassignedOrderActionDialog } from "@/components/trips/unassigned-order-action-dialog";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { getAthensDateString } from "@/lib/datetime";
import { formatVehicleLabel } from "@/lib/drivers/capacity";
import type { ScheduleTrip } from "@/lib/schedule/types";
import { computeTripsCalendarKpis } from "@/lib/trips/calendar-utils";
import type { TripsCalendarOrder } from "@/lib/trips/calendar-types";
import { fetchTripsCalendarData } from "@/lib/trips/fetch-trips-calendar";
import type { DeliveryTrip, DriverTripGroup } from "@/lib/trips/types";
import {
  premiumFilterTabActive,
  premiumFilterTabInactive,
  premiumGoldButton,
} from "@/lib/ui/premium-styles";
import { cn } from "@/lib/utils";

export type TripsViewMode = "day" | "month" | "week" | "list";

const VIEW_TABS: { id: TripsViewMode; label: string; icon: typeof Route }[] = [
  { id: "day", label: "Ημέρα", icon: CalendarDays },
  { id: "month", label: "Μήνας", icon: CalendarDays },
  { id: "week", label: "Εβδομάδα", icon: CalendarDays },
  { id: "list", label: "Λίστα", icon: List },
];

function isCalendarView(view: TripsViewMode): boolean {
  return view === "month" || view === "week" || view === "list";
}

export function TripsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const driverFilter = searchParams.get("driver");
  const dateParam = searchParams.get("date");
  const tripParam = searchParams.get("trip");
  const viewParam = searchParams.get("view") as TripsViewMode | null;
  const filterDate = searchParams.get("listDate");

  const initialView: TripsViewMode =
    viewParam && VIEW_TABS.some((tab) => tab.id === viewParam) ? viewParam : "day";

  const [view, setView] = React.useState<TripsViewMode>(initialView);
  const [selectedDate, setSelectedDate] = React.useState(
    dateParam ?? getAthensDateString(),
  );
  const [groups, setGroups] = React.useState<DriverTripGroup[]>([]);
  const [calendarTrips, setCalendarTrips] = React.useState<ScheduleTrip[]>([]);
  const [unassignedOrders, setUnassignedOrders] = React.useState<TripsCalendarOrder[]>([]);
  const [lastUpdated, setLastUpdated] = React.useState<Date | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const [newTripOpen, setNewTripOpen] = React.useState(false);
  const [newTripDate, setNewTripDate] = React.useState(selectedDate);
  const [presetDriverId, setPresetDriverId] = React.useState<string | null>(null);
  const [addOrderTrip, setAddOrderTrip] = React.useState<DeliveryTrip | null>(null);
  const [expandedTripId, setExpandedTripId] = React.useState<string | null>(tripParam);
  const [expandedDriverId, setExpandedDriverId] = React.useState<string | null>(
    driverFilter,
  );
  const [unassignedOrder, setUnassignedOrder] = React.useState<TripsCalendarOrder | null>(
    null,
  );

  const loadDay = React.useCallback(async () => {
    const res = await fetch(`/api/trips?date=${encodeURIComponent(selectedDate)}`);
    const json = (await res.json()) as {
      groups?: DriverTripGroup[];
      error?: string;
    };

    if (!res.ok) {
      throw new Error(json.error ?? "Αποτυχία φόρτωσης δρομολογίων.");
    }

    setGroups(json.groups ?? []);
  }, [selectedDate]);

  const loadCalendar = React.useCallback(async () => {
    const data = await fetchTripsCalendarData();
    setCalendarTrips(data.trips);
    setUnassignedOrders(data.unassignedOrders);
    setLastUpdated(new Date());
    return data;
  }, []);

  const load = React.useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const calendarPromise = loadCalendar();
      if (isCalendarView(view)) {
        await calendarPromise;
        setGroups([]);
      } else {
        await Promise.all([loadDay(), calendarPromise]);
      }
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : "Αποτυχία φόρτωσης δρομολογίων.",
      );
      setGroups([]);
    }

    setLoading(false);
  }, [view, loadDay, loadCalendar]);

  React.useEffect(() => {
    void load();
  }, [load]);

  React.useEffect(() => {
    if (viewParam && VIEW_TABS.some((tab) => tab.id === viewParam)) {
      setView(viewParam);
    }
  }, [viewParam]);

  React.useEffect(() => {
    if (dateParam) {
      setSelectedDate(dateParam);
    }
  }, [dateParam]);

  React.useEffect(() => {
    if (tripParam) {
      setExpandedTripId(tripParam);
    }
  }, [tripParam]);

  React.useEffect(() => {
    if (driverFilter) {
      setExpandedDriverId(driverFilter);
    }
  }, [driverFilter]);

  const addOrderTripId = addOrderTrip?.id;
  React.useEffect(() => {
    if (!addOrderTripId) return;
    const fresh = groups
      .flatMap((group) => group.trips)
      .find((trip) => trip.id === addOrderTripId);
    if (fresh) {
      setAddOrderTrip(fresh);
    }
  }, [groups, addOrderTripId]);

  function setViewMode(nextView: TripsViewMode) {
    setView(nextView);
    const params = new URLSearchParams(searchParams.toString());
    if (nextView === "day") {
      params.delete("view");
      params.set("date", selectedDate);
    } else {
      params.set("view", nextView);
      if (nextView === "list" && filterDate) {
        params.set("listDate", filterDate);
      } else {
        params.delete("listDate");
      }
    }
    router.push(`/trips?${params.toString()}`);
  }

  function navigateToTrip(trip: ScheduleTrip) {
    router.push(
      `/trips?view=day&date=${encodeURIComponent(trip.tripDate)}&trip=${encodeURIComponent(trip.id)}`,
    );
    setView("day");
    setSelectedDate(trip.tripDate);
    setExpandedTripId(trip.id);
  }

  function handleUnassignedDeliveryClick(order: TripsCalendarOrder) {
    setUnassignedOrder(order);
  }

  const visibleGroups = driverFilter
    ? groups.filter((g) => g.driverId === driverFilter)
    : groups;

  const hasDrivers = groups.length > 0;
  const kpis = computeTripsCalendarKpis(calendarTrips, unassignedOrders);

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <PageHeader
        title="Δρομολόγια"
        subtitle="Επιχειρησιακός προγραμματισμός δρομολογίων, picking και παραδόσεων."
        action={
          <Button
            type="button"
            className={premiumGoldButton}
            onClick={() => {
              setNewTripDate(selectedDate);
              setPresetDriverId(null);
              setNewTripOpen(true);
            }}
          >
            Νέο Δρομολόγιο
          </Button>
        }
      />

      <TripsKpiRow
        kpis={kpis}
        lastUpdated={lastUpdated}
        loading={loading}
      />

      <div className="flex flex-wrap gap-2" role="tablist" aria-label="Προβολή δρομολογίων">
        {VIEW_TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={view === tab.id}
            onClick={() => setViewMode(tab.id)}
            className={cn(
              view === tab.id ? premiumFilterTabActive : premiumFilterTabInactive,
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {error ? <DataError message={error} onRetry={() => void load()} /> : null}

      {view === "day" ? (
        <>
          <div className="flex flex-wrap items-end gap-4 rounded-xl border border-border bg-white p-4 shadow-sm">
            <div className="space-y-1.5">
              <Label htmlFor="trips-date">Ημερομηνία</Label>
              <Input
                id="trips-date"
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-auto"
              />
            </div>
            {driverFilter ? (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() =>
                  router.push(`/trips?date=${encodeURIComponent(selectedDate)}`)
                }
              >
                Όλοι οι οδηγοί
              </Button>
            ) : null}
          </div>

          {loading ? (
            <div className="space-y-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-40 w-full rounded-xl" />
              ))}
            </div>
          ) : !hasDrivers ? (
            <EmptyState
              icon={Route}
              title="Δεν υπάρχουν οδηγοί"
              description="Προσθέστε χρήστες με ρόλο «Οδηγός» για να δημιουργήσετε δρομολόγια."
            />
          ) : visibleGroups.length === 0 ? (
            <EmptyState
              icon={Route}
              title="Δεν βρέθηκε ο οδηγός"
              description="Ο επιλεγμένος οδηγός δεν υπάρχει."
            />
          ) : (
            <div className="space-y-8">
              {visibleGroups.map((group) => {
                const driverExpanded =
                  expandedDriverId == null || expandedDriverId === group.driverId;

                return (
                  <section
                    key={group.driverId}
                    className="overflow-hidden rounded-xl border border-border bg-[#F8F9FC] shadow-sm"
                  >
                    <div className="border-b border-border bg-white px-5 py-4">
                      <p className="flex items-center gap-2 text-lg font-semibold text-kartex-navy">
                        <User className="size-5 shrink-0 text-muted-foreground" aria-hidden />
                        {group.driverName}
                      </p>
                      <p className="mt-1 flex flex-wrap items-center gap-1.5 text-sm text-muted-foreground">
                        {group.vehiclePlate ? (
                          <>
                            <Package className="size-4 shrink-0" aria-hidden />
                            <span>
                              {formatVehicleLabel(group.vehiclePlate, group.vehicleModel)}
                            </span>
                            {group.maxBoxes > 0 ? (
                              <span className="inline-flex items-center gap-1">
                                <span aria-hidden>·</span>
                                <span>Max {group.maxBoxes}</span>
                              </span>
                            ) : null}
                          </>
                        ) : (
                          "Χωρίς ανατεθειμένο όχημα"
                        )}
                      </p>
                    </div>

                    {driverExpanded ? (
                      <div className="space-y-3 p-4">
                        {group.trips.length === 0 ? (
                          <p className="text-sm text-muted-foreground">
                            Δεν υπάρχουν δρομολόγια για αυτή την ημέρα.
                          </p>
                        ) : (
                          group.trips.map((trip) => (
                            <TripDetail
                              key={trip.id}
                              trip={trip}
                              expanded={expandedTripId === trip.id}
                              onToggle={() =>
                                setExpandedTripId((id) =>
                                  id === trip.id ? null : trip.id,
                                )
                              }
                              onRefresh={() => void load()}
                              onAddOrder={() => setAddOrderTrip(trip)}
                            />
                          ))
                        )}

                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="w-full border-dashed"
                          onClick={() => {
                            setPresetDriverId(group.driverId);
                            setNewTripDate(selectedDate);
                            setNewTripOpen(true);
                          }}
                        >
                          + Νέο Δρομολόγιο για αυτόν τον οδηγό
                        </Button>
                      </div>
                    ) : null}
                  </section>
                );
              })}
            </div>
          )}
        </>
      ) : null}

      {view === "month" ? (
        loading ? (
          <Skeleton className="h-[560px] w-full rounded-xl" />
        ) : (
          <TripsMonthView
            trips={calendarTrips}
            unassignedOrders={unassignedOrders}
            onTripClick={navigateToTrip}
            onUnassignedDeliveryClick={handleUnassignedDeliveryClick}
          />
        )
      ) : null}

      {view === "week" ? (
        loading ? (
          <Skeleton className="h-[640px] w-full rounded-xl" />
        ) : (
          <TripsWeekView
            trips={calendarTrips}
            unassignedOrders={unassignedOrders}
            onTripClick={navigateToTrip}
            onUnassignedDeliveryClick={handleUnassignedDeliveryClick}
            onDataChange={() => void loadCalendar()}
          />
        )
      ) : null}

      {view === "list" ? (
        loading ? (
          <Skeleton className="h-[480px] w-full rounded-xl" />
        ) : (
          <TripsListView
            key={filterDate ?? "all"}
            trips={calendarTrips}
            unassignedOrders={unassignedOrders}
            filterDate={filterDate}
            onTripClick={navigateToTrip}
            onUnassignedDeliveryClick={handleUnassignedDeliveryClick}
          />
        )
      ) : null}

      <NewTripModal
        open={newTripOpen}
        onOpenChange={setNewTripOpen}
        defaultDate={newTripDate}
        presetDriverId={presetDriverId}
        onCreated={() => {
          void load();
          setPresetDriverId(null);
        }}
      />

      <AddOrderToTripModal
        open={addOrderTrip != null}
        onOpenChange={(open) => {
          if (!open) setAddOrderTrip(null);
        }}
        trip={addOrderTrip}
        onAdded={(tripId) => {
          setExpandedTripId(tripId);
          void load();
        }}
      />

      <UnassignedOrderActionDialog
        order={unassignedOrder}
        open={unassignedOrder != null}
        onOpenChange={(open) => {
          if (!open) setUnassignedOrder(null);
        }}
        tripsForDate={[]}
        defaultDate={
          unassignedOrder?.deliveryDate ??
          unassignedOrder?.pickingDate ??
          selectedDate
        }
        onAssigned={() => void load()}
        onTripCreated={() => void load()}
      />
    </div>
  );
}
