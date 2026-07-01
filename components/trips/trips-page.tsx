"use client";

import { Package, Route, Truck, User } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import * as React from "react";

import { DataError } from "@/components/dashboard/data-error";
import { EmptyState } from "@/components/dashboard/empty-state";
import { AddOrderToTripModal } from "@/components/trips/add-order-to-trip-modal";
import { NewTripModal } from "@/components/trips/new-trip-modal";
import { TripDetail } from "@/components/trips/trip-detail";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { getAthensDateString } from "@/lib/datetime";
import { formatVehicleLabel } from "@/lib/drivers/capacity";
import type { DeliveryTrip, DriverTripGroup } from "@/lib/trips/types";
import { premiumGoldButton } from "@/lib/ui/premium-styles";

export function TripsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const driverFilter = searchParams.get("driver");
  const dateParam = searchParams.get("date");

  const [selectedDate, setSelectedDate] = React.useState(
    dateParam ?? getAthensDateString(),
  );
  const [groups, setGroups] = React.useState<DriverTripGroup[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const [newTripOpen, setNewTripOpen] = React.useState(false);
  const [presetDriverId, setPresetDriverId] = React.useState<string | null>(null);
  const [addOrderTrip, setAddOrderTrip] = React.useState<DeliveryTrip | null>(null);
  const [expandedTripId, setExpandedTripId] = React.useState<string | null>(null);
  const [expandedDriverId, setExpandedDriverId] = React.useState<string | null>(
    driverFilter,
  );

  const load = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    const res = await fetch(`/api/trips?date=${encodeURIComponent(selectedDate)}`);
    const json = (await res.json()) as {
      groups?: DriverTripGroup[];
      error?: string;
    };

    if (!res.ok) {
      setError(json.error ?? "Αποτυχία φόρτωσης δρομολογίων.");
      setGroups([]);
    } else {
      setGroups(json.groups ?? []);
    }
    setLoading(false);
  }, [selectedDate]);

  React.useEffect(() => {
    void load();
  }, [load]);

  React.useEffect(() => {
    if (dateParam) {
      setSelectedDate(dateParam);
    }
  }, [dateParam]);

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

  const visibleGroups = driverFilter
    ? groups.filter((g) => g.driverId === driverFilter)
    : groups;

  const hasDrivers = groups.length > 0;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Δρομολόγια"
        subtitle="Οργάνωση δρομολογίων ανά οδηγό και ημέρα."
        action={
          <Button
            type="button"
            className={premiumGoldButton}
            onClick={() => {
              setPresetDriverId(null);
              setNewTripOpen(true);
            }}
          >
            Νέο Δρομολόγιο
          </Button>
        }
      />

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
            onClick={() => router.push(`/trips?date=${encodeURIComponent(selectedDate)}`)}
          >
            Όλοι οι οδηγοί
          </Button>
        ) : null}
      </div>

      {error ? <DataError message={error} onRetry={() => void load()} /> : null}

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
                        <Truck className="size-4 shrink-0" aria-hidden />
                        <span>{formatVehicleLabel(group.vehiclePlate, group.vehicleModel)}</span>
                        {group.maxBoxes > 0 ? (
                          <span className="inline-flex items-center gap-1">
                            <span aria-hidden>·</span>
                            <span>Max {group.maxBoxes}</span>
                            <Package className="size-4 shrink-0" aria-hidden />
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

      <NewTripModal
        open={newTripOpen}
        onOpenChange={setNewTripOpen}
        defaultDate={selectedDate}
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
    </div>
  );
}
