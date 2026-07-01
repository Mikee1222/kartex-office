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

export function buildDriverInfoWindowHtml(
  driver: LiveDriverRow,
  now: number,
  eta: TripEta | null,
): string {
  const loc = driver.location;
  if (!loc) return "";

  const stale = isLocationStale(loc.recordedAt, now);
  const age = formatLocationAgeGreek(loc.recordedAt, now);
  const stopsLabel =
    driver.stopsRemaining === 1
      ? "1 στάση απομένει"
      : `${driver.stopsRemaining} στάσεις απομένουν`;

  const etaHtml = eta
    ? `<div style="margin-top:8px;padding-top:8px;border-top:1px solid rgba(212,175,55,0.35);font-size:13px;font-weight:600;color:#0A1628">${escapeHtml(formatEtaGreek(eta.minutes))}</div>`
    : driver.nextStop
      ? `<div style="margin-top:8px;font-size:12px;color:#64748B">Υπολογισμός ETA…</div>`
      : "";

  return `<div style="font-family:Inter,system-ui,sans-serif;min-width:180px;max-width:240px;padding:2px 0">
    <div style="font-weight:700;font-size:14px;color:#0A1628;margin-bottom:6px">${escapeHtml(driver.driverName)}</div>
    <div style="font-size:12px;color:#64748B;margin-bottom:4px">Δρομολόγιο #${driver.tripNumber}</div>
    <div style="font-size:12px;color:#475569;margin-bottom:4px">${stopsLabel}</div>
    <div style="font-size:12px;color:${stale ? "#D97706" : "#64748B"}">${age}${stale ? " · καθυστέρηση" : ""}</div>
    ${etaHtml}
  </div>`;
}

/** Inline styles injected into the InfoWindow container (office card look). */
export const INFO_WINDOW_CONTAINER_STYLES = `
  .gm-style .gm-style-iw-c {
    border-radius: 14px !important;
    border: 2px solid #D4AF37 !important;
    box-shadow: 0 4px 20px rgba(10, 22, 40, 0.12) !important;
    padding: 12px 14px !important;
  }
  .gm-style .gm-style-iw-d {
    overflow: hidden !important;
  }
  .gm-style .gm-style-iw-tc::after {
    background: #F5F0E6 !important;
    box-shadow: -2px 2px 0 0 #D4AF37 !important;
  }
`;
