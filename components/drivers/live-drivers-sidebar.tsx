"use client";

import { AlertTriangle, MapPin, Radio } from "lucide-react";
import * as React from "react";

import {
  formatLocationAgeGreek,
  isLocationStale,
} from "@/lib/drivers/format-location-age";
import type { LiveDriverRow } from "@/lib/drivers/live-map-types";
import { cn } from "@/lib/utils";

type LiveDriversSidebarProps = {
  drivers: LiveDriverRow[];
  selectedTripId: string | null;
  onSelect: (tripId: string) => void;
  now: number;
};

export function LiveDriversSidebar({
  drivers,
  selectedTripId,
  onSelect,
  now,
}: LiveDriversSidebarProps) {
  if (drivers.length === 0) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3 p-6 text-center">
        <MapPin className="size-10 text-gray-400" aria-hidden />
        <p className="text-sm font-medium text-navy-900">
          Δεν υπάρχουν ενεργά δρομολόγια σήμερα
        </p>
        <p className="text-xs text-gray-400">
          Εμφανίζονται μόνο δρομολόγια σε εξέλιξη.
        </p>
      </div>
    );
  }

  return (
    <ul className="divide-y divide-gray-100 overflow-y-auto">
      {drivers.map((driver) => {
        const location = driver.location;
        const hasLocation = location != null;
        const stale =
          hasLocation && isLocationStale(location.recordedAt, now);
        const selected = selectedTripId === driver.tripId;

        return (
          <li key={driver.tripId}>
            <button
              type="button"
              onClick={() => onSelect(driver.tripId)}
              className={cn(
                "flex w-full flex-col gap-1.5 px-4 py-3.5 text-left transition-colors",
                selected
                  ? "bg-gold-500/10 ring-1 ring-inset ring-gold-500/30"
                  : "hover:bg-gray-50",
              )}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="truncate font-semibold text-navy-900">
                    {driver.driverName}
                  </p>
                  <p className="text-xs font-medium text-gray-400">
                    Δρομολόγιο #{driver.tripNumber}
                  </p>
                </div>
                {hasLocation ? (
                  <span
                    className={cn(
                      "inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide",
                      stale
                        ? "bg-gray-100 text-gray-500"
                        : "bg-emerald-50 text-emerald-700",
                    )}
                  >
                    {stale ? (
                      <AlertTriangle className="size-3" aria-hidden />
                    ) : (
                      <Radio className="size-3" aria-hidden />
                    )}
                    {stale ? "Παλιό" : "Live"}
                  </span>
                ) : null}
              </div>

              <p className="text-sm text-gray-600">
                {driver.stopsRemaining}{" "}
                {driver.stopsRemaining === 1 ? "στάση" : "στάσεις"} απομένουν
                {driver.totalStops > 0 ? ` / ${driver.totalStops}` : ""}
              </p>

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
                {hasLocation
                  ? formatLocationAgeGreek(location.recordedAt, now)
                  : "Δεν παρακολουθείται"}
              </p>
            </button>
          </li>
        );
      })}
    </ul>
  );
}
