import {
  formatLocationAgeGreek,
  isLocationStale,
} from "@/lib/drivers/format-location-age";
import { formatEtaGreek } from "@/lib/drivers/eta";
import type { LiveDriverRow } from "@/lib/drivers/live-map-types";
import type { TripEta } from "@/lib/drivers/eta";

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function livePillHtml(stale: boolean): string {
  if (stale) {
    return `<span style="display:inline-flex;align-items:center;gap:4px;border-radius:9999px;background:#FFFBEB;border:1px solid #FDE68A;padding:2px 8px;font-size:10px;font-weight:700;letter-spacing:0.04em;text-transform:uppercase;color:#B45309">
      <span style="width:6px;height:6px;border-radius:9999px;background:#F59E0B"></span>
      Παλιό
    </span>`;
  }

  return `<span style="display:inline-flex;align-items:center;gap:4px;border-radius:9999px;background:#ECFDF5;border:1px solid #A7F3D0;padding:2px 8px;font-size:10px;font-weight:700;letter-spacing:0.04em;text-transform:uppercase;color:#047857">
    <span style="width:6px;height:6px;border-radius:9999px;background:#10B981;box-shadow:0 0 0 2px rgba(16,185,129,0.25);animation:pulse 2s cubic-bezier(0.4,0,0.6,1) infinite"></span>
    Live
  </span>`;
}

export function buildDriverInfoWindowHtml(
  driver: LiveDriverRow,
  now: number,
  eta: TripEta | null,
  streetName?: string | null,
): string {
  const loc = driver.location;
  if (!loc) return "";

  const stale = isLocationStale(loc.recordedAt, now);
  const age = formatLocationAgeGreek(loc.recordedAt, now);
  const stopsLabel =
    driver.stopsRemaining === 1
      ? "1 στάση απομένει"
      : `${driver.stopsRemaining} στάσεις απομένουν`;

  const streetHtml = streetName
    ? `<div style="font-size:12px;color:#64748B;margin-top:2px;margin-bottom:8px">${escapeHtml(streetName)}</div>`
    : "";

  const etaHtml = eta
    ? `<div style="margin-top:10px;padding-top:10px;border-top:1px solid rgba(212,175,55,0.35);font-size:13px;font-weight:600;color:#0A1628">${escapeHtml(formatEtaGreek(eta.minutes))}</div>`
    : driver.nextStop
      ? `<div style="margin-top:8px;font-size:12px;color:#94A3B8">Υπολογισμός ETA…</div>`
      : "";

  return `<div style="font-family:Inter,system-ui,sans-serif;min-width:200px;max-width:260px;padding:2px 0">
    <div style="display:flex;align-items:flex-start;justify-content:space-between;gap:8px;margin-bottom:4px">
      <div style="font-weight:700;font-size:15px;color:#0A1628;line-height:1.3">${escapeHtml(driver.driverName)}</div>
      ${livePillHtml(stale)}
    </div>
    ${streetHtml}
    <div style="font-size:12px;font-weight:500;color:#94A3B8;margin-bottom:6px">Δρομολόγιο #${driver.tripNumber}</div>
    <div style="font-size:13px;color:#475569;margin-bottom:4px">${stopsLabel}${driver.totalStops > 0 ? ` / ${driver.totalStops}` : ""}</div>
    <div style="font-size:12px;color:${stale ? "#D97706" : "#64748B"}">${age}${stale ? " · καθυστέρηση" : ""}</div>
    ${etaHtml}
  </div>`;
}

/** Inline styles injected into the InfoWindow container (premium Kartex look). */
export const INFO_WINDOW_CONTAINER_STYLES = `
  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.5; }
  }
  .gm-style .gm-style-iw-c {
    border-radius: 16px !important;
    border: 1px solid rgba(212, 175, 55, 0.45) !important;
    border-top: 3px solid #D4AF37 !important;
    box-shadow: 0 8px 32px rgba(10, 22, 40, 0.14) !important;
    padding: 16px 18px !important;
  }
  .gm-style .gm-style-iw-d {
    overflow: hidden !important;
  }
  .gm-style .gm-style-iw-tc::after {
    background: #FFFFFF !important;
    box-shadow: -1px 1px 0 0 rgba(212, 175, 55, 0.45) !important;
  }
  .gm-style .gm-ui-hover-effect {
    top: 4px !important;
    right: 4px !important;
  }
`;
