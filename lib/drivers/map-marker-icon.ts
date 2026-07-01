/** Lucide Truck on circular badge (40×40). Nose points north at rotation 0. */
const MARKER_SIZE = 40;
const MARKER_ANCHOR = MARKER_SIZE / 2;
const CIRCLE_RADIUS = 18;
const LUCIDE_VIEWBOX = 24;

const CREAM = "#FFFEF9";
const NAVY = "#0A1628";
const GOLD = "#D4AF37";
const STALE_RING = "#94A3B8";
const STALE_ICON = "#64748B";

/** Truck scaled to ~60% of the circle diameter (lucide-react v0.468 paths). */
const TRUCK_SCALE = (CIRCLE_RADIUS * 2 * 0.6) / LUCIDE_VIEWBOX;

const TRUCK_PATHS = [
  "M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2",
  "M15 18H9",
  "M19 18h2a1 1 0 0 0 1-1v-3.65a1 1 0 0 0-.22-.624l-3.48-4.35A1 1 0 0 0 17.52 8H14",
] as const;

const TRUCK_WHEELS = [
  { cx: 17, cy: 18, r: 2 },
  { cx: 7, cy: 18, r: 2 },
] as const;

function buildTruckMarkerSvg(
  ringColor: string,
  iconColor: string,
  rotation: number,
): string {
  const cx = MARKER_ANCHOR;
  const cy = MARKER_ANCHOR;
  // Lucide truck faces east; −90° aligns nose with north before bearing is applied.
  const truckRotation = rotation - 90;
  const truckTransform = `translate(${cx}, ${cy}) rotate(${truckRotation}) scale(${TRUCK_SCALE}) translate(-12, -12)`;

  const paths = TRUCK_PATHS.map(
    (d) =>
      `<path d="${d}" fill="none" stroke="${iconColor}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>`,
  ).join("\n    ");

  const wheels = TRUCK_WHEELS.map(
    ({ cx: wx, cy: wy, r }) =>
      `<circle cx="${wx}" cy="${wy}" r="${r}" fill="none" stroke="${iconColor}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>`,
  ).join("\n    ");

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${MARKER_SIZE}" height="${MARKER_SIZE}" viewBox="0 0 40 40">
  <defs>
    <filter id="halo" x="-50%" y="-50%" width="200%" height="200%">
      <feDropShadow dx="0" dy="0" stdDeviation="2" flood-color="#FFFFFF" flood-opacity="0.85"/>
      <feDropShadow dx="0" dy="1" stdDeviation="1.5" flood-color="#000000" flood-opacity="0.25"/>
    </filter>
  </defs>
  <g filter="url(#halo)">
    <circle cx="${cx}" cy="${cy}" r="${CIRCLE_RADIUS}" fill="${CREAM}"/>
    <circle cx="${cx}" cy="${cy}" r="${CIRCLE_RADIUS}" fill="none" stroke="${ringColor}" stroke-width="1.5"/>
  </g>
  <g transform="${truckTransform}">
    ${paths}
    ${wheels}
  </g>
</svg>`;
}

export function createDriverMarkerIcon(
  stale: boolean,
  bearing?: number,
): google.maps.Icon {
  const ringColor = stale ? STALE_RING : GOLD;
  const iconColor = stale ? STALE_ICON : NAVY;
  const svg = buildTruckMarkerSvg(ringColor, iconColor, bearing ?? 0);

  return {
    url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`,
    scaledSize: new google.maps.Size(MARKER_SIZE, MARKER_SIZE),
    anchor: new google.maps.Point(MARKER_ANCHOR, MARKER_ANCHOR),
  };
}
