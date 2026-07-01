"use client";

import { MapPin, Radio, RefreshCw } from "lucide-react";
import * as React from "react";

import { DataError } from "@/components/dashboard/data-error";
import { EmptyState } from "@/components/dashboard/empty-state";
import { LiveDriversMap } from "@/components/drivers/live-drivers-map";
import { LiveDriversSidebar } from "@/components/drivers/live-drivers-sidebar";
import { PageHeader } from "@/components/ui/page-header";
import { Skeleton } from "@/components/ui/skeleton";
import type { LiveDriverRow } from "@/lib/drivers/live-map-types";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

function mergeLocationUpdate(
  drivers: LiveDriverRow[],
  payload: {
    trip_id: string | null;
    driver_id: string;
    lat: number;
    lng: number;
    recorded_at: string;
  },
): LiveDriverRow[] {
  if (!payload.trip_id) return drivers;

  return drivers.map((driver) => {
    if (driver.tripId !== payload.trip_id) return driver;
    return {
      ...driver,
      location: {
        lat: payload.lat,
        lng: payload.lng,
        recordedAt: payload.recorded_at,
      },
    };
  });
}

export function LiveDriversView() {
  const [drivers, setDrivers] = React.useState<LiveDriverRow[]>([]);
  const [today, setToday] = React.useState("");
  const [mapsApiKey, setMapsApiKey] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [selectedTripId, setSelectedTripId] = React.useState<string | null>(null);
  const [isLive, setIsLive] = React.useState(false);
  const [now, setNow] = React.useState(() => Date.now());

  const load = React.useCallback(async () => {
    setLoading(true);
    setError(null);

    const res = await fetch("/api/drivers/live");
    const json = (await res.json()) as {
      drivers?: LiveDriverRow[];
      today?: string;
      mapsApiKey?: string | null;
      error?: string;
    };

    if (!res.ok) {
      setError(json.error ?? "Αποτυχία φόρτωσης.");
      setDrivers([]);
    } else {
      setDrivers(json.drivers ?? []);
      setToday(json.today ?? "");
      setMapsApiKey(json.mapsApiKey ?? null);
    }

    setLoading(false);
  }, []);

  React.useEffect(() => {
    void load();
  }, [load]);

  React.useEffect(() => {
    const interval = window.setInterval(() => {
      setNow(Date.now());
    }, 15_000);
    return () => window.clearInterval(interval);
  }, []);

  React.useEffect(() => {
    const supabase = createClient();
    setIsLive(false);

    const channel = supabase
      .channel("live-driver-locations")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "driver_locations",
        },
        (payload) => {
          const row = payload.new as {
            trip_id: string | null;
            driver_id: string;
            lat: number;
            lng: number;
            recorded_at: string;
          };

          setDrivers((current) => mergeLocationUpdate(current, row));
          setNow(Date.now());
        },
      )
      .subscribe((status) => {
        if (status === "SUBSCRIBED") {
          setIsLive(true);
        }
      });

    return () => {
      void supabase.removeChannel(channel);
    };
  }, []);

  const subtitle = today
    ? `Ενεργά δρομολόγια σήμερα (${today}) — ${drivers.length} ${drivers.length === 1 ? "οδηγός" : "οδηγοί"}`
    : "Ζωντανή θέση οδηγών σε δρομολόγια που βρίσκονται σε εξέλιξη.";

  return (
    <div className="flex h-[calc(100vh-7rem)] min-h-[560px] flex-col gap-4">
      <PageHeader
        title="Ζωντανή Παρακολούθηση"
        subtitle={subtitle}
        action={
          <div className="flex items-center gap-3">
            <span
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium",
                isLive
                  ? "bg-emerald-50 text-emerald-700"
                  : "bg-gray-100 text-gray-500",
              )}
            >
              <Radio className={cn("size-3.5", isLive && "animate-pulse")} />
              {isLive ? "Live" : "Σύνδεση…"}
            </span>
            <button
              type="button"
              onClick={() => void load()}
              className="inline-flex items-center gap-1.5 rounded-lg border border-navy-900/10 px-3 py-2 text-sm font-medium text-navy-900 transition-colors hover:bg-gray-50"
            >
              <RefreshCw className="size-4" />
              Ανανέωση
            </button>
          </div>
        }
      />

      {error ? <DataError message={error} onRetry={() => void load()} /> : null}

      {loading ? (
        <div className="grid flex-1 gap-4 lg:grid-cols-[320px_1fr]">
          <Skeleton className="h-full min-h-[420px] rounded-2xl" />
          <Skeleton className="h-full min-h-[420px] rounded-2xl" />
        </div>
      ) : drivers.length === 0 ? (
        <EmptyState
          icon={MapPin}
          title="Δεν υπάρχουν ενεργά δρομολόγια"
          description="Όταν ένας οδηγός ξεκινήσει δρομολόγιο σήμερα, θα εμφανιστεί εδώ."
        />
      ) : (
        <div className="grid min-h-0 flex-1 gap-4 lg:grid-cols-[320px_1fr]">
          <aside className="flex min-h-0 flex-col overflow-hidden rounded-2xl border border-gray-200/80 bg-white shadow-card">
            <div className="border-b border-gray-100 px-4 py-3">
              <h2 className="text-sm font-semibold text-navy-900">Οδηγοί σε δρόμο</h2>
              <p className="text-xs text-gray-400">Κλικ για εστίαση στον χάρτη</p>
            </div>
            <LiveDriversSidebar
              drivers={drivers}
              selectedTripId={selectedTripId}
              onSelect={setSelectedTripId}
              now={now}
            />
          </aside>

          <div className="min-h-0">
            <LiveDriversMap
              drivers={drivers}
              selectedTripId={selectedTripId}
              onSelectTrip={setSelectedTripId}
              mapsApiKey={mapsApiKey}
              now={now}
            />
          </div>
        </div>
      )}
    </div>
  );
}
