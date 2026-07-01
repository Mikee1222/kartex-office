/** Delivery van silhouette (24×24 viewBox), nose points up (north) at rotation 0. */
const TRUCK_PATH =
  "M4 17h1.5c0 1.1.9 2 2 2s2-.9 2-2h5c0 1.1.9 2 2 2s2-.9 2-2H19V9h-2.5L14 5H8v12H4zm3-10h4.5l1.5 3H7V7zm8 8.5c-.8 0-1.5-.7-1.5-1.5s.7-1.5 1.5-1.5 1.5.7 1.5 1.5-.7 1.5-1.5 1.5zm-9 0c-.8 0-1.5-.7-1.5-1.5S8.7 12.5 9.5 12.5 11 13.2 11 14s-.7 1.5-1.5 1.5z";

const NAVY = "#0A1628";
const GOLD = "#D4AF37";
const STALE_FILL = "#94A3B8";
const STALE_STROKE = "#64748B";

export function createDriverMarkerIcon(
  stale: boolean,
  bearing?: number,
): google.maps.Symbol {
  return {
    path: TRUCK_PATH,
    fillColor: stale ? STALE_FILL : NAVY,
    fillOpacity: 1,
    strokeColor: stale ? STALE_STROKE : GOLD,
    strokeWeight: stale ? 1.5 : 2,
    scale: 1.35,
    rotation: bearing ?? 0,
    anchor: new google.maps.Point(12, 12),
  };
}
