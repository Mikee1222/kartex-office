import { APP_TIMEZONE } from "@/types/database";

/** Calendar date YYYY-MM-DD in Europe/Athens (documented app timezone). */
export function getAthensDateString(date = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: APP_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

/** Year-month YYYY-MM in Europe/Athens. */
export function getAthensYearMonth(date = new Date()): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: APP_TIMEZONE,
    year: "numeric",
    month: "2-digit",
  }).formatToParts(date);
  const year = parts.find((p) => p.type === "year")?.value;
  const month = parts.find((p) => p.type === "month")?.value;
  return `${year}-${month}`;
}

export function isIsoOnAthensDay(
  iso: string,
  dayLabel = getAthensDateString(),
): boolean {
  const parsed = new Date(iso);
  if (Number.isNaN(parsed.getTime())) return false;
  return getAthensDateString(parsed) === dayLabel;
}

export function isIsoInAthensMonth(
  iso: string,
  yearMonth = getAthensYearMonth(),
): boolean {
  const parsed = new Date(iso);
  if (Number.isNaN(parsed.getTime())) return false;
  return getAthensYearMonth(parsed) === yearMonth;
}

/** Previous calendar month YYYY-MM in Europe/Athens. */
export function getPreviousAthensYearMonth(date = new Date()): string {
  const [yearStr, monthStr] = getAthensYearMonth(date).split("-");
  const year = Number(yearStr);
  const month = Number(monthStr);
  const prevMonth = month === 1 ? 12 : month - 1;
  const prevYear = month === 1 ? year - 1 : year;
  return `${prevYear}-${String(prevMonth).padStart(2, "0")}`;
}

export function isDeliveryOnAthensDay(
  deliveryDate: string | null,
  dayLabel = getAthensDateString(),
): boolean {
  if (!deliveryDate) return false;
  return deliveryDate === dayLabel;
}
