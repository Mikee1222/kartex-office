"use client";

import { AlertTriangle, MapPin, Radio } from "lucide-react";
import * as React from "react";

import { driverInitials } from "@/lib/drivers/driver-initials";
import {
  formatLocationAgeGreek,
  isLocationStale,
} from "@/lib/drivers/format-location-age";
import { formatEtaGreek, type TripEta } from "@/lib/drivers/eta";
import type { LiveDriverRow } from "@/lib/drivers/live-map-types";
import { cn } from "@/lib/utils";

type LiveDriversSidebarProps = {
  drivers: LiveDriverRow[];
  selectedTripId: string | null;
  onSelect: (tripId: string) => void;
  now: number;
  etas: Record<string, TripEta>;
  streetNames: Record<string, string>;
};

function LiveStatusPill({ stale }: { stale: boolean }) {
  if (stale) {
    return (
      <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-amber-700">
        <AlertTriangle className="size-3" aria-hidden />
        Παλιό
      </span>
    );
  }

  return (
    <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-emerald-700">
      <span className="relative flex size-2">
        <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-400 opacity-60" />
        <span className="relative inline-flex size-2 rounded-full bg-emerald-500" />
      </span>
      Live
    </span>
  );
}

export function LiveDriversSidebar({
  drivers,
  selectedTripId,
  onSelect,
  now,
  etas,
  streetNames,
}: LiveDriversSidebarProps) {
  if (drivers.length === 0) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-4 p-8 text-center">
        <span className="flex size-14 items-center justify-center rounded-full bg-gold-500/10 text-gold-500">
          <MapPin className="size-7" aria-hidden />
        </span>
        <div>
          <p className="text-sm font-semibold text-navy-900">
            Κανένας οδηγός σε δρόμο αυτή τη στιγμή
          </p>
          <p className="mt-1 text-xs text-gray-400">
            Εμφανίζονται μόνο δρομολόγια σε εξέλιξη.
          </p>
        </div>
      </div>
    );
  }

  return (
    <ul className="flex flex-col gap-2 overflow-y-auto p-3">
      {drivers.map((driver) => {
        const location = driver.location;
        const hasLocation = location != null;
        const stale =
          hasLocation && isLocationStale(location.recordedAt, now);
        const selected = selectedTripId === driver.tripId;
        const eta = hasLocation ? etas[driver.tripId] : null;
        const street = streetNames[driver.tripId];

        return (
          <li key={driver.tripId}>
            <button
              type="button"
              onClick={() => onSelect(driver.tripId)}
              className={cn(
                "group flex w-full flex-col gap-3 rounded-xl border bg-white p-4 text-left shadow-sm transition-all duration-200",
                selected
                  ? "border-gold-500/50 border-l-[3px] border-t-[3px] border-l-gold-500 border-t-gold-500 shadow-md ring-1 ring-gold-500/20"
                  : "border-gray-200/80 hover:border-gold-500/25 hover:bg-gold-500/[0.03] hover:shadow-md",
              )}
            >
              <div className="flex items-start gap-3">
                <span
                  className={cn(
                    "flex size-10 shrink-0 items-center justify-center rounded-full text-sm font-bold transition-colors",
                    selected
                      ? "bg-gold-500/15 text-navy-900"
                      : "bg-navy-900/5 text-navy-900 group-hover:bg-gold-500/10",
                  )}
                >
                  {driverInitials(driver.driverName)}
                </span>

                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <p className="truncate text-[15px] font-semibold leading-tight text-navy-900">
                      {driver.driverName}
                    </p>
                    {hasLocation ? <LiveStatusPill stale={stale} /> : null}
                  </div>

                  {street ? (
                    <p className="mt-0.5 truncate text-xs text-gray-500">
                      {street}
                    </p>
                  ) : hasLocation ? (
                    <p className="mt-0.5 text-xs italic text-gray-300">
                      Εντοπισμός θέσης…
                    </p>
                  ) : null}
                </div>
              </div>

              <div className="space-y-1 pl-[52px]">
                <p className="text-xs font-medium text-gray-400">
                  Δρομολόγιο #{driver.tripNumber}
                </p>

                <p className="text-sm text-gray-600">
                  {driver.stopsRemaining}{" "}
                  {driver.stopsRemaining === 1 ? "στάση" : "στάσεις"} απομένουν
                  {driver.totalStops > 0 ? (
                    <span className="text-gray-400"> / {driver.totalStops}</span>
                  ) : null}
                </p>

                {eta ? (
                  <p className="text-sm font-semibold text-navy-900">
                    {formatEtaGreek(eta.minutes)}
                  </p>
                ) : null}

                <p
                  className={cn(
                    "text-xs",
                    hasLocation
                      ? stale
                        ? "font-medium text-warning"
                        : "text-gray-400"
                      : "italic text-gray-400",
                  )}
                >
                  {hasLocation ? (
                    <>
                      <Radio className="mr-1 inline size-3 -translate-y-px opacity-60" aria-hidden />
                      {formatLocationAgeGreek(location.recordedAt, now)}
                    </>
                  ) : (
                    "Δεν παρακολουθείται"
                  )}
                </p>
              </div>
            </button>
          </li>
        );
      })}
    </ul>
  );
}
