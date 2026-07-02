"use client";

import Link from "next/link";
import * as React from "react";

import { AddOrderToTripModal } from "@/components/trips/add-order-to-trip-modal";
import { NewTripModal } from "@/components/trips/new-trip-modal";
import { Button } from "@/components/ui/button";
import { Dialog, DialogBody, DialogFooter } from "@/components/ui/dialog";
import type { TripsCalendarOrder } from "@/lib/trips/calendar-types";
import type { DeliveryTrip } from "@/lib/trips/types";
import { premiumGoldButton } from "@/lib/ui/premium-styles";

type UnassignedOrderActionDialogProps = {
  order: TripsCalendarOrder | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tripsForDate: DeliveryTrip[];
  defaultDate: string;
  onAssigned: () => void;
  onTripCreated: () => void;
};

export function UnassignedOrderActionDialog({
  order,
  open,
  onOpenChange,
  tripsForDate: tripsForDateProp,
  defaultDate,
  onAssigned,
  onTripCreated,
}: UnassignedOrderActionDialogProps) {
  const [addOrderTrip, setAddOrderTrip] = React.useState<DeliveryTrip | null>(null);
  const [newTripOpen, setNewTripOpen] = React.useState(false);
  const [tripsForDate, setTripsForDate] = React.useState<DeliveryTrip[]>(tripsForDateProp);
  const [loadingTrips, setLoadingTrips] = React.useState(false);

  React.useEffect(() => {
    if (!open) {
      setAddOrderTrip(null);
      setNewTripOpen(false);
      return;
    }

    let cancelled = false;
    setLoadingTrips(true);
    void (async () => {
      const res = await fetch(`/api/trips?date=${encodeURIComponent(defaultDate)}`);
      const json = (await res.json()) as { groups?: { trips: DeliveryTrip[] }[] };
      if (cancelled) return;
      const trips = (json.groups ?? []).flatMap((group) => group.trips);
      setTripsForDate(trips);
      setLoadingTrips(false);
    })();

    return () => {
      cancelled = true;
    };
  }, [open, defaultDate]);

  React.useEffect(() => {
    if (open) {
      setTripsForDate(tripsForDateProp);
    }
  }, [open, tripsForDateProp]);

  if (!order) return null;

  const pendingTrips = tripsForDate.filter((trip) => trip.status !== "completed");

  return (
    <>
      <Dialog
        open={open && addOrderTrip == null && !newTripOpen}
        onOpenChange={onOpenChange}
        title={`Παραγγελία ${order.orderNumber}`}
        description={`${order.customerName} · ${order.boxesCount} κιβώτια`}
        className="max-w-lg"
      >
        <DialogBody className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Η παραγγελία δεν έχει ανατεθεί σε δρομολόγιο. Επιλέξτε δρομολόγιο ή
            δημιουργήστε νέο.
          </p>

          {order.pickingInProgress || order.pickingComplete ? (
            <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
              Picking:{" "}
              {order.pickingComplete
                ? "ολοκληρώθηκε"
                : `${order.pickedItemCount}/${order.totalItemCount} γραμμές`}
            </p>
          ) : null}

          {loadingTrips ? (
            <p className="text-sm text-muted-foreground">Φόρτωση δρομολογίων…</p>
          ) : pendingTrips.length > 0 ? (
            <ul className="space-y-2">
              {pendingTrips.map((trip) => (
                <li key={trip.id}>
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full justify-start"
                    onClick={() => setAddOrderTrip(trip)}
                  >
                    Προσθήκη σε Δρομολόγιο #{trip.tripNumber} · {trip.driverName}
                  </Button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground">
              Δεν υπάρχουν ενεργά δρομολόγια για αυτή την ημέρα.
            </p>
          )}

          <Button
            type="button"
            className={premiumGoldButton}
            onClick={() => setNewTripOpen(true)}
          >
            Νέο Δρομολόγιο
          </Button>

          <Link
            href={`/orders/${order.id}`}
            className="block text-center text-sm font-medium text-kartex-gold hover:underline"
          >
            Άνοιγμα παραγγελίας
          </Link>
        </DialogBody>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Κλείσιμο
          </Button>
        </DialogFooter>
      </Dialog>

      <AddOrderToTripModal
        open={addOrderTrip != null}
        onOpenChange={(nextOpen) => {
          if (!nextOpen) setAddOrderTrip(null);
        }}
        trip={addOrderTrip}
        onAdded={() => {
          setAddOrderTrip(null);
          onOpenChange(false);
          onAssigned();
        }}
      />

      <NewTripModal
        open={newTripOpen}
        onOpenChange={setNewTripOpen}
        defaultDate={defaultDate}
        onCreated={() => {
          setNewTripOpen(false);
          onOpenChange(false);
          onTripCreated();
        }}
      />
    </>
  );
}
