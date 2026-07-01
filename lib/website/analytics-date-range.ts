import { getAthensDateString } from "@/lib/datetime";
import { APP_TIMEZONE } from "@/types/database";

export type AnalyticsDatePreset = "today" | "7d" | "30d";

export type AnalyticsDateBounds = {
  preset: AnalyticsDatePreset;
  label: string;
  startIso: string;
  endIso: string;
};

const PRESET_LABELS: Record<AnalyticsDatePreset, string> = {
  today: "Σήμερα",
  "7d": "Τελευταίες 7 ημέρες",
  "30d": "Τελευταίες 30 ημέρες",
};

function parseAthensDate(dateStr: string): Date {
  const [year, month, day] = dateStr.split("-").map(Number);
  return new Date(Date.UTC(year!, month! - 1, day!, 12, 0, 0));
}

function addDays(dateStr: string, days: number): string {
  const date = parseAthensDate(dateStr);
  date.setUTCDate(date.getUTCDate() + days);
  return getAthensDateString(date);
}

/** UTC instant for a wall-clock time in Europe/Athens. */
export function athensLocalToUtc(
  dateStr: string,
  hours = 0,
  minutes = 0,
  seconds = 0,
): Date {
  const [year, month, day] = dateStr.split("-").map(Number);
  const target = { year: year!, month: month!, day: day!, hours, minutes, seconds };

  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: APP_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });

  let low = Date.UTC(target.year, target.month - 1, target.day - 1, 0, 0, 0);
  let high = Date.UTC(target.year, target.month - 1, target.day + 1, 23, 59, 59);

  while (low <= high) {
    const mid = Math.floor((low + high) / 2);
    const parts = Object.fromEntries(
      formatter
        .formatToParts(new Date(mid))
        .filter((part) => part.type !== "literal")
        .map((part) => [part.type, part.value]),
    );

    const cmp =
      Number(parts.year) - target.year ||
      Number(parts.month) - target.month ||
      Number(parts.day) - target.day ||
      Number(parts.hour) - target.hours ||
      Number(parts.minute) - target.minutes ||
      Number(parts.second) - target.seconds;

    if (cmp === 0) return new Date(mid);
    if (cmp < 0) low = mid + 1;
    else high = mid - 1;
  }

  throw new Error(`Could not resolve Athens local time: ${dateStr}`);
}

export function resolveAnalyticsDateBounds(
  preset: AnalyticsDatePreset,
  now = new Date(),
): AnalyticsDateBounds {
  const today = getAthensDateString(now);
  const endIso = athensLocalToUtc(addDays(today, 1), 0, 0, 0).toISOString();

  if (preset === "today") {
    return {
      preset,
      label: PRESET_LABELS.today,
      startIso: athensLocalToUtc(today, 0, 0, 0).toISOString(),
      endIso,
    };
  }

  const daysBack = preset === "7d" ? 6 : 29;
  const startDate = addDays(today, -daysBack);

  return {
    preset,
    label: PRESET_LABELS[preset],
    startIso: athensLocalToUtc(startDate, 0, 0, 0).toISOString(),
    endIso,
  };
}

export function formatDurationSeconds(totalSeconds: number): string {
  if (!Number.isFinite(totalSeconds) || totalSeconds <= 0) return "0 δευτ.";
  const capped = Math.round(totalSeconds);
  if (capped < 60) return `${capped} δευτ.`;
  const minutes = Math.floor(capped / 60);
  const seconds = capped % 60;
  if (minutes < 60) {
    return seconds > 0 ? `${minutes} λ. ${seconds} δευτ.` : `${minutes} λ.`;
  }
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  return remainingMinutes > 0 ? `${hours} ώ. ${remainingMinutes} λ.` : `${hours} ώ.`;
}
