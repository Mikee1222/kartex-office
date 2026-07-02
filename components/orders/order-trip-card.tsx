"use client";

import { GripVertical, Package } from "lucide-react";
import Link from "next/link";
import * as React from "react";

import { type OrderTripInfo } from "@/components/orders/order-detail-types";
import { TripStatusBadge } from "@/components/trips/trip-status-badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { formatDateEl } from "@/types/database";
import { cn } from "@/lib/utils";

type OrderTripCardProps = {
  trip: OrderTripInfo;
  currentOrderId: string;
  onUpdated: () => void;
};

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <p className="mt-0.5 text-sm text-foreground">{value}</p>
    </div>
  );
}

export function OrderTripCard({
  trip,
  currentOrderId,
  onUpdated,
}: OrderTripCardProps) {
  const [stops, setStops] = React.useState(trip.stops);
  const [dragIndex, setDragIndex] = React.useState<number | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [busy, setBusy] = React.useState(false);

  React.useEffect(() => {
    setStops(trip.stops);
  }, [trip.stops]);

  const tripDateLabel = formatDateEl(`${trip.tripDate}T12:00:00Z`);
  const tripsHref = `/trips?date=${encodeURIComponent(trip.tripDate)}&driver=${encodeURIComponent(trip.driverId)}&trip=${encodeURIComponent(trip.id)}`;
  const canReorder = trip.status !== "completed";

  async function persistOrder(nextStops: typeof stops) {
    setStops(nextStops);
    setBusy(true);
    setError(null);

    const res = await fetch(`/api/trips/${trip.id}/reorder`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orderIds: nextStops.map((stop) => stop.id) }),
    });
    const json = (await res.json()) as { error?: string };
    setBusy(false);

    if (!res.ok) {
      setError(json.error ?? "Αποτυχία αναδιάταξης.");
      setStops(trip.stops);
      return;
    }

    onUpdated();
  }

  function handleDrop(targetIndex: number) {
    if (dragIndex == null || dragIndex === targetIndex || !canReorder || busy) {
      return;
    }

    const next = [...stops];
    const [moved] = next.splice(dragIndex, 1);
    next.splice(targetIndex, 0, moved);
    setDragIndex(null);
    void persistOrder(next);
  }

  return (
    <Card className="border-border/80 shadow-sm print:hidden">
      <CardHeader>
        <div className="flex flex-wrap items-center gap-2">
          <CardTitle className="text-lg text-kartex-navy">Δρομολόγιο</CardTitle>
          <TripStatusBadge status={trip.status} />
        </div>
      </CardHeader>
      <CardContent className="space-y-4 text-sm">
        <p className="flex items-center gap-1.5 font-semibold text-kartex-navy">
          <Package className="size-4 shrink-0 text-muted-foreground" aria-hidden />
          Δρομολόγιο #{trip.tripNumber}
        </p>
        <InfoRow label="Οδηγός" value={trip.driverName} />
        <InfoRow label="Όχημα" value={trip.vehiclePlate?.trim() || "—"} />
        <InfoRow label="Ημερομηνία" value={tripDateLabel} />

        {error ? (
          <p className="text-sm text-destructive" role="alert">
            {error}
          </p>
        ) : null}

        {stops.length > 0 ? (
          <div className="space-y-2">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Στάσεις ({stops.length})
            </p>
            <ul className="space-y-2">
              {stops.map((stop, index) => {
                const isCurrent = stop.id === currentOrderId;
                return (
                  <li
                    key={stop.id}
                    draggable={canReorder && !busy}
                    onDragStart={() => setDragIndex(index)}
                    onDragOver={(event) => event.preventDefault()}
                    onDrop={() => handleDrop(index)}
                    onDragEnd={() => setDragIndex(null)}
                    className={cn(
                      "flex items-start gap-2 rounded-lg border px-3 py-2",
                      isCurrent
                        ? "border-kartex-gold/50 bg-kartex-gold/5"
                        : "border-border bg-gray-50",
                      dragIndex === index && "opacity-60",
                    )}
                  >
                    {canReorder ? (
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
                        {isCurrent ? (
                          <span className="rounded-full bg-kartex-gold/15 px-2 py-0.5 text-xs font-medium text-kartex-navy">
                            Αυτή η παραγγελία
                          </span>
                        ) : (
                          <Link
                            href={`/orders/${stop.id}`}
                            className="font-mono text-xs font-semibold text-navy-900 hover:text-gold-500"
                          >
                            {stop.orderNumber}
                          </Link>
                        )}
                      </div>
                      <p className="text-sm text-navy-900">{stop.customerName}</p>
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
        ) : null}

        <Link
          href={tripsHref}
          className="inline-block font-medium text-kartex-gold hover:underline"
        >
          Άνοιγμα στο Δρομολόγια →
        </Link>
      </CardContent>
    </Card>
  );
}
