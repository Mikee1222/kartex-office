"use client";

import Link from "next/link";
import { ChevronDown, ChevronUp, Package, Users } from "lucide-react";
import * as React from "react";

import { DataError } from "@/components/dashboard/data-error";
import { EmptyState } from "@/components/dashboard/empty-state";
import { TripStatusBadge } from "@/components/trips/trip-status-badge";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  capacityBarClass,
  formatVehicleLabel,
} from "@/lib/drivers/capacity";
import type { TripStatus } from "@/lib/trips/types";
import { cn } from "@/lib/utils";

type TodayTrip = {
  id: string;
  tripNumber: number;
  status: TripStatus;
  totalBoxes: number;
  ordersCount: number;
};

type DriverRow = {
  id: string;
  name: string;
  email: string;
  vehiclePlate: string | null;
  vehicleModel: string | null;
  maxBoxes: number;
  totalBoxesToday: number;
  tripsCount: number;
  completedTrips: number;
  totalTrips: number;
  progressPercent: number;
  driverStatus: "available" | "on_trip" | "returned";
  driverStatusLabel: string;
  activeTripNumber: number | null;
  todayTrips: TodayTrip[];
};

function driverStatusBadgeClass(status: DriverRow["driverStatus"]) {
  if (status === "on_trip") return "bg-blue-100 text-blue-800";
  if (status === "returned") return "bg-emerald-100 text-emerald-800";
  return "bg-slate-100 text-slate-700";
}

export function DriversDashboard() {
  const [drivers, setDrivers] = React.useState<DriverRow[]>([]);
  const [today, setToday] = React.useState("");
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [expandedId, setExpandedId] = React.useState<string | null>(null);

  const load = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    const res = await fetch("/api/drivers/dashboard");
    const json = (await res.json()) as {
      drivers?: DriverRow[];
      today?: string;
      error?: string;
    };

    if (!res.ok) {
      setError(json.error ?? "Αποτυχία φόρτωσης οδηγών.");
      setDrivers([]);
    } else {
      setDrivers(json.drivers ?? []);
      setToday(json.today ?? "");
    }
    setLoading(false);
  }, []);

  React.useEffect(() => {
    void load();
  }, [load]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Οδηγοί"
        subtitle={
          today
            ? `Ημερήσιο πρόγραμμα — ${today}`
            : "Κατάσταση οδηγών και δρομολογίων σήμερα."
        }
      />

      {error ? <DataError message={error} onRetry={() => void load()} /> : null}

      {loading ? (
        <div className="grid gap-4 lg:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-44 w-full rounded-xl" />
          ))}
        </div>
      ) : drivers.length === 0 ? (
        <EmptyState
          icon={Users}
          title="Δεν υπάρχουν οδηγοί"
          description="Προσθέστε χρήστες με ρόλο «Οδηγός» και αντιστοιχίστε τους σε όχημα."
        />
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {drivers.map((driver) => {
            const expanded = expandedId === driver.id;

            return (
              <Card key={driver.id} className="border-border/80 shadow-sm">
                <CardContent className="space-y-4 p-5">
                  <button
                    type="button"
                    className="flex w-full items-start justify-between gap-3 text-left"
                    onClick={() =>
                      setExpandedId(expanded ? null : driver.id)
                    }
                  >
                    <div>
                      <p className="text-lg font-semibold text-kartex-navy">
                        {driver.name}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {driver.email}
                      </p>
                      <p className="mt-1 text-sm text-kartex-navy">
                        {driver.vehiclePlate
                          ? formatVehicleLabel(
                              driver.vehiclePlate,
                              driver.vehicleModel,
                            )
                          : "Χωρίς όχημα"}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span
                        className={cn(
                          "rounded-full px-2.5 py-0.5 text-xs font-semibold",
                          driverStatusBadgeClass(driver.driverStatus),
                        )}
                      >
                        {driver.driverStatusLabel}
                      </span>
                      {expanded ? (
                        <ChevronUp className="size-4 text-muted-foreground" />
                      ) : (
                        <ChevronDown className="size-4 text-muted-foreground" />
                      )}
                    </div>
                  </button>

                  <div>
                    <div className="mb-1 flex justify-between text-xs text-muted-foreground">
                      <span>
                        {driver.tripsCount}{" "}
                        {driver.tripsCount === 1 ? "δρομολόγιο" : "δρομολόγια"} σήμερα
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <Package className="size-3.5 shrink-0" aria-hidden />
                        {driver.totalBoxesToday}/{driver.maxBoxes} κιβώτια ·{" "}
                        {driver.completedTrips}/{driver.totalTrips} ολοκληρωμένα
                      </span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-border">
                      <div
                        className={cn(
                          "h-full transition-all",
                          capacityBarClass(driver.progressPercent),
                        )}
                        style={{ width: `${Math.min(driver.progressPercent, 100)}%` }}
                      />
                    </div>
                  </div>

                  {expanded ? (
                    <div className="space-y-2 border-t border-border pt-3">
                      {driver.todayTrips.length === 0 ? (
                        <p className="text-sm text-muted-foreground">
                          Δεν υπάρχουν δρομολόγια για σήμερα.
                        </p>
                      ) : (
                        driver.todayTrips.map((trip) => (
                          <div
                            key={trip.id}
                            className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-[#F8F9FC] px-3 py-2 text-sm"
                          >
                            <span className="font-medium text-kartex-navy">
                              Δρομολόγιο #{trip.tripNumber}
                            </span>
                            <TripStatusBadge status={trip.status} />
                            <span className="inline-flex items-center gap-1 text-muted-foreground">
                              <Package className="size-3.5 shrink-0" aria-hidden />
                              {trip.totalBoxes} · {trip.ordersCount} παραδόσεις
                            </span>
                          </div>
                        ))
                      )}
                      <Link
                        href={`/trips?driver=${driver.id}${today ? `&date=${today}` : ""}`}
                        className="inline-block text-sm font-medium text-kartex-gold hover:underline"
                      >
                        Προβολή δρομολογίων →
                      </Link>
                    </div>
                  ) : null}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
