"use client";

import * as React from "react";

import {
  formatLocationAgeGreek,
  isLocationStale,
} from "@/lib/drivers/format-location-age";
import type { LiveDriverRow } from "@/lib/drivers/live-map-types";
import { getGoogleMapsPublicKey } from "@/lib/env/google-maps";
import { loadGoogleMapsScript } from "@/lib/google-maps/load-maps-script";

const DEFAULT_CENTER = { lat: 37.9838, lng: 23.7275 };
const DEFAULT_ZOOM = 11;

const MAP_STYLES: google.maps.MapTypeStyle[] = [
  { featureType: "poi", elementType: "labels", stylers: [{ visibility: "off" }] },
];

type LiveDriversMapProps = {
  drivers: LiveDriverRow[];
  selectedTripId: string | null;
  onSelectTrip: (tripId: string) => void;
  mapsApiKey?: string | null;
  now: number;
};

function markerIcon(stale: boolean): google.maps.Symbol {
  return {
    path: google.maps.SymbolPath.CIRCLE,
    fillColor: stale ? "#94A3B8" : "#D4AF37",
    fillOpacity: 1,
    strokeColor: stale ? "#64748B" : "#0A1628",
    strokeWeight: stale ? 1 : 2,
    scale: stale ? 8 : 10,
  };
}

export function LiveDriversMap({
  drivers,
  selectedTripId,
  onSelectTrip,
  mapsApiKey,
  now,
}: LiveDriversMapProps) {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const mapRef = React.useRef<google.maps.Map | null>(null);
  const markersRef = React.useRef<Map<string, google.maps.Marker>>(new Map());
  const infoWindowRef = React.useRef<google.maps.InfoWindow | null>(null);
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
          styles: MAP_STYLES,
        });

        infoWindowRef.current = new google.maps.InfoWindow();
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
      mapRef.current = null;
      infoWindowRef.current = null;
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

    const bounds = new google.maps.LatLngBounds();
    let hasBounds = false;

    for (const driver of trackedDrivers) {
      const loc = driver.location!;
      const stale = isLocationStale(loc.recordedAt, now);
      const position = { lat: loc.lat, lng: loc.lng };

      let marker = markersRef.current.get(driver.tripId);
      if (!marker) {
        marker = new google.maps.Marker({
          map,
          position,
          title: driver.driverName,
          icon: markerIcon(stale),
        });
        marker.addListener("click", () => {
          onSelectTrip(driver.tripId);
        });
        markersRef.current.set(driver.tripId, marker);
      } else {
        marker.setPosition(position);
        marker.setIcon(markerIcon(stale));
        marker.setTitle(driver.driverName);
      }

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
      const stale = isLocationStale(driver.location.recordedAt, now);
      const age = formatLocationAgeGreek(driver.location.recordedAt, now);
      infoWindow.setContent(
        `<div style="font-family:Inter,sans-serif;padding:4px 2px;min-width:140px">
          <div style="font-weight:600;color:#0A1628;margin-bottom:4px">${driver.driverName}</div>
          <div style="font-size:12px;color:${stale ? "#F59E0B" : "#475569"}">${age}${stale ? " · καθυστέρηση" : ""}</div>
          <div style="font-size:12px;color:#64748B;margin-top:2px">Δρομολόγιο #${driver.tripNumber}</div>
        </div>`,
      );
      infoWindow.open(map, marker);
    }
  }, [selectedTripId, trackedDrivers, mapReady, now]);

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
