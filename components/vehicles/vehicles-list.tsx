"use client";

import { Package, Pencil, Truck } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import * as React from "react";

import { DataError } from "@/components/dashboard/data-error";
import { EmptyState } from "@/components/dashboard/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import type { Vehicle } from "@/lib/vehicles/types";
import { premiumGoldButton } from "@/lib/ui/premium-styles";
import { premiumSelect } from "@/lib/ui/form-styles";
import { cn } from "@/lib/utils";

type DriverOption = { id: string; name: string };

export function VehiclesList() {
  const router = useRouter();
  const [vehicles, setVehicles] = React.useState<Vehicle[]>([]);
  const [drivers, setDrivers] = React.useState<DriverOption[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [assigningId, setAssigningId] = React.useState<string | null>(null);

  const load = React.useCallback(async () => {
    setLoading(true);
    setError(null);

    const [vehiclesRes, driversRes] = await Promise.all([
      fetch("/api/vehicles"),
      fetch("/api/drivers"),
    ]);

    const vehiclesJson = (await vehiclesRes.json()) as {
      vehicles?: Vehicle[];
      error?: string;
    };
    const driversJson = (await driversRes.json()) as {
      drivers?: { id: string; name: string }[];
      error?: string;
    };

    if (!vehiclesRes.ok) {
      setError(vehiclesJson.error ?? "Αποτυχία φόρτωσης οχημάτων.");
      setVehicles([]);
    } else {
      setVehicles(vehiclesJson.vehicles ?? []);
    }

    if (driversRes.ok) {
      setDrivers(
        (driversJson.drivers ?? []).map((d) => ({ id: d.id, name: d.name })),
      );
    }

    setLoading(false);
  }, []);

  React.useEffect(() => {
    void load();
  }, [load]);

  async function handleAssignDriver(vehicleId: string, driverUserId: string) {
    setAssigningId(vehicleId);
    const res = await fetch(`/api/vehicles/${vehicleId}/assign-driver`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        driverUserId: driverUserId || null,
      }),
    });
    const json = (await res.json()) as { error?: string };
    setAssigningId(null);

    if (!res.ok) {
      setError(json.error ?? "Αποτυχία ανάθεσης οδηγού.");
      return;
    }

    void load();
    router.refresh();
  }

  async function handleDeactivate(vehicle: Vehicle) {
    if (!vehicle.isActive) return;
    if (!window.confirm(`Απενεργοποίηση οχήματος ${vehicle.plate};`)) return;

    const res = await fetch(`/api/vehicles/${vehicle.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: false }),
    });
    const json = (await res.json()) as { error?: string };
    if (!res.ok) {
      setError(json.error ?? "Αποτυχία απενεργοποίησης.");
      return;
    }
    void load();
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Οχήματα"
        subtitle="Διαχείριση στόλου και ανάθεση οδηγών σε φορτηγά."
        action={
          <Button asChild className={premiumGoldButton}>
            <Link href="/vehicles/new">Νέο Όχημα</Link>
          </Button>
        }
      />

      {error ? <DataError message={error} onRetry={() => void load()} /> : null}

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-48 w-full rounded-xl" />
          ))}
        </div>
      ) : vehicles.length === 0 ? (
        <EmptyState
          icon={Truck}
          title="Δεν υπάρχουν οχήματα"
          description="Προσθέστε το πρώτο όχημα του στόλου."
          actionLabel="Νέο Όχημα"
          actionHref="/vehicles/new"
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {vehicles.map((vehicle) => (
            <Card
              key={vehicle.id}
              className={cn(
                "border-border/80 shadow-sm",
                !vehicle.isActive && "opacity-70",
              )}
            >
              <CardContent className="space-y-4 p-5">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-2xl font-bold tracking-wide text-kartex-navy">
                      {vehicle.plate}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {vehicle.model?.trim() || "—"}
                    </p>
                  </div>
                  <span
                    className={cn(
                      "rounded-full px-2.5 py-0.5 text-xs font-semibold",
                      vehicle.isActive
                        ? "bg-emerald-100 text-emerald-800"
                        : "bg-muted text-muted-foreground",
                    )}
                  >
                    {vehicle.isActive ? "Ενεργό" : "Ανενεργό"}
                  </span>
                </div>

                <p className="flex items-center gap-1.5 text-sm text-kartex-navy">
                  <Package className="size-4 shrink-0 text-muted-foreground" aria-hidden />
                  {vehicle.maxBoxes} κιβώτια max
                </p>

                <p className="text-sm">
                  <span className="text-muted-foreground">Οδηγός: </span>
                  <span className="font-medium text-kartex-navy">
                    {vehicle.assignedDriverName ?? "—"}
                  </span>
                </p>

                <div className="space-y-1.5">
                  <label
                    htmlFor={`driver-${vehicle.id}`}
                    className="text-xs font-medium text-muted-foreground"
                  >
                    Ανάθεση Οδηγού
                  </label>
                  <select
                    id={`driver-${vehicle.id}`}
                    className={cn("w-full text-sm", premiumSelect)}
                    value={vehicle.assignedDriverId ?? ""}
                    disabled={assigningId === vehicle.id}
                    onChange={(e) =>
                      void handleAssignDriver(vehicle.id, e.target.value)
                    }
                  >
                    <option value="">— Χωρίς οδηγό —</option>
                    {drivers.map((driver) => (
                      <option key={driver.id} value={driver.id}>
                        {driver.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex flex-wrap gap-2 pt-1">
                  <Button variant="outline" size="sm" asChild>
                    <Link href={`/vehicles/${vehicle.id}/edit`}>
                      <Pencil className="mr-1 size-3.5" />
                      Επεξεργασία
                    </Link>
                  </Button>
                  {vehicle.isActive ? (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="text-destructive"
                      onClick={() => void handleDeactivate(vehicle)}
                    >
                      Απενεργοποίηση
                    </Button>
                  ) : null}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
