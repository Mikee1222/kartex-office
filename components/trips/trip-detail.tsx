"use client";

import Link from "next/link";
import { GripVertical, Package, X } from "lucide-react";
import * as React from "react";

import { OrderStatusBadge } from "@/components/orders/order-status-badge";
import { DeleteTripButton } from "@/components/trips/delete-trip-button";
import { TripStatusBadge } from "@/components/trips/trip-status-badge";
import { Button } from "@/components/ui/button";
import {
  capacityBarClass,
  capacityProgressPercent,
  formatVehicleLabel,
} from "@/lib/drivers/capacity";
import { displayTripTotalBoxes } from "@/lib/trips/boxes";
import type { DeliveryTrip, TripOrderRow } from "@/lib/trips/types";
import { premiumGoldButton } from "@/lib/ui/premium-styles";
import { normalizeOrderStatus } from "@/types/database";
import { formatDateEl } from "@/types/database";
import { cn } from "@/lib/utils";

type TripDetailProps = {
  trip: DeliveryTrip;
  expanded: boolean;
  onToggle: () => void;
  onRefresh: () => void;
  onAddOrder: () => void;
};

function formatTimestamp(iso: string | null) {
  if (!iso) return null;
  return formatDateEl(iso);
}

function TripActionBar({
  canEdit,
  canStart,
  canComplete,
  canDelete,
  busy,
  onAddOrder,
  onStart,
  onComplete,
  deleteButton,
}: {
  canEdit: boolean;
  canStart: boolean;
  canComplete: boolean;
  canDelete: boolean;
  busy: string | null;
  onAddOrder: () => void;
  onStart: () => void;
  onComplete: () => void;
  deleteButton?: React.ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2 border-t border-border px-4 py-3">
      {canEdit ? (
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={(event) => {
            event.stopPropagation();
            onAddOrder();
          }}
        >
          Προσθήκη Παραγγελίας
        </Button>
      ) : null}
      {canStart ? (
        <Button
          type="button"
          size="sm"
          className={premiumGoldButton}
          disabled={busy != null}
          onClick={(event) => {
            event.stopPropagation();
            onStart();
          }}
        >
          {busy === "start" ? "Εκκίνηση…" : "Εκκίνηση"}
        </Button>
      ) : null}
      {canComplete ? (
        <Button
          type="button"
          size="sm"
          className={premiumGoldButton}
          disabled={busy != null}
          onClick={(event) => {
            event.stopPropagation();
            onComplete();
          }}
        >
          {busy === "complete" ? "Επιστροφή…" : "Επιστροφή"}
        </Button>
      ) : null}
      {canDelete && deleteButton ? (
        <div className="ml-auto">{deleteButton}</div>
      ) : null}
    </div>
  );
}

export function TripDetail({
  trip,
  expanded,
  onToggle,
  onRefresh,
  onAddOrder,
}: TripDetailProps) {
  const [orders, setOrders] = React.useState<TripOrderRow[]>(trip.orders);
  const [busy, setBusy] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [dragIndex, setDragIndex] = React.useState<number | null>(null);

  React.useEffect(() => {
    setOrders(trip.orders);
  }, [trip.orders]);

  const totalBoxes = displayTripTotalBoxes({ totalBoxes: trip.totalBoxes, orders });
  const percent = capacityProgressPercent(totalBoxes, trip.maxBoxes);
  const canEdit = trip.status !== "completed";
  const canRemove = trip.status === "pending";
  const canStart = trip.status === "pending" && orders.length > 0;
  const canComplete = trip.status === "in_progress";
  const canDelete = true;

  const deleteButton = (
    <DeleteTripButton
      tripId={trip.id}
      tripNumber={trip.tripNumber}
      status={trip.status}
      orderCount={orders.length}
      onDeleted={onRefresh}
      disabled={busy != null}
    />
  );

  async function handleStart() {
    setBusy("start");
    setError(null);
    const res = await fetch(`/api/trips/${trip.id}/start`, { method: "POST" });
    const json = (await res.json()) as { error?: string };
    setBusy(null);
    if (!res.ok) {
      setError(json.error ?? "Αποτυχία εκκίνησης.");
      return;
    }
    onRefresh();
  }

  async function handleComplete() {
    setBusy("complete");
    setError(null);
    const res = await fetch(`/api/trips/${trip.id}/complete`, { method: "POST" });
    const json = (await res.json()) as { error?: string };
    setBusy(null);
    if (!res.ok) {
      setError(json.error ?? "Αποτυχία επιστροφής.");
      return;
    }
    onRefresh();
  }

  async function handleRemove(orderId: string) {
    if (!window.confirm("Αφαίρεση παραγγελίας από το δρομολόγιο;")) return;

    setBusy(`remove-${orderId}`);
    setError(null);
    const res = await fetch(`/api/trips/${trip.id}/orders/${orderId}`, {
      method: "DELETE",
    });
    const json = (await res.json()) as { error?: string };
    setBusy(null);
    if (!res.ok) {
      setError(json.error ?? "Αποτυχία αφαίρεσης.");
      return;
    }
    onRefresh();
  }

  async function persistOrder(newOrders: TripOrderRow[]) {
    setOrders(newOrders);
    const res = await fetch(`/api/trips/${trip.id}/reorder`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orderIds: newOrders.map((o) => o.id) }),
    });
    const json = (await res.json()) as { error?: string };
    if (!res.ok) {
      setError(json.error ?? "Αποτυχία αναδιάταξης.");
      setOrders(trip.orders);
      return;
    }
    onRefresh();
  }

  function handleDrop(targetIndex: number) {
    if (dragIndex == null || dragIndex === targetIndex || !canEdit) return;
    const next = [...orders];
    const [moved] = next.splice(dragIndex, 1);
    next.splice(targetIndex, 0, moved);
    setDragIndex(null);
    void persistOrder(next);
  }

  return (
    <div className="rounded-lg border border-border bg-white">
      <button
        type="button"
        className="flex w-full items-start justify-between gap-3 px-4 py-3 text-left"
        onClick={onToggle}
      >
        <div className="min-w-0 flex-1 space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-semibold text-navy-900">
              Δρομολόγιο #{trip.tripNumber}
            </span>
            <TripStatusBadge status={trip.status} />
          </div>
          <p className="flex items-center gap-1.5 text-sm text-gray-600">
            <Package className="size-4 shrink-0 text-gray-400" aria-hidden />
            {totalBoxes}/{trip.maxBoxes} κιβώτια · {orders.length}{" "}
            {orders.length === 1 ? "παράδοση" : "παραδόσεις"}
          </p>
          {orders.length === 0 ? (
            <p className="text-sm italic text-gray-400">Κενό δρομολόγιο</p>
          ) : null}
          <div className="h-2 max-w-xs overflow-hidden rounded-full bg-gray-100">
            <div
              className={cn("h-full transition-all", capacityBarClass(percent))}
              style={{ width: `${Math.min(percent, 100)}%` }}
            />
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {canDelete ? deleteButton : null}
          <span className="text-xs text-gray-400">{expanded ? "▲" : "▼"}</span>
        </div>
      </button>

      {!expanded ? (
        <TripActionBar
          canEdit={canEdit}
          canStart={canStart}
          canComplete={false}
          canDelete={canDelete}
          busy={busy}
          onAddOrder={onAddOrder}
          onStart={() => void handleStart()}
          onComplete={() => void handleComplete()}
          deleteButton={deleteButton}
        />
      ) : null}

      {expanded ? (
        <div className="space-y-4 border-t border-border px-4 py-4">
          {error ? (
            <p className="text-sm text-destructive" role="alert">
              {error}
            </p>
          ) : null}

          <div className="grid gap-2 text-sm sm:grid-cols-2">
            <p>
              <span className="text-gray-400">Οδηγός: </span>
              <span className="font-medium text-navy-900">{trip.driverName}</span>
            </p>
            <p>
              <span className="text-gray-400">Όχημα: </span>
              <span className="font-medium text-navy-900">
                {trip.vehiclePlate
                  ? formatVehicleLabel(trip.vehiclePlate, trip.vehicleModel)
                  : "—"}
              </span>
            </p>
            {trip.departedAt ? (
              <p>
                <span className="text-gray-400">Αναχώρηση: </span>
                {formatTimestamp(trip.departedAt)}
              </p>
            ) : null}
            {trip.returnedAt ? (
              <p>
                <span className="text-gray-400">Επιστροφή: </span>
                {formatTimestamp(trip.returnedAt)}
              </p>
            ) : null}
          </div>

          {orders.length === 0 ? (
            <p className="text-sm text-gray-400">
              Δεν υπάρχουν παραγγελίες στο δρομολόγιο.
            </p>
          ) : (
            <ul className="space-y-2">
              {orders.map((order, index) => (
                <li
                  key={order.id}
                  draggable={canEdit}
                  onDragStart={() => setDragIndex(index)}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={() => handleDrop(index)}
                  onDragEnd={() => setDragIndex(null)}
                  className={cn(
                    "flex items-start gap-2 rounded-lg border border-border bg-gray-50 px-3 py-2",
                    dragIndex === index && "opacity-60",
                  )}
                >
                  {canEdit ? (
                    <GripVertical
                      className="mt-0.5 size-4 shrink-0 cursor-grab text-gray-400"
                      aria-hidden
                    />
                  ) : null}
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xs font-semibold text-gray-400">
                        Στάση #{index + 1}
                      </span>
                      <Link
                        href={`/orders/${order.id}`}
                        className="font-mono font-semibold text-navy-900 hover:text-gold-500"
                      >
                        {order.orderNumber}
                      </Link>
                      <OrderStatusBadge status={normalizeOrderStatus(order.status)} />
                    </div>
                    <p className="text-sm text-navy-900">{order.customerName}</p>
                    <p className="text-xs text-gray-400">{order.address}</p>
                    <p className="mt-1 flex items-center gap-1 text-xs">
                      <Package className="size-3.5 shrink-0 text-gray-400" aria-hidden />
                      {order.boxesCount} κιβώτια
                    </p>
                  </div>
                  {canRemove ? (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="shrink-0 text-destructive"
                      disabled={busy != null}
                      aria-label="Αφαίρεση"
                      onClick={() => void handleRemove(order.id)}
                    >
                      <X className="size-4" />
                    </Button>
                  ) : null}
                </li>
              ))}
            </ul>
          )}

          <TripActionBar
            canEdit={canEdit}
            canStart={canStart}
            canComplete={canComplete}
            canDelete={canDelete}
            busy={busy}
            onAddOrder={onAddOrder}
            onStart={() => void handleStart()}
            onComplete={() => void handleComplete()}
            deleteButton={deleteButton}
          />
        </div>
      ) : null}
    </div>
  );
}
