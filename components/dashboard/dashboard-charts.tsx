"use client";

import * as React from "react";
import {
  Area,
  AreaChart,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { premiumCard } from "@/lib/ui/premium-styles";
import { cn } from "@/lib/utils";
import type { OrderRow } from "@/types/database";

const CHART_COLORS = ["#0A1628", "#D4AF37", "#10B981", "#EF4444", "#3B82F6", "#F59E0B"];

type DashboardChartsProps = {
  orders: OrderRow[];
};

function last30DayKeys(): string[] {
  const keys: string[] = [];
  const now = new Date();
  for (let i = 29; i >= 0; i -= 1) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    keys.push(d.toISOString().slice(0, 10));
  }
  return keys;
}

function buildRevenueSeries(orders: OrderRow[]) {
  const keys = last30DayKeys();
  const byDay = new Map(keys.map((k) => [k, 0]));

  for (const row of orders) {
    const day = row.created_at?.slice(0, 10);
    if (!day || !byDay.has(day)) continue;
    const total =
      typeof row.total === "number"
        ? row.total
        : Number.parseFloat(String(row.total));
    if (Number.isFinite(total)) {
      byDay.set(day, (byDay.get(day) ?? 0) + total);
    }
  }

  return keys.map((key) => {
    const [, month, day] = key.split("-");
    return {
      day: `${day}/${month}`,
      revenue: Math.round((byDay.get(key) ?? 0) * 100) / 100,
    };
  });
}

function buildStatusBreakdown(orders: OrderRow[]) {
  const counts = new Map<string, number>();
  for (const row of orders) {
    const status = String(row.status ?? "Άγνωστο");
    counts.set(status, (counts.get(status) ?? 0) + 1);
  }

  return Array.from(counts.entries())
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 6);
}

function RevenueTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: { value: number; payload: { day: string } }[];
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-gray-200 bg-white px-3 py-2 shadow-card-hover">
      <p className="text-xs text-gray-400">{payload[0].payload.day}</p>
      <p className="text-sm font-semibold text-navy-900">
        {payload[0].value.toLocaleString("el-GR", {
          style: "currency",
          currency: "EUR",
        })}
      </p>
    </div>
  );
}

export function DashboardCharts({ orders }: DashboardChartsProps) {
  const revenueData = React.useMemo(() => buildRevenueSeries(orders), [orders]);
  const statusData = React.useMemo(() => buildStatusBreakdown(orders), [orders]);
  const totalOrders = statusData.reduce((sum, item) => sum + item.value, 0);

  return (
    <section className="grid gap-4 lg:grid-cols-5">
      <article className={cn(premiumCard, "p-5 lg:col-span-3")}>
        <h2 className="text-base font-semibold text-navy-900">
          Έσοδα — Τελευταίες 30 ημέρες
        </h2>
        <p className="mt-0.5 text-xs text-gray-400">Ημερήσια καταχωρήσεις παραγγελιών</p>
        <div className="mt-4 h-64">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={revenueData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="revenueFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#D4AF37" stopOpacity={0.25} />
                  <stop offset="100%" stopColor="#D4AF37" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis
                dataKey="day"
                tick={{ fontSize: 10, fill: "#94A3B8" }}
                axisLine={false}
                tickLine={false}
                interval="preserveStartEnd"
              />
              <YAxis
                tick={{ fontSize: 10, fill: "#94A3B8" }}
                axisLine={false}
                tickLine={false}
                width={48}
              />
              <Tooltip content={<RevenueTooltip />} />
              <Area
                type="monotone"
                dataKey="revenue"
                stroke="#D4AF37"
                strokeWidth={2}
                fill="url(#revenueFill)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </article>

      <article className={cn(premiumCard, "p-5 lg:col-span-2")}>
        <h2 className="text-base font-semibold text-navy-900">
          Κατάσταση Παραγγελιών
        </h2>
        <p className="mt-0.5 text-xs text-gray-400">Κατανομή κατάστασης</p>
        <div className="relative mt-2 h-52">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={statusData}
                dataKey="value"
                nameKey="name"
                innerRadius={58}
                outerRadius={78}
                paddingAngle={2}
              >
                {statusData.map((entry, index) => (
                  <Cell
                    key={entry.name}
                    fill={CHART_COLORS[index % CHART_COLORS.length]}
                  />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <p className="text-3xl font-semibold text-navy-900">{totalOrders}</p>
              <p className="text-[10px] uppercase tracking-widest text-gray-400">
                σύνολο
              </p>
            </div>
          </div>
        </div>
        <ul className="mt-2 space-y-1.5">
          {statusData.map((item, index) => (
            <li
              key={item.name}
              className="flex items-center justify-between gap-2 text-xs"
            >
              <span className="flex min-w-0 items-center gap-2 text-gray-600">
                <span
                  className="size-2 shrink-0 rounded-full"
                  style={{
                    backgroundColor: CHART_COLORS[index % CHART_COLORS.length],
                  }}
                  aria-hidden
                />
                <span className="truncate">{item.name}</span>
              </span>
              <span className="font-semibold tabular-nums text-navy-900">
                {item.value}
              </span>
            </li>
          ))}
        </ul>
      </article>
    </section>
  );
}
