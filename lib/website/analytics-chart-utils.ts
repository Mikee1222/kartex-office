import type { ChartPoint } from "@/lib/reports/compute-analytics";
import type { AnalyticsBreakdownRow } from "@/lib/website/analytics-types";

const CHART_COLORS = ["#0A1628", "#D4AF37", "#10B981", "#64748B", "#F59E0B", "#6366F1"];

export function breakdownToChartPoints(rows: AnalyticsBreakdownRow[]): ChartPoint[] {
  return rows.map((row, index) => ({
    id: row.id,
    label: row.label,
    value: row.pct,
    color: CHART_COLORS[index % CHART_COLORS.length],
  }));
}
