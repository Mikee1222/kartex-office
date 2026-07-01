import type { AnalyticsBreakdownRow } from "@/lib/website/analytics-types";

/** Gold / navy / teal palette for website analytics breakdowns. */
export const ANALYTICS_CHART_COLORS = [
  "#0A1628",
  "#D4AF37",
  "#14B8A6",
  "#64748B",
  "#0D9488",
  "#E8C547",
  "#1a2f4a",
  "#F59E0B",
] as const;

export type AnalyticsChartPoint = {
  id: string;
  label: string;
  value: number;
  count: number;
  pct: number;
  color: string;
};

export function breakdownToAnalyticsChartPoints(
  rows: AnalyticsBreakdownRow[],
): AnalyticsChartPoint[] {
  return rows.map((row, index) => ({
    id: row.id,
    label: row.label,
    value: row.pct,
    count: row.count,
    pct: row.pct,
    color: ANALYTICS_CHART_COLORS[index % ANALYTICS_CHART_COLORS.length]!,
  }));
}

export function preferDonutChart(categoryCount: number): boolean {
  return categoryCount >= 2 && categoryCount <= 4;
}
