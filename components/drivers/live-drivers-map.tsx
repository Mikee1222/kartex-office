"use client";

import * as React from "react";

import { bearingFromTrail } from "@/lib/drivers/compute-bearing";
import { isLocationStale } from "@/lib/drivers/format-location-age";
import type { TripEta } from "@/lib/drivers/eta";
import type { LiveDriverRow } from "@/lib/drivers/live-map-types";
import { createDriverMarkerIcon } from "@/lib/drivers/map-marker-icon";
import {
  buildDriverInfoWindowHtml,
  INFO_WINDOW_CONTAINER_STYLES,
} from "@/lib/drivers/map-info-window-html";
import { KARTEX_MAP_STYLES } from "@/lib/drivers/map-styles";
import { getGoogleMapsPublicKey } from "@/lib/env/google-maps";
import { loadGoogleMapsScript } from "@/lib/google-maps/load-maps-script";

const DEFAULT_CENTER = { lat: 37.9838, lng: 23.7275 };
const DEFAULT_ZOOM = 11;

type LiveDriversMapProps = {
  drivers: LiveDriverRow[];
  selectedTripId: string | null;
  onSelectTrip: (tripId: string) => void;
  mapsApiKey?: string | null;
  now: number;
  etas: Record<string, TripEta>;
};

function trailPath(
  trail: LiveDriverRow["locationTrail"],
): google.maps.LatLngLiteral[] {
  return trail.map((point) => ({ lat: point.lat, lng: point.lng }));
}

export function LiveDriversMap({
  drivers,
  selectedTripId,
  onSelectTrip,
  mapsApiKey,
  now,
  etas,
}: LiveDriversMapProps) {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const mapRef = React.useRef<google.maps.Map | null>(null);
  const markersRef = React.useRef<Map<string, google.maps.Marker>>(new Map());
  const polylinesRef = React.useRef<Map<string, google.maps.Polyline[]>>(new Map());
  const infoWindowRef = React.useRef<google.maps.InfoWindow | null>(null);
  const styleElRef = React.useRef<HTMLStyleElement | null>(null);
  const [mapError, setMapError] = React.useState<string | null>(null);
  const [mapReady, setMapReady] = React.useState(false);

  const apiKey = mapsApiKey ?? getGoogleMapsPublicKey() ?? null;

  const trackedDrivers = React.useMemo(
    () => drivers.filter((driver) => driver.location != null),
    [drivers],
  );

  React.useEffect(() => {
    if (!apiKey) {
      setMapError("Λείπει το NEXT_PUBLIC_GOOGLE_MAPS_API_KEY στο .env.local.");
      return;
    }

    let cancelled = false;

    void loadGoogleMapsScript(apiKey)
      .then(() => {
        if (cancelled || !containerRef.current || mapRef.current) return;

        mapRef.current = new google.maps.Map(containerRef.current, {
          center: DEFAULT_CENTER,
          zoom: DEFAULT_ZOOM,
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: true,
          styles: KARTEX_MAP_STYLES,
        });

        infoWindowRef.current = new google.maps.InfoWindow();

        const styleEl = document.createElement("style");
        styleEl.textContent = INFO_WINDOW_CONTAINER_STYLES;
        document.head.appendChild(styleEl);
        styleElRef.current = styleEl;

        setMapReady(true);
      })
      .catch((error: unknown) => {
        setMapError(
          error instanceof Error ? error.message : "Αποτυχία φόρτωσης χάρτη.",
        );
      });

    return () => {
      cancelled = true;
      markersRef.current.forEach((marker) => marker.setMap(null));
      markersRef.current.clear();
      polylinesRef.current.forEach((segments) => {
        segments.forEach((line) => line.setMap(null));
      });
      polylinesRef.current.clear();
      mapRef.current = null;
      infoWindowRef.current = null;
      styleElRef.current?.remove();
      styleElRef.current = null;
      setMapReady(false);
    };
  }, [apiKey]);

  React.useEffect(() => {
    const map = mapRef.current;
    if (!mapReady || !map) return;

    const activeTripIds = new Set(trackedDrivers.map((driver) => driver.tripId));

    for (const [tripId, marker] of markersRef.current.entries()) {
      if (!activeTripIds.has(tripId)) {
        marker.setMap(null);
        markersRef.current.delete(tripId);
      }
    }

    for (const [tripId, segments] of polylinesRef.current.entries()) {
      if (!activeTripIds.has(tripId)) {
        segments.forEach((line) => line.setMap(null));
        polylinesRef.current.delete(tripId);
      }
    }

    const bounds = new google.maps.LatLngBounds();
    let hasBounds = false;

    for (const driver of trackedDrivers) {
      const loc = driver.location!;
      const stale = isLocationStale(loc.recordedAt, now);
      const position = { lat: loc.lat, lng: loc.lng };
      const bearing = bearingFromTrail(driver.locationTrail);

      let marker = markersRef.current.get(driver.tripId);
      if (!marker) {
        marker = new google.maps.Marker({
          map,
          position,
          title: driver.driverName,
          icon: createDriverMarkerIcon(stale, bearing),
        });
        marker.addListener("click", () => {
          onSelectTrip(driver.tripId);
        });
        markersRef.current.set(driver.tripId, marker);
      } else {
        marker.setPosition(position);
        marker.setIcon(createDriverMarkerIcon(stale, bearing));
        marker.setTitle(driver.driverName);
      }

      updateTrailPolylines(map, driver, polylinesRef.current);

      bounds.extend(position);
      hasBounds = true;
    }

    if (hasBounds && !selectedTripId) {
      map.fitBounds(bounds);
    }
  }, [trackedDrivers, mapReady, onSelectTrip, now, selectedTripId]);

  React.useEffect(() => {
    const map = mapRef.current;
    if (!mapReady || !map || !selectedTripId) return;

    const driver = trackedDrivers.find((row) => row.tripId === selectedTripId);
    if (!driver?.location) return;

    map.panTo({ lat: driver.location.lat, lng: driver.location.lng });
    map.setZoom(14);

    const marker = markersRef.current.get(selectedTripId);
    const infoWindow = infoWindowRef.current;
    if (marker && infoWindow) {
      infoWindow.setContent(
        buildDriverInfoWindowHtml(driver, now, etas[selectedTripId] ?? null),
      );
      infoWindow.open(map, marker);
    }
  }, [selectedTripId, trackedDrivers, mapReady, now, etas]);

  if (mapError) {
    return (
      <div className="flex h-full min-h-[420px] items-center justify-center rounded-2xl border border-warning/30 bg-warning/5 p-6 text-center">
        <p className="max-w-md text-sm text-navy-900">{mapError}</p>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="h-full min-h-[420px] w-full rounded-2xl border border-gray-200/80 bg-gray-100 shadow-card"
      aria-label="Χάρτης ζωντανής παρακολούθησης οδηγών"
    />
  );
}

/** Three-segment polyline with fading opacity toward the tail. */
function updateTrailPolylines(
  map: google.maps.Map,
  driver: LiveDriverRow,
  polylinesRef: Map<string, google.maps.Polyline[]>,
): void {
  const path = trailPath(driver.locationTrail);
  const existing = polylinesRef.get(driver.tripId) ?? [];
  existing.forEach((line) => line.setMap(null));

  if (path.length < 2) {
    polylinesRef.set(driver.tripId, []);
    return;
  }

  const third = Math.max(1, Math.floor(path.length / 3));
  const segments: google.maps.Polyline[] = [];

  const ranges = [
    { start: 0, end: third, opacity: 0.25, color: "#0A1628" },
    { start: third, end: third * 2, opacity: 0.45, color: "#0A1628" },
    { start: third * 2, end: path.length, opacity: 0.75, color: "#D4AF37" },
  ];

  for (const range of ranges) {
    if (range.end - range.start < 2) continue;
    const segmentPath = path.slice(range.start, range.end);
    segments.push(
      new google.maps.Polyline({
        map,
        path: segmentPath,
        strokeColor: range.color,
        strokeOpacity: range.opacity,
        strokeWeight: 2.5,
        geodesic: true,
        zIndex: 1,
      }),
    );
  }

  polylinesRef.set(driver.tripId, segments);
}
