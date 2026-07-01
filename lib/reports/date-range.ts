import { APP_TIMEZONE } from "@/types/database";
import { getAthensDateString, getAthensYearMonth } from "@/lib/datetime";

export type ReportDatePreset = "today" | "week" | "month" | "year" | "custom";

export type ReportDateRange = {
  preset: ReportDatePreset;
  startDate: string;
  endDate: string;
  label: string;
};

const PRESET_LABELS: Record<Exclude<ReportDatePreset, "custom">, string> = {
  today: "Σήμερα",
  week: "Εβδομάδα",
  month: "Μήνας",
  year: "Έτος",
};

function parseAthensDate(dateStr: string): Date {
  const [year, month, day] = dateStr.split("-").map(Number);
  return new Date(Date.UTC(year!, month! - 1, day!, 12, 0, 0));
}

function formatAthensDate(date: Date): string {
  return getAthensDateString(date);
}

function addDays(dateStr: string, days: number): string {
  const date = parseAthensDate(dateStr);
  date.setUTCDate(date.getUTCDate() + days);
  return formatAthensDate(date);
}

function getAthensWeekdayIndex(date = new Date()): number {
  const weekday = new Intl.DateTimeFormat("en-US", {
    timeZone: APP_TIMEZONE,
    weekday: "short",
  }).format(date);
  const map: Record<string, number> = {
    Mon: 0,
    Tue: 1,
    Wed: 2,
    Thu: 3,
    Fri: 4,
    Sat: 5,
    Sun: 6,
  };
  return map[weekday] ?? 0;
}

function getMonthBounds(dateStr: string): { start: string; end: string } {
  const [year, month] = dateStr.split("-").map(Number);
  const start = `${year}-${String(month).padStart(2, "0")}-01`;
  const lastDay = new Date(Date.UTC(year!, month!, 0, 12)).getUTCDate();
  const end = `${year}-${String(month).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;
  return { start, end };
}

function getYearBounds(dateStr: string): { start: string; end: string } {
  const year = dateStr.slice(0, 4);
  return { start: `${year}-01-01`, end: `${year}-12-31` };
}

export function resolveReportDateRange(
  preset: ReportDatePreset,
  customStart?: string,
  customEnd?: string,
): ReportDateRange {
  const today = getAthensDateString();

  if (preset === "custom") {
    const startDate = customStart?.trim() || today;
    const endDate = customEnd?.trim() || startDate;
    const ordered =
      startDate <= endDate
        ? { startDate, endDate }
        : { startDate: endDate, endDate: startDate };
    return {
      preset,
      ...ordered,
      label: `${ordered.startDate} — ${ordered.endDate}`,
    };
  }

  if (preset === "today") {
    return {
      preset,
      startDate: today,
      endDate: today,
      label: PRESET_LABELS.today,
    };
  }

  if (preset === "week") {
    const weekday = getAthensWeekdayIndex();
    const startDate = addDays(today, -weekday);
    const endDate = addDays(startDate, 6);
    return {
      preset,
      startDate,
      endDate,
      label: PRESET_LABELS.week,
    };
  }

  if (preset === "month") {
    const { start, end } = getMonthBounds(today);
    return {
      preset,
      startDate: start,
      endDate: end,
      label: PRESET_LABELS.month,
    };
  }

  const { start, end } = getYearBounds(today);
  return {
    preset,
    startDate: start,
    endDate: end,
    label: PRESET_LABELS.year,
  };
}

export function getPreviousPeriod(range: ReportDateRange): ReportDateRange {
  const start = parseAthensDate(range.startDate);
  const end = parseAthensDate(range.endDate);
  const lengthDays =
    Math.round((end.getTime() - start.getTime()) / (24 * 60 * 60 * 1000)) + 1;
  const prevEnd = addDays(range.startDate, -1);
  const prevStart = addDays(prevEnd, -(lengthDays - 1));
  return {
    preset: range.preset,
    startDate: prevStart,
    endDate: prevEnd,
    label: `Προηγ. ${range.label}`,
  };
}

export function isIsoInReportRange(
  iso: string,
  range: ReportDateRange,
): boolean {
  const parsed = new Date(iso);
  if (Number.isNaN(parsed.getTime())) return false;
  const day = getAthensDateString(parsed);
  return day >= range.startDate && day <= range.endDate;
}

export function isDateInReportRange(
  dateStr: string | null | undefined,
  range: ReportDateRange,
): boolean {
  if (!dateStr) return false;
  const day = dateStr.slice(0, 10);
  return day >= range.startDate && day <= range.endDate;
}

export function getLast12AthensMonths(): { yearMonth: string; label: string }[] {
  const result: { yearMonth: string; label: string }[] = [];
  const anchor = parseAthensDate(getAthensDateString());

  for (let offset = 11; offset >= 0; offset -= 1) {
    const d = new Date(anchor);
    d.setUTCMonth(d.getUTCMonth() - offset);
    const yearMonth = getAthensYearMonth(d);
    const label = new Intl.DateTimeFormat("el-GR", {
      timeZone: APP_TIMEZONE,
      month: "short",
      year: "2-digit",
    }).format(d);
    result.push({ yearMonth, label });
  }

  return result;
}

export function getWeeksInRange(range: ReportDateRange): string[] {
  const weeks: string[] = [];
  let cursor = range.startDate;
  while (cursor <= range.endDate) {
    weeks.push(cursor);
    cursor = addDays(cursor, 7);
  }
  return weeks;
}

export function formatRangeWeekLabel(dateStr: string): string {
  const date = parseAthensDate(dateStr);
  return new Intl.DateTimeFormat("el-GR", {
    timeZone: APP_TIMEZONE,
    day: "numeric",
    month: "short",
  }).format(date);
}

export function formatReportDateTime(iso: string): string {
  const parsed = new Date(iso);
  if (Number.isNaN(parsed.getTime())) return "—";
  return new Intl.DateTimeFormat("el-GR", {
    timeZone: APP_TIMEZONE,
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(parsed);
}
