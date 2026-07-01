"use client";

import Link from "next/link";
import { CheckCircle2, Package } from "lucide-react";
import * as React from "react";

import { OverCapacityModals } from "@/components/orders/over-capacity-modals";
import { Button } from "@/components/ui/button";
import { Dialog, DialogBody, DialogFooter } from "@/components/ui/dialog";
import { displayTripTotalBoxes } from "@/lib/trips/boxes";
import type { AvailableTripOrder, DeliveryTrip } from "@/lib/trips/types";
import { premiumGoldButton } from "@/lib/ui/premium-styles";

type AddOrderToTripModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  trip: DeliveryTrip | null;
  onAdded: (tripId: string, totalBoxes: number) => void;
};

async function fetchAvailableOrders(): Promise<{
  orders: AvailableTripOrder[];
  error: string | null;
}> {
  const res = await fetch("/api/trips/available-orders");
  const json = (await res.json()) as {
    orders?: AvailableTripOrder[];
    error?: string;
  };

  if (!res.ok) {
    return { orders: [], error: json.error ?? "Αποτυχία φόρτωσης παραγγελιών." };
  }

  return { orders: json.orders ?? [], error: null };
}

export function AddOrderToTripModal({
  open,
  onOpenChange,
  trip,
  onAdded,
}: AddOrderToTripModalProps) {
  const [tripState, setTripState] = React.useState<DeliveryTrip | null>(trip);
  const [orders, setOrders] = React.useState<AvailableTripOrder[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [pendingOrderId, setPendingOrderId] = React.useState<string | null>(null);
  const [selectedOrderId, setSelectedOrderId] = React.useState<string | null>(null);
  const [modalStep, setModalStep] = React.useState<"first" | "second" | null>(null);

  React.useEffect(() => {
    if (trip) setTripState(trip);
  }, [trip]);

  const reloadOrders = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    const result = await fetchAvailableOrders();
    setOrders(result.orders);
    if (result.error) setError(result.error);
    setLoading(false);
  }, []);

  React.useEffect(() => {
    if (!open) return;

    setSelectedOrderId(null);
    setModalStep(null);
    setPendingOrderId(null);
    void reloadOrders();
  }, [open, reloadOrders]);

  if (!tripState) return null;

  const maxBoxes = tripState.maxBoxes;
  const boxesOnTrip = displayTripTotalBoxes(tripState);
  const selectedOrder = orders.find((o) => o.id === selectedOrderId);

  function wouldExceedCapacity(orderBoxes: number) {
    return maxBoxes > 0 && boxesOnTrip + orderBoxes > maxBoxes;
  }

  async function performAdd(orderId: string) {
    setPendingOrderId(orderId);
    setError(null);

    const res = await fetch(`/api/trips/${tripState!.id}/orders`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orderId }),
    });

    const json = (await res.json()) as { error?: string; totalBoxes?: number };
    setPendingOrderId(null);
    setModalStep(null);
    setSelectedOrderId(null);

    if (!res.ok) {
      setError(json.error ?? "Αποτυχία προσθήκης.");
      return;
    }

    if (typeof json.totalBoxes !== "number") {
      setError("Η απάντηση του διακομιστή δεν περιείχε σύνολο κιβωτίων.");
      return;
    }

    const nextTotal = json.totalBoxes;

    setTripState((current) =>
      current ? { ...current, totalBoxes: nextTotal } : current,
    );
    setOrders((list) => list.filter((order) => order.id !== orderId));
    onAdded(tripState!.id, nextTotal);
  }

  function handleAddClick(order: AvailableTripOrder) {
    setSelectedOrderId(order.id);
    setError(null);

    if (wouldExceedCapacity(order.boxesCount)) {
      setModalStep("first");
      return;
    }

    void performAdd(order.id);
  }

  return (
    <>
      <Dialog
        open={open && modalStep == null}
        onOpenChange={onOpenChange}
        title="Προσθήκη Παραγγελίας"
        description={
          <span className="inline-flex flex-wrap items-center gap-1.5">
            Δρομολόγιο #{tripState.tripNumber} ·
            <Package className="size-4 shrink-0" aria-hidden />
            {boxesOnTrip}/{maxBoxes} κιβώτια
          </span>
        }
        className="max-w-2xl"
      >
        <DialogBody className="max-h-[min(60vh,480px)] space-y-3 overflow-y-auto">
          {error ? (
            <p className="text-sm text-destructive" role="alert">
              {error}
            </p>
          ) : null}

          {loading ? (
            <p className="text-sm text-gray-400">Φόρτωση παραγγελιών…</p>
          ) : orders.length === 0 ? (
            <p className="text-sm text-gray-400">
              Δεν υπάρχουν παραγγελίες «Έτοιμο για Αποστολή» χωρίς δρομολόγιο.
            </p>
          ) : (
            <ul className="space-y-2">
              {orders.map((order) => {
                const isPending = pendingOrderId === order.id;

                return (
                  <li
                    key={order.id}
                    className="rounded-lg border border-gray-200 bg-white px-4 py-3"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="min-w-0 flex-1 space-y-1">
                        <p className="font-medium text-navy-900">
                          <Link
                            href={`/orders/${order.id}`}
                            className="font-mono font-semibold hover:text-gold-500"
                          >
                            {order.orderNumber}
                          </Link>
                          <span className="font-normal text-gray-600">
                            {" "}
                            · {order.customerName}
                          </span>
                        </p>
                        <p className="flex items-center gap-1.5 text-sm text-gray-600">
                          <Package className="size-4 shrink-0 text-gray-400" aria-hidden />
                          {order.boxesCount} κιβώτια
                        </p>
                        <p className="text-xs text-gray-400">{order.address}</p>
                      </div>
                      <Button
                        type="button"
                        size="sm"
                        className={premiumGoldButton}
                        disabled={pendingOrderId != null}
                        onClick={() => handleAddClick(order)}
                      >
                        {isPending ? "Προσθήκη…" : "Προσθήκη"}
                      </Button>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </DialogBody>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Κλείσιμο
          </Button>
        </DialogFooter>
      </Dialog>

      <OverCapacityModals
        open={modalStep != null}
        step={modalStep}
        variant="trip"
        currentBoxes={boxesOnTrip}
        maxBoxes={maxBoxes}
        orderBoxes={selectedOrder?.boxesCount ?? 0}
        onCancel={() => {
          setModalStep(null);
          setSelectedOrderId(null);
        }}
        onContinueFirst={() => setModalStep("second")}
        onConfirmFinal={() => {
          if (selectedOrderId) void performAdd(selectedOrderId);
        }}
        confirming={pendingOrderId != null}
        firstConfirmLabel="Κατανοώ, συνέχεια"
        finalConfirmLabel={
          <span className="inline-flex items-center gap-1.5">
            <CheckCircle2 className="size-4 shrink-0" aria-hidden />
            ΝΑΙ, ΕΠΙΒΕΒΑΙΩΝΩ ΥΠΕΡΒΑΣΗ
          </span>
        }
      />
    </>
  );
}
