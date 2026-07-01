"use client";

import * as React from "react";

import { VehicleForm } from "@/components/vehicles/vehicle-form";
import { DataError } from "@/components/dashboard/data-error";
import { Skeleton } from "@/components/ui/skeleton";
import type { VehicleFormData } from "@/lib/vehicles/types";

type EditVehiclePageProps = {
  params: Promise<{ id: string }>;
};

export default function EditVehiclePage({ params }: EditVehiclePageProps) {
  const [vehicleId, setVehicleId] = React.useState<string | null>(null);
  const [initial, setInitial] = React.useState<VehicleFormData | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    let cancelled = false;

    void (async () => {
      const { id } = await params;
      if (cancelled) return;
      setVehicleId(id);

      const res = await fetch(`/api/vehicles/${id}`);
      const json = (await res.json()) as {
        vehicle?: VehicleFormData & { id: string };
        error?: string;
      };

      if (cancelled) return;
      if (!res.ok || !json.vehicle) {
        setError(json.error ?? "Αποτυχία φόρτωσης.");
        setInitial(null);
      } else {
        setInitial({
          plate: json.vehicle.plate,
          model: json.vehicle.model ?? "",
          maxBoxes: json.vehicle.maxBoxes,
          notes: json.vehicle.notes ?? "",
          isActive: json.vehicle.isActive,
        });
      }
      setLoading(false);
    })();

    return () => {
      cancelled = true;
    };
  }, [params]);

  if (loading) {
    return <Skeleton className="mx-auto h-96 max-w-3xl rounded-xl" />;
  }

  if (error || !vehicleId || !initial) {
    return (
      <DataError
        message={error ?? "Δεν βρέθηκε το όχημα."}
        onRetry={() => window.location.reload()}
      />
    );
  }

  return <VehicleForm mode="edit" vehicleId={vehicleId} initial={initial} />;
}
