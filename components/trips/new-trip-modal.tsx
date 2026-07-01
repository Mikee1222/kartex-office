"use client";

import { Package, Truck } from "lucide-react";
import * as React from "react";

import { Button } from "@/components/ui/button";
import { Dialog, DialogBody, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getAthensDateString } from "@/lib/datetime";
import { formatVehicleLabel } from "@/lib/drivers/capacity";
import { createClient } from "@/lib/supabase/client";
import { premiumGoldButton, premiumInputFocus, premiumLabel } from "@/lib/ui/premium-styles";
import { premiumSelect, premiumTextarea } from "@/lib/ui/form-styles";

type DriverOption = {
  id: string;
  name: string;
  vehiclePlate: string | null;
  vehicleModel: string | null;
  maxBoxes: number | null;
};

type NewTripModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultDate: string;
  presetDriverId?: string | null;
  onCreated: () => void;
};

export function NewTripModal({
  open,
  onOpenChange,
  defaultDate,
  presetDriverId,
  onCreated,
}: NewTripModalProps) {
  const [drivers, setDrivers] = React.useState<DriverOption[]>([]);
  const [driverId, setDriverId] = React.useState(presetDriverId ?? "");
  const [tripDate, setTripDate] = React.useState(defaultDate);
  const [notes, setNotes] = React.useState("");
  const [loadingDrivers, setLoadingDrivers] = React.useState(false);
  const [pending, setPending] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!open) return;
    setTripDate(defaultDate);
    setDriverId(presetDriverId ?? "");
    setNotes("");
    setError(null);

    let cancelled = false;
    setLoadingDrivers(true);
    void (async () => {
      const res = await fetch("/api/drivers");
      const json = (await res.json()) as { drivers?: DriverOption[]; error?: string };
      if (cancelled) return;
      if (!res.ok) {
        setError(json.error ?? "Αποτυχία φόρτωσης οδηγών.");
        setDrivers([]);
      } else {
        setDrivers(json.drivers ?? []);
        if (!presetDriverId && json.drivers?.length === 1) {
          setDriverId(json.drivers[0].id);
        }
      }
      setLoadingDrivers(false);
    })();

    return () => {
      cancelled = true;
    };
  }, [open, defaultDate, presetDriverId]);

  const selected = drivers.find((d) => d.id === driverId);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!driverId) {
      setError("Επιλέξτε οδηγό.");
      return;
    }

    const date = tripDate || getAthensDateString();
    setPending(true);
    setError(null);

    const supabase = createClient();
    const { data: existing, error: lookupError } = await supabase
      .from("delivery_trips")
      .select("trip_number")
      .eq("driver_id", driverId)
      .eq("trip_date", date)
      .order("trip_number", { ascending: false })
      .limit(1);

    if (lookupError) {
      setPending(false);
      setError(lookupError.message);
      return;
    }

    const tripNumber =
      existing?.[0]?.trip_number != null ? existing[0].trip_number + 1 : 1;

    const res = await fetch("/api/trips", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        driverId,
        tripDate: date,
        notes,
        tripNumber,
      }),
    });

    const json = (await res.json()) as { error?: string };
    setPending(false);

    if (!res.ok) {
      setError(json.error ?? "Αποτυχία δημιουργίας δρομολογίου.");
      return;
    }

    onOpenChange(false);
    onCreated();
  }

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title="Νέο Δρομολόγιο"
      className="max-w-lg"
    >
      <form onSubmit={(e) => void handleSubmit(e)}>
        <DialogBody className="space-y-4">
          {error ? (
            <p className="text-sm text-destructive" role="alert">
              {error}
            </p>
          ) : null}

          <div className="space-y-2">
            <Label htmlFor="trip-driver" className={premiumLabel}>
              Οδηγός *
            </Label>
            {loadingDrivers ? (
              <p className="text-sm text-muted-foreground">Φόρτωση…</p>
            ) : (
              <select
                id="trip-driver"
                value={driverId}
                onChange={(e) => setDriverId(e.target.value)}
                className={premiumSelect}
                required
              >
                <option value="">— Επιλογή —</option>
                {drivers.map((driver) => (
                  <option key={driver.id} value={driver.id}>
                    {driver.name}
                  </option>
                ))}
              </select>
            )}
          </div>

          {selected ? (
            <div className="rounded-lg border border-border bg-[#F8F9FC] px-3 py-2 text-sm text-kartex-navy">
              {selected.vehiclePlate ? (
                <span className="inline-flex flex-wrap items-center gap-1.5">
                  <Truck className="size-4 shrink-0" aria-hidden />
                  {formatVehicleLabel(selected.vehiclePlate, selected.vehicleModel)}
                  {selected.maxBoxes != null ? (
                    <>
                      <span aria-hidden>·</span>
                      <span>Max {selected.maxBoxes}</span>
                      <Package className="size-4 shrink-0" aria-hidden />
                    </>
                  ) : null}
                </span>
              ) : (
                <span className="text-amber-700">Ο οδηγός δεν έχει ανατεθεί όχημα.</span>
              )}
            </div>
          ) : null}

          <div className="space-y-2">
            <Label htmlFor="trip-date" className={premiumLabel}>
              Ημερομηνία
            </Label>
            <Input
              id="trip-date"
              type="date"
              value={tripDate}
              onChange={(e) => setTripDate(e.target.value)}
              className={premiumInputFocus}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="trip-notes" className={premiumLabel}>
              Σημειώσεις
            </Label>
            <textarea
              id="trip-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className={premiumTextarea}
              rows={3}
            />
          </div>
        </DialogBody>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Ακύρωση
          </Button>
          <Button type="submit" className={premiumGoldButton} disabled={pending}>
            {pending ? "Αποθήκευση…" : "Δημιουργία"}
          </Button>
        </DialogFooter>
      </form>
    </Dialog>
  );
}
