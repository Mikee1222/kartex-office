/** Side-profile delivery van (40×40 viewBox), nose points up (north) at rotation 0. */
const MARKER_SIZE = 40;
const MARKER_ANCHOR = MARKER_SIZE / 2;

const NAVY = "#0A1628";
const GOLD = "#D4AF37";
const STALE_FILL = "#94A3B8";
const STALE_STROKE = "#64748B";

function buildVanMarkerSvg(
  fill: string,
  stroke: string,
  strokeWidth: number,
  rotation: number,
): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${MARKER_SIZE}" height="${MARKER_SIZE}" viewBox="0 0 40 40">
  <defs>
    <filter id="halo" x="-40%" y="-40%" width="180%" height="180%">
      <feDropShadow dx="0" dy="0" stdDeviation="2" flood-color="#FFFFFF" flood-opacity="0.9"/>
      <feDropShadow dx="0" dy="1" stdDeviation="1.2" flood-color="#000000" flood-opacity="0.3"/>
    </filter>
  </defs>
  <g transform="rotate(${rotation}, ${MARKER_ANCHOR}, ${MARKER_ANCHOR})" filter="url(#halo)">
    <ellipse cx="${MARKER_ANCHOR}" cy="${MARKER_ANCHOR}" rx="14" ry="15" fill="#FFFFFF" opacity="0.35"/>
    <path
      d="M16 25 L11 25 L11 16 L15 16 L15 10 L25 10 L25 16 L29 16 L29 25 Z"
      fill="${fill}"
      stroke="${stroke}"
      stroke-width="${strokeWidth}"
      stroke-linejoin="round"
    />
    <line x1="${MARKER_ANCHOR}" y1="10" x2="${MARKER_ANCHOR}" y2="16" stroke="${stroke}" stroke-width="1" opacity="0.55"/>
    <circle cx="14" cy="27" r="2.8" fill="${fill}" stroke="${stroke}" stroke-width="1.2"/>
    <circle cx="26" cy="27" r="2.8" fill="${fill}" stroke="${stroke}" stroke-width="1.2"/>
  </g>
</svg>`;
}

export function createDriverMarkerIcon(
  stale: boolean,
  bearing?: number,
): google.maps.Icon {
  const fill = stale ? STALE_FILL : NAVY;
  const stroke = stale ? STALE_STROKE : GOLD;
  const strokeWidth = stale ? 1.5 : 1.8;
  const svg = buildVanMarkerSvg(fill, stroke, strokeWidth, bearing ?? 0);

  return {
    url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`,
    scaledSize: new google.maps.Size(MARKER_SIZE, MARKER_SIZE),
    anchor: new google.maps.Point(MARKER_ANCHOR, MARKER_ANCHOR),
  };
}
