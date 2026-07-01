"use client";

import {
  Bar,
  BarChart,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import type { MonthOrderCount, StatusSlice } from "@/lib/reports/compute-reports";

const NAVY = "#0A1628";
const GOLD = "#D4AF37";
const TEAL = "#14B8A6";
const GREEN = "#10B981";
const CHART_PALETTE = [NAVY, GOLD, TEAL, GREEN, "#1a2f4a", "#F0D060", "#64748B"];

type ReportsChartsProps = {
  ordersByMonth: MonthOrderCount[];
  statusBreakdown: StatusSlice[];
};

function ChartTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: { value: number; name?: string }[];
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-md border border-border bg-card px-3 py-2 text-sm shadow-md">
      <p className="font-medium text-kartex-navy">{label}</p>
      <p className="text-muted-foreground">
        {payload[0].name ?? "Τιμή"}:{" "}
        <span className="font-semibold text-foreground">{payload[0].value}</span>
      </p>
    </div>
  );
}

export function ReportsCharts({ ordersByMonth, statusBreakdown }: ReportsChartsProps) {
  const pieData = statusBreakdown.map((row) => ({
    name: row.status,
    value: row.count,
  }));

  const totalStatus = pieData.reduce((sum, row) => sum + row.value, 0);

  return (
    <div className="grid gap-4 lg:grid-cols-5">
      <div className="rounded-xl border border-border bg-card p-5 shadow-card transition-shadow hover:shadow-card-hover lg:col-span-3">
        <h3 className="mb-4 text-sm font-semibold text-kartex-navy">
          Παραγγελίες ανά Μήνα
        </h3>
        <div className="h-[280px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={ordersByMonth} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
              <XAxis
                dataKey="label"
                tick={{ fill: "#64748b", fontSize: 12 }}
                axisLine={{ stroke: "#e2e8f0" }}
                tickLine={false}
              />
              <YAxis
                allowDecimals={false}
                tick={{ fill: "#64748b", fontSize: 12 }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                content={<ChartTooltip />}
                cursor={{ fill: "rgba(212, 175, 55, 0.12)" }}
              />
              <Bar
                dataKey="count"
                name="Παραγγελίες"
                fill={GOLD}
                radius={[4, 4, 0, 0]}
                maxBarSize={48}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="rounded-xl border border-kartex-border bg-kartex-card p-5 shadow-card transition-shadow hover:shadow-card-hover lg:col-span-2">
        <h3 className="mb-4 text-sm font-semibold text-kartex-navy">
          Κατάσταση Παραγγελιών
        </h3>
        <div className="h-[220px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={pieData}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                innerRadius={52}
                outerRadius={80}
                paddingAngle={2}
              >
                {pieData.map((_, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={CHART_PALETTE[index % CHART_PALETTE.length]}
                  />
                ))}
              </Pie>
              <Tooltip
                formatter={(value, name) => {
                  const num =
                    typeof value === "number" ? value : Number(value ?? 0);
                  const pct =
                    totalStatus > 0
                      ? Math.round((num / totalStatus) * 100)
                      : 0;
                  return [`${num} (${pct}%)`, String(name ?? "")];
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <ul className="mt-2 space-y-1.5">
          {pieData.map((row, index) => (
            <li
              key={row.name}
              className="flex items-center justify-between gap-2 text-xs text-muted-foreground"
            >
              <span className="flex min-w-0 items-center gap-2">
                <span
                  className="size-2.5 shrink-0 rounded-full"
                  style={{
                    backgroundColor: CHART_PALETTE[index % CHART_PALETTE.length],
                  }}
                />
                <span className="truncate text-foreground">{row.name}</span>
              </span>
              <span className="shrink-0 tabular-nums font-medium text-kartex-navy">
                {row.value}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
