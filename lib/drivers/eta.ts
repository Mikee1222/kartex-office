import { haversineKm } from "@/lib/geo/haversine";

export type EtaSource = "matrix" | "estimate";

export type TripEta = {
  minutes: number;
  source: EtaSource;
};

/** Urban driving fallback when Distance Matrix is unavailable (~35 km/h). */
const FALLBACK_AVG_SPEED_KMH = 35;

type LatLng = { lat: number; lng: number };

export function estimateEtaMinutes(origin: LatLng, destination: LatLng): number {
  const km = haversineKm(origin.lat, origin.lng, destination.lat, destination.lng);
  const hours = km / FALLBACK_AVG_SPEED_KMH;
  return Math.max(1, Math.round(hours * 60));
}

export function formatEtaGreek(minutes: number): string {
  if (minutes < 1) return "Άφιξη σε <1 λεπτό";
  return `Άφιξη σε ~${minutes} ${minutes === 1 ? "λεπτό" : "λεπτά"}`;
}
