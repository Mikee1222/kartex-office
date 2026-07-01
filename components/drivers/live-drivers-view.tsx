"use client";

import { MapPin, Radio, RefreshCw, Truck } from "lucide-react";
import * as React from "react";

import { DataError } from "@/components/dashboard/data-error";
import { EmptyState } from "@/components/dashboard/empty-state";
import { LiveDriversMap } from "@/components/drivers/live-drivers-map";
import { LiveDriversSidebar } from "@/components/drivers/live-drivers-sidebar";
import { PageHeader } from "@/components/ui/page-header";
import { Skeleton } from "@/components/ui/skeleton";
import type { TripEta } from "@/lib/drivers/eta";
import type { LiveDriverRow } from "@/lib/drivers/live-map-types";
import { appendLocationTrail } from "@/lib/drivers/location-trail";
import { useDriverStreetNames } from "@/lib/drivers/use-driver-street-names";
import {
  buildEtaRequests,
  ETA_REFRESH_MS,
  fetchTripEtas,
} from "@/lib/drivers/use-live-etas";
import { premiumPageSubtitle } from "@/lib/ui/premium-styles";
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
  now: number,
): LiveDriverRow[] {
  if (!payload.trip_id) return drivers;

  const point = {
    lat: payload.lat,
    lng: payload.lng,
    recordedAt: payload.recorded_at,
  };

  return drivers.map((driver) => {
    if (driver.tripId !== payload.trip_id) return driver;
    return {
      ...driver,
      location: point,
      locationTrail: appendLocationTrail(driver.locationTrail, point, now),
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
  const [refreshing, setRefreshing] = React.useState(false);
  const [now, setNow] = React.useState(() => Date.now());
  const [etas, setEtas] = React.useState<Record<string, TripEta>>({});
  const etaLastFetchRef = React.useRef<Map<string, number>>(new Map());
  const etaInFlightRef = React.useRef(false);

  const streetNames = useDriverStreetNames(drivers);

  const refreshEtas = React.useCallback(
    async (driverRows: LiveDriverRow[], forceTripIds?: Set<string>) => {
      const requests = buildEtaRequests(driverRows).filter((req) => {
        if (forceTripIds?.has(req.tripId)) return true;
        const last = etaLastFetchRef.current.get(req.tripId) ?? 0;
        return Date.now() - last >= ETA_REFRESH_MS;
      });

      if (requests.length === 0 || etaInFlightRef.current) return;

      etaInFlightRef.current = true;
      try {
        const next = await fetchTripEtas(requests);
        const fetchedAt = Date.now();
        for (const req of requests) {
          etaLastFetchRef.current.set(req.tripId, fetchedAt);
        }
        if (Object.keys(next).length > 0) {
          setEtas((current) => ({ ...current, ...next }));
        }
      } finally {
        etaInFlightRef.current = false;
      }
    },
    [],
  );

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
      const rows = json.drivers ?? [];
      setDrivers(rows);
      setToday(json.today ?? "");
      setMapsApiKey(json.mapsApiKey ?? null);
      void refreshEtas(rows);
    }

    setLoading(false);
  }, [refreshEtas]);

  const handleRefresh = React.useCallback(async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }, [load]);

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

          const ts = Date.now();
          setDrivers((current) => {
            const next = mergeLocationUpdate(current, row, ts);
            if (row.trip_id) {
              void refreshEtas(next, new Set([row.trip_id]));
            }
            return next;
          });
          setNow(ts);
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
  }, [refreshEtas]);

  const subtitle = today
    ? `Ενεργά δρομολόγια σήμερα (${today}) — ${drivers.length} ${drivers.length === 1 ? "οδηγός" : "οδηγοί"}`
    : "Ζωντανή θέση οδηγών σε δρομολόγια που βρίσκονται σε εξέλιξη.";

  return (
    <div className="flex h-[calc(100vh-7rem)] min-h-[560px] flex-col gap-6">
      <PageHeader
        title="Ζωντανή Παρακολούθηση"
        subtitle={
          <span className={cn(premiumPageSubtitle, "inline-flex items-center gap-1.5")}>
            <Truck className="size-3.5 shrink-0 text-gold-500/70" aria-hidden />
            {subtitle}
          </span>
        }
        action={
          <div className="flex items-center gap-3">
            <span
              className={cn(
                "inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors",
                isLive
                  ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                  : "border-gray-200 bg-gray-50 text-gray-500",
              )}
            >
              {isLive ? (
                <span className="relative flex size-2">
                  <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-400 opacity-60" />
                  <span className="relative inline-flex size-2 rounded-full bg-emerald-500" />
                </span>
              ) : (
                <Radio className="size-3.5 animate-pulse" aria-hidden />
              )}
              {isLive ? "Live" : "Σύνδεση…"}
            </span>
            <button
              type="button"
              onClick={() => void handleRefresh()}
              disabled={refreshing}
              className={cn(
                "inline-flex items-center gap-2 rounded-lg border border-gold-500/30 bg-white px-4 py-2.5 text-sm font-semibold text-navy-900 shadow-sm transition-all duration-200",
                "hover:border-gold-500/50 hover:bg-gold-500/[0.04] hover:shadow-md",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-500/40",
                "disabled:pointer-events-none disabled:opacity-60",
              )}
            >
              <RefreshCw
                className={cn("size-4 text-gold-500", refreshing && "animate-spin")}
                aria-hidden
              />
              Ανανέωση
            </button>
          </div>
        }
      />

      {error ? <DataError message={error} onRetry={() => void load()} /> : null}

      {loading ? (
        <div className="grid flex-1 gap-5 lg:grid-cols-[340px_1fr]">
          <Skeleton className="h-full min-h-[420px] rounded-2xl" />
          <Skeleton className="h-full min-h-[420px] rounded-2xl" />
        </div>
      ) : drivers.length === 0 ? (
        <EmptyState
          icon={MapPin}
          title="Κανένας οδηγός σε δρόμο αυτή τη στιγμή"
          description="Όταν ένας οδηγός ξεκινήσει δρομολόγιο σήμερα, θα εμφανιστεί εδώ με ζωντανή θέση στον χάρτη."
        />
      ) : (
        <div className="grid min-h-0 flex-1 gap-5 lg:grid-cols-[340px_1fr]">
          <aside className="flex min-h-0 flex-col overflow-hidden rounded-2xl border border-gray-200/80 bg-gray-50/50 shadow-[0_4px_24px_rgba(10,22,40,0.06)]">
            <div className="border-b border-gray-200/60 bg-white px-5 py-4">
              <h2 className="text-sm font-semibold text-navy-900">Οδηγοί σε δρόμο</h2>
              <p className="mt-0.5 text-xs text-gray-400">Κλικ για εστίαση στον χάρτη</p>
            </div>
            <LiveDriversSidebar
              drivers={drivers}
              selectedTripId={selectedTripId}
              onSelect={setSelectedTripId}
              now={now}
              etas={etas}
              streetNames={streetNames}
            />
          </aside>

          <div className="min-h-0">
            <LiveDriversMap
              drivers={drivers}
              selectedTripId={selectedTripId}
              onSelectTrip={setSelectedTripId}
              mapsApiKey={mapsApiKey}
              now={now}
              etas={etas}
              streetNames={streetNames}
            />
          </div>
        </div>
      )}
    </div>
  );
}
