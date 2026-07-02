"use client";

import { Package } from "lucide-react";
import * as React from "react";
import { toast } from "sonner";

import { OrderStatus } from "@/components/orders/types";
import { type OrderDetail } from "@/components/orders/order-detail-types";
import { OverCapacityModals } from "@/components/orders/over-capacity-modals";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { premiumGoldButton, premiumLabel } from "@/lib/ui/premium-styles";
import { premiumSelect } from "@/lib/ui/form-styles";
import {
  capacityBarClass,
  capacityProgressPercent,
  formatVehicleLabel,
} from "@/lib/drivers/capacity";
import { cn } from "@/lib/utils";

type DriverOption = {
  id: string;
  name: string;
  email: string;
  vehicleId: string | null;
  vehiclePlate: string | null;
  vehicleModel: string | null;
  maxBoxes: number | null;
};

type CapacityState = {
  vehicleId: string | null;
  plate: string | null;
  model: string | null;
  maxBoxes: number;
  currentBoxes: number;
};

type DriverAssignmentSectionProps = {
  order: OrderDetail;
  orderId: string;
  onUpdated: () => void;
};

export function DriverAssignmentSection({
  order,
  orderId,
  onUpdated,
}: DriverAssignmentSectionProps) {
  const [drivers, setDrivers] = React.useState<DriverOption[]>([]);
  const [selectedDriverId, setSelectedDriverId] = React.useState("");
  const [capacity, setCapacity] = React.useState<CapacityState | null>(null);
  const [loadingDrivers, setLoadingDrivers] = React.useState(false);
  const [loadingCapacity, setLoadingCapacity] = React.useState(false);
  const [assigning, setAssigning] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [modalStep, setModalStep] = React.useState<"first" | "second" | null>(null);

  const showAssignForm =
    order.status === OrderStatus.ReadyForShipment && !order.assignedDriverName;

  const orderBoxes = order.boxesCount ?? 0;

  React.useEffect(() => {
    if (!showAssignForm) return;

    let cancelled = false;
    setLoadingDrivers(true);
    setError(null);

    void (async () => {
      const res = await fetch("/api/drivers");
      const json = (await res.json()) as {
        drivers?: DriverOption[];
        error?: string;
      };
      if (cancelled) return;
      if (!res.ok) {
        setError(json.error ?? "Αποτυχία φόρτωσης οδηγών.");
        setDrivers([]);
      } else {
        setDrivers(json.drivers ?? []);
      }
      setLoadingDrivers(false);
    })();

    return () => {
      cancelled = true;
    };
  }, [showAssignForm]);

  React.useEffect(() => {
    if (!selectedDriverId) {
      setCapacity(null);
      return;
    }

    let cancelled = false;
    setLoadingCapacity(true);
    const params = new URLSearchParams({
      driverId: selectedDriverId,
      deliveryDate: order.deliveryDateRaw ?? "",
    });

    void (async () => {
      const res = await fetch(`/api/drivers/capacity?${params}`);
      const json = (await res.json()) as CapacityState & { error?: string };
      if (cancelled) return;
      if (!res.ok) {
        setError(json.error ?? "Αποτυχία φόρτωσης χωρητικότητας.");
        setCapacity(null);
      } else {
        setCapacity(json);
        setError(null);
      }
      setLoadingCapacity(false);
    })();

    return () => {
      cancelled = true;
    };
  }, [selectedDriverId, order.deliveryDateRaw]);

  if (!showAssignForm) return null;

  const selectedDriver = drivers.find((d) => d.id === selectedDriverId);
  const maxBoxes = capacity?.maxBoxes ?? 0;
  const currentBoxes = capacity?.currentBoxes ?? 0;
  const projected = currentBoxes + orderBoxes;
  const percent = capacityProgressPercent(projected, maxBoxes);

  async function performAssign() {
    if (!selectedDriver || !capacity) return;

    setAssigning(true);
    setError(null);

    const res = await fetch(`/api/orders/${orderId}/assign-driver`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        driverId: selectedDriver.id,
        driverName: selectedDriver.name,
        vehicleId: capacity.vehicleId,
        deliveryDate: order.deliveryDateRaw,
        orderBoxes,
        statusHistory: order.statusHistory,
      }),
    });

    const json = (await res.json()) as {
      error?: string;
      warning?: string;
      tripNumber?: number;
      deliverySequence?: number;
    };
    setAssigning(false);
    setModalStep(null);

    if (!res.ok) {
      setError(json.error ?? "Αποτυχία ανάθεσης.");
      return;
    }

    const tripLabel =
      json.tripNumber != null
        ? `Δρομολόγιο #${json.tripNumber}${json.deliverySequence != null ? `, στάση #${json.deliverySequence}` : ""}`
        : "Η παραγγελία ανατέθηκε";
    toast.success(tripLabel);
    if (json.warning) {
      toast.warning(json.warning);
    }

    onUpdated();
  }

  function handleAssignClick() {
    if (!selectedDriver || !capacity) {
      setError("Επιλέξτε οδηγό με διαθέσιμο όχημα.");
      return;
    }

    if (projected > maxBoxes) {
      setModalStep("first");
      return;
    }

    void performAssign();
  }

  return (
    <>
      <Card className="border-border/80 shadow-sm print:hidden">
        <CardHeader>
          <CardTitle className="text-lg text-kartex-navy">Ανάθεση Οδηγού</CardTitle>
          <CardDescription>
            Επιλέξτε οδηγό, ελέγξτε τη χωρητικότητα και ολοκληρώστε την αποστολή.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {error ? (
            <p
              className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive"
              role="alert"
            >
              {error}
            </p>
          ) : null}

          {loadingDrivers ? (
            <p className="text-sm text-muted-foreground">Φόρτωση οδηγών…</p>
          ) : drivers.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Δεν υπάρχουν χρήστες με ρόλο «Οδηγός».
            </p>
          ) : (
            <div className="space-y-2">
              <Label htmlFor="driver-select" className={premiumLabel}>
                Επιλέξτε Οδηγό
              </Label>
              <select
                id="driver-select"
                value={selectedDriverId}
                onChange={(e) => setSelectedDriverId(e.target.value)}
                className={cn("w-full", premiumSelect)}
              >
                <option value="">— Επιλογή —</option>
                {drivers.map((driver) => (
                  <option key={driver.id} value={driver.id}>
                    {driver.name}
                    {driver.vehiclePlate ? ` · ${driver.vehiclePlate}` : ""}
                  </option>
                ))}
              </select>
            </div>
          )}

          {selectedDriverId && capacity ? (
            <div className="space-y-3 rounded-lg border border-border bg-[#F8F9FC] p-4">
              <p className="text-sm text-kartex-navy">
                <span className="font-medium">Όχημα:</span>{" "}
                {formatVehicleLabel(capacity.plate, capacity.model)}
              </p>
              <div>
                <div className="mb-1 flex justify-between text-xs text-muted-foreground">
                  <span>Χωρητικότητα σήμερα</span>
                  <span className="inline-flex items-center gap-1">
                    <Package className="size-3.5 shrink-0" aria-hidden />
                    {currentBoxes}/{maxBoxes} κιβώτια
                  </span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-border">
                  <div
                    className={cn("h-full transition-all", capacityBarClass(percent))}
                    style={{ width: `${Math.min(percent, 100)}%` }}
                  />
                </div>
              </div>
              <p className="text-sm text-muted-foreground">
                Αυτή η παραγγελία: <span className="font-medium">+ {orderBoxes} κιβώτια</span>
              </p>
              <p className="flex items-center gap-1.5 text-sm font-medium text-kartex-navy">
                Μετά την ανάθεση:
                <Package className="size-3.5 shrink-0 text-muted-foreground" aria-hidden />
                {projected}/{maxBoxes} κιβώτια
              </p>
            </div>
          ) : null}

          {selectedDriverId && loadingCapacity ? (
            <p className="text-sm text-muted-foreground">Φόρτωση χωρητικότητας…</p>
          ) : null}

          <Button
            type="button"
            className={premiumGoldButton}
            disabled={assigning || !selectedDriverId || !capacity}
            onClick={handleAssignClick}
          >
            {assigning ? "Αποστολή…" : "Ανάθεση & Αποστολή"}
          </Button>
        </CardContent>
      </Card>

      <OverCapacityModals
        open={modalStep != null}
        step={modalStep}
        currentBoxes={currentBoxes}
        maxBoxes={maxBoxes}
        orderBoxes={orderBoxes}
        onCancel={() => setModalStep(null)}
        onContinueFirst={() => setModalStep("second")}
        onConfirmFinal={() => void performAssign()}
        confirming={assigning}
      />
    </>
  );
}
