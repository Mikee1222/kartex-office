"use client";

import * as React from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  Cell,
  ComposedChart,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { driverInitials } from "@/lib/drivers/driver-initials";
import type {
  ChartPoint,
  ProfitMonthPoint,
  ReportKpi,
  ReportTableRow,
} from "@/lib/reports/compute-analytics";
import {
  premiumCard,
  premiumStatCard,
  premiumTableHead,
  premiumTableWrap,
} from "@/lib/ui/premium-styles";
import { cn } from "@/lib/utils";

const NAVY = "#0A1628";
const GOLD = "#D4AF37";

export function ReportSection({
  title,
  description,
  children,
  className,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("space-y-4", className)}>
      <div>
        <h2 className="text-lg font-semibold tracking-tight text-navy-900">{title}</h2>
        <p className="mt-0.5 text-sm text-gray-400">{description}</p>
      </div>
      {children}
    </section>
  );
}

export function ReportKpiRow({
  kpis,
  loading,
  columns = 4,
}: {
  kpis: ReportKpi[];
  loading?: boolean;
  columns?: 3 | 4 | 6;
}) {
  const gridClass =
    columns === 6
      ? "sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6"
      : columns === 3
        ? "sm:grid-cols-2 xl:grid-cols-3"
        : "sm:grid-cols-2 xl:grid-cols-4";

  if (loading) {
    return (
      <section className={cn("grid gap-4", gridClass)}>
        {Array.from({ length: columns }).map((_, index) => (
          <Card key={index} className={cn(premiumStatCard, "border-l-4 border-l-kartex-gold")}>
            <CardHeader className="pb-2">
              <Skeleton className="h-4 w-32" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-9 w-24" />
            </CardContent>
          </Card>
        ))}
      </section>
    );
  }

  return (
    <section className={cn("grid gap-4", gridClass)}>
      {kpis.map((kpi) => (
        <Card
          key={kpi.key}
          className={cn(
            premiumStatCard,
            "border-l-4",
            kpi.tone === "danger"
              ? "border-l-red-500"
              : kpi.tone === "success"
                ? "border-l-emerald-500"
                : kpi.tone === "warning"
                  ? "border-l-amber-500"
                  : "border-l-kartex-gold",
          )}
        >
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {kpi.label}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p
              className={cn(
                "font-semibold tracking-tight",
                kpi.key === "popular" ||
                  kpi.key === "best" ||
                  kpi.key === "bestProduct" ||
                  kpi.key === "worstProduct"
                  ? "text-lg leading-snug text-kartex-navy"
                  : "text-3xl text-kartex-navy",
                kpi.key === "avgMargin" && kpi.tone === "success" && "text-emerald-700",
                kpi.key === "avgMargin" && kpi.tone === "warning" && "text-amber-700",
                kpi.key === "avgMargin" && kpi.tone === "danger" && "text-red-700",
                kpi.key === "worstProduct" && "text-red-700",
                (kpi.key === "picking" || kpi.key === "avg") &&
                  kpi.value.includes("Δεν υπάρχουν") &&
                  "text-base text-muted-foreground",
              )}
            >
              {kpi.value}
            </p>
            {kpi.hint ? (
              <p className="mt-1 text-xs text-muted-foreground">{kpi.hint}</p>
            ) : null}
          </CardContent>
        </Card>
      ))}
    </section>
  );
}

function ChartCard({
  title,
  description,
  children,
  className,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn(premiumCard, "p-5", className)}>
      <div className="mb-4">
        <h3 className="text-sm font-semibold text-navy-900">{title}</h3>
        {description ? (
          <p className="mt-0.5 text-xs text-gray-400">{description}</p>
        ) : null}
      </div>
      {children}
    </div>
  );
}

export function ChartSkeleton({ className }: { className?: string }) {
  return <Skeleton className={cn("h-[280px] w-full rounded-xl", className)} />;
}

export function RevenueAreaChart({
  data,
  loading,
}: {
  data: ChartPoint[];
  loading?: boolean;
}) {
  if (loading) return <ChartSkeleton />;
  return (
    <ChartCard title="Έσοδα (τελευταίοι 12 μήνες)" className="lg:col-span-2">
      <div className="h-[280px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={NAVY} stopOpacity={0.35} />
                <stop offset="100%" stopColor={NAVY} stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <XAxis dataKey="label" tick={{ fill: "#64748b", fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: "#64748b", fontSize: 11 }} axisLine={false} tickLine={false} width={48} />
            <Tooltip formatter={(value) => [`€${Number(value).toLocaleString("el-GR")}`, "Έσοδα"]} />
            <Area
              type="monotone"
              dataKey="value"
              stroke={NAVY}
              strokeWidth={2}
              fill="url(#revenueGradient)"
            />
            <Line type="monotone" dataKey="value" stroke={GOLD} strokeWidth={2} dot={false} />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </ChartCard>
  );
}

export function DonutChart({
  title,
  data,
  loading,
  centerLabel,
}: {
  title: string;
  data: ChartPoint[];
  loading?: boolean;
  centerLabel?: string;
}) {
  if (loading) return <ChartSkeleton />;
  const total = data.reduce((sum, row) => sum + row.value, 0);
  return (
    <ChartCard title={title}>
      <div className="relative h-[220px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              nameKey="label"
              cx="50%"
              cy="50%"
              innerRadius={52}
              outerRadius={80}
              paddingAngle={2}
            >
              {data.map((row, index) => (
                <Cell key={row.id} fill={row.color ?? ["#0A1628", "#D4AF37", "#10B981", "#F59E0B"][index % 4]} />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <p className="text-2xl font-bold text-kartex-navy">{centerLabel ?? total}</p>
          <p className="text-xs text-muted-foreground">σύνολο</p>
        </div>
      </div>
      <ul className="mt-2 space-y-1.5">
        {data.map((row) => (
          <li key={row.id} className="flex items-center justify-between gap-2 text-xs">
            <span className="flex min-w-0 items-center gap-2">
              <span
                className="size-2.5 shrink-0 rounded-full"
                style={{ backgroundColor: row.color ?? NAVY }}
              />
              <span className="truncate">{row.label}</span>
            </span>
            <span className="font-medium tabular-nums">{row.value}</span>
          </li>
        ))}
      </ul>
    </ChartCard>
  );
}

export function VerticalBarChart({
  title,
  data,
  loading,
  valuePrefix = "",
}: {
  title: string;
  data: ChartPoint[];
  loading?: boolean;
  valuePrefix?: string;
}) {
  if (loading) return <ChartSkeleton />;
  return (
    <ChartCard title={title}>
      <div className="h-[260px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
            <XAxis dataKey="label" tick={{ fill: "#64748b", fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: "#64748b", fontSize: 11 }} axisLine={false} tickLine={false} width={40} />
            <Tooltip formatter={(value) => [`${valuePrefix}${value}`, "Τιμή"]} />
            <Bar dataKey="value" radius={[4, 4, 0, 0]} maxBarSize={40}>
              {data.map((row) => (
                <Cell key={row.id} fill={row.color ?? NAVY} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </ChartCard>
  );
}

export function HorizontalBarChart({
  title,
  data,
  loading,
}: {
  title: string;
  data: ChartPoint[];
  loading?: boolean;
}) {
  if (loading) return <ChartSkeleton />;
  return (
    <ChartCard title={title} className="lg:col-span-2">
      <div className="h-[320px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            layout="vertical"
            margin={{ top: 8, right: 16, left: 8, bottom: 0 }}
          >
            <XAxis type="number" tick={{ fill: "#64748b", fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis
              type="category"
              dataKey="label"
              width={100}
              tick={{ fill: "#64748b", fontSize: 10 }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip />
            <Bar dataKey="value" radius={[0, 4, 4, 0]} maxBarSize={18}>
              {data.map((row) => (
                <Cell key={row.id} fill={row.color ?? NAVY} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </ChartCard>
  );
}

export function LineTrendChart({
  title,
  data,
  loading,
}: {
  title: string;
  data: ChartPoint[];
  loading?: boolean;
}) {
  if (loading) return <ChartSkeleton />;
  return (
    <ChartCard title={title}>
      <div className="h-[260px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
            <XAxis dataKey="label" tick={{ fill: "#64748b", fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis allowDecimals={false} tick={{ fill: "#64748b", fontSize: 11 }} axisLine={false} tickLine={false} width={32} />
            <Tooltip />
            <Line type="monotone" dataKey="value" stroke={GOLD} strokeWidth={2} dot={{ r: 3, fill: NAVY }} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </ChartCard>
  );
}

export function DualAreaChart({
  title,
  data,
  loading,
}: {
  title: string;
  data: ChartPoint[];
  loading?: boolean;
}) {
  if (loading) return <ChartSkeleton />;
  return (
    <ChartCard title={title}>
      <div className="h-[260px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
            <XAxis dataKey="label" tick={{ fill: "#64748b", fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: "#64748b", fontSize: 11 }} axisLine={false} tickLine={false} width={32} />
            <Tooltip />
            <Area type="monotone" dataKey="value" stackId="1" stroke="#10B981" fill="#10B981" fillOpacity={0.25} name="Εισερχόμενα" />
            <Area type="monotone" dataKey="value2" stackId="2" stroke="#EF4444" fill="#EF4444" fillOpacity={0.2} name="Εξερχόμενα" />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </ChartCard>
  );
}

export function FunnelChart({
  title,
  data,
  loading,
}: {
  title: string;
  data: ChartPoint[];
  loading?: boolean;
}) {
  if (loading) return <ChartSkeleton />;
  const max = Math.max(...data.map((row) => row.value), 1);
  return (
    <ChartCard title={title}>
      <div className="space-y-3">
        {data.map((row) => (
          <div key={row.id}>
            <div className="mb-1 flex items-center justify-between text-xs">
              <span className="font-medium text-kartex-navy">{row.label}</span>
              <span className="tabular-nums text-muted-foreground">{row.value}</span>
            </div>
            <div className="h-3 overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full transition-all"
                style={{
                  width: `${Math.max(8, Math.round((row.value / max) * 100))}%`,
                  backgroundColor: row.color ?? NAVY,
                }}
              />
            </div>
          </div>
        ))}
      </div>
    </ChartCard>
  );
}

export function ReportTable({
  title,
  columns,
  rows,
  loading,
  emptyMessage = "Δεν υπάρχουν δεδομένα.",
}: {
  title: string;
  columns: { key: string; label: string; align?: "left" | "right" }[];
  rows: ReportTableRow[];
  loading?: boolean;
  emptyMessage?: string;
}) {
  if (loading) {
    return (
      <Card className="border-border/80 shadow-sm">
        <CardHeader>
          <Skeleton className="h-6 w-40" />
        </CardHeader>
        <CardContent className="space-y-3">
          {Array.from({ length: 5 }).map((_, index) => (
            <Skeleton key={index} className="h-10 w-full" />
          ))}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-border/80 shadow-sm">
      <CardHeader>
        <CardTitle className="text-lg text-kartex-navy">{title}</CardTitle>
      </CardHeader>
      <CardContent className="overflow-x-auto p-0 sm:p-6 sm:pt-0">
        <table className="w-full min-w-[320px] text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/40 text-left">
              {columns.map((column) => (
                <th
                  key={column.key}
                  className={cn(
                    "px-4 py-3 font-medium text-muted-foreground sm:px-6",
                    column.align === "right" && "text-right",
                  )}
                >
                  {column.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length}
                  className="px-4 py-10 text-center text-muted-foreground sm:px-6"
                >
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              rows.map((row, index) => (
                <tr
                  key={index}
                  className="border-b border-border/60 last:border-0 hover:bg-muted/30"
                >
                  {columns.map((column) => (
                    <td
                      key={column.key}
                      className={cn(
                        "px-4 py-3 sm:px-6",
                        column.align === "right" && "text-right tabular-nums",
                        column.key === columns[0]?.key && "font-medium text-kartex-navy",
                      )}
                    >
                      {row[column.key] ?? "—"}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </CardContent>
    </Card>
  );
}

export function DriverCardsGrid({
  drivers,
  loading,
  periodLabel,
}: {
  drivers: import("@/lib/reports/compute-analytics").DriverCardData[];
  loading?: boolean;
  periodLabel?: string;
}) {
  const driverInitials = (name: string) =>
    name
      .split(" ")
      .map((part) => part[0] ?? "")
      .join("")
      .slice(0, 2)
      .toUpperCase();

  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 3 }).map((_, index) => (
          <Skeleton key={index} className="h-52 w-full rounded-2xl" />
        ))}
      </div>
    );
  }

  if (drivers.length === 0) {
    return (
      <p className="rounded-2xl border border-dashed border-gray-200 bg-white p-8 text-center text-sm text-muted-foreground">
        Δεν βρέθηκαν δρομολόγια στην επιλεγμένη περίοδο.
      </p>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {drivers.map((driver) => (
        <div
          key={driver.id}
          className={cn(
            premiumCard,
            "flex flex-col gap-3 p-5",
          )}
        >
          <div className="flex items-start gap-3">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-navy-900/5 text-sm font-bold text-navy-900">
              {driverInitials(driver.name)}
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-[15px] font-semibold text-navy-900">{driver.name}</p>
              <p className="text-xs text-gray-400">Όχημα: {driver.vehiclePlate}</p>
            </div>
            <span className="inline-flex shrink-0 rounded-full border border-gray-200 bg-gray-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-gray-600">
              {driver.tripsCount} δρομολόγια
            </span>
          </div>

          <p className="text-sm text-gray-500">
            {periodLabel ?? "Περίοδος"}:{" "}
            <span className="font-semibold text-navy-900">
              {driver.deliveriesToday}/{driver.deliveriesTotal} παραδόσεις
            </span>
          </p>

          <div className="h-2.5 overflow-hidden rounded-full bg-gray-100">
            <div
              className="h-full rounded-full bg-gradient-to-r from-gold-500 to-gold-400 transition-all"
              style={{ width: `${driver.progressPct}%` }}
            />
          </div>
          <p className="text-right text-xs tabular-nums text-gray-400">{driver.progressPct}% επιτυχία</p>

          <div className="grid grid-cols-2 gap-2 border-t border-gray-100 pt-3 text-xs">
            <p>
              <span className="text-gray-400">Κιβώτια: </span>
              <span className="font-medium text-navy-900">
                {driver.boxesDone}/{driver.boxesTotal}
              </span>
            </p>
            <p className="text-right">
              <span className="text-gray-400">Δρομολόγια: </span>
              <span className="font-medium text-navy-900">{driver.tripsCount}</span>
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}

export function MonthlyGrossProfitChart({
  data,
  loading,
  title = "Μηνιαίο Μικτό Κέρδος (12 μήνες)",
  description,
}: {
  data: ProfitMonthPoint[];
  loading?: boolean;
  title?: string;
  description?: string;
}) {
  if (loading) return <ChartSkeleton className="lg:col-span-2" />;
  return (
    <ChartCard title={title} description={description} className="lg:col-span-2">
      <div className="h-[280px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="profitGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#10B981" stopOpacity={0.35} />
                <stop offset="100%" stopColor="#10B981" stopOpacity={0.05} />
              </linearGradient>
            </defs>
            <XAxis dataKey="label" tick={{ fill: "#64748b", fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: "#64748b", fontSize: 11 }} axisLine={false} tickLine={false} width={48} />
            <Tooltip
              formatter={(value, name) => {
                const labels: Record<string, string> = {
                  revenue: "Έσοδα",
                  cost: "Κόστος",
                  profit: "Κέρδος",
                };
                return [`€${Number(value).toLocaleString("el-GR")}`, labels[String(name)] ?? String(name)];
              }}
            />
            <Area
              type="monotone"
              dataKey="profit"
              stroke="#10B981"
              strokeWidth={2}
              fill="url(#profitGradient)"
              name="profit"
            />
            <Line type="monotone" dataKey="revenue" stroke={GOLD} strokeWidth={2} dot={false} name="revenue" />
            <Line type="monotone" dataKey="cost" stroke="#94A3B8" strokeWidth={2} dot={false} name="cost" />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </ChartCard>
  );
}

export function MarginPercentBarChart({
  title,
  description,
  data,
  loading,
}: {
  title: string;
  description?: string;
  data: ChartPoint[];
  loading?: boolean;
}) {
  if (loading) return <ChartSkeleton className="lg:col-span-2" />;
  return (
    <ChartCard title={title} description={description} className="lg:col-span-2">
      <div className="h-[420px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            layout="vertical"
            margin={{ top: 8, right: 48, left: 8, bottom: 0 }}
          >
            <XAxis
              type="number"
              domain={[0, "dataMax"]}
              tick={{ fill: "#64748b", fontSize: 11 }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(value) => `${value}%`}
            />
            <YAxis
              type="category"
              dataKey="label"
              width={120}
              tick={{ fill: "#64748b", fontSize: 10 }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip formatter={(value) => [`${value}%`, "Margin"]} />
            <Bar dataKey="value" radius={[0, 4, 4, 0]} maxBarSize={20}>
              {data.map((row) => (
                <Cell key={row.id} fill={row.color ?? NAVY} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </ChartCard>
  );
}

function MarginBadge({ marginPct, tone }: { marginPct: string; tone?: string }) {
  return (
    <span
      className={cn(
        "inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold",
        tone === "success" && "bg-emerald-100 text-emerald-800",
        tone === "warning" && "bg-amber-100 text-amber-900",
        tone === "danger" && "bg-red-100 text-red-800",
        !tone && "bg-muted text-muted-foreground",
      )}
    >
      {marginPct}
    </span>
  );
}

export function ProfitabilityTables({
  topProfitableProducts,
  priceReviewProducts,
  customerProfitability,
  loading,
  rangeLabel,
}: {
  topProfitableProducts: ReportTableRow[];
  priceReviewProducts: import("@/lib/reports/compute-analytics").PriceReviewProductRow[];
  customerProfitability: ReportTableRow[];
  loading?: boolean;
  rangeLabel?: string;
}) {
  if (loading) {
    return (
      <div className="grid gap-4 xl:grid-cols-2">
        <ChartSkeleton className="h-64" />
        <ChartSkeleton className="h-64" />
        <ChartSkeleton className="col-span-full h-64" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-4 xl:grid-cols-2">
        <div className={premiumTableWrap}>
          <div className="border-b border-gray-100 px-5 py-4">
            <h3 className="text-lg font-semibold text-navy-900">Top 10 Πιο Κερδοφόρα Προϊόντα</h3>
            <p className="mt-0.5 text-xs text-gray-400">
              Τιμή πώλησης καταλόγου · κόστος από αγορά ή internal_price_eur · πωλήσεις τρέχοντος μήνα
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-sm">
              <thead>
                <tr className={premiumTableHead}>
                  {[
                    "Προϊόν",
                    "Αγορά (€)",
                    "Πώληση (€)",
                    "Περιθώριο (€)",
                    "Margin %",
                    "Πωλήσεις",
                    "Κέρδος Μήνα (€)",
                  ].map((label) => (
                    <th key={label} className="px-4 py-3">
                      {label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {topProfitableProducts.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-3 py-10 text-center text-muted-foreground">
                      Δεν υπάρχουν προϊόντα.
                    </td>
                  </tr>
                ) : (
                  topProfitableProducts.map((row, index) => (
                    <tr key={index} className="border-b border-border/60 last:border-0 hover:bg-muted/30">
                      <td className="px-3 py-3 font-medium text-kartex-navy">{row.product}</td>
                      <td className="px-3 py-3 tabular-nums">{row.purchase}</td>
                      <td className="px-3 py-3 tabular-nums">{row.sale}</td>
                      <td className="px-3 py-3 tabular-nums">{row.marginEuro}</td>
                      <td className="px-3 py-3">
                        <MarginBadge
                          marginPct={String(row.marginPct)}
                          tone={String(row.marginTone)}
                        />
                      </td>
                      <td className="px-3 py-3 tabular-nums">{row.salesQty}</td>
                      <td className="px-3 py-3 font-medium tabular-nums">{row.monthProfit}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className={premiumTableWrap}>
          <div className="border-b border-gray-100 px-5 py-4">
            <h3 className="text-lg font-semibold text-navy-900">
              Προϊόντα προς Αναθεώρηση Τιμής (&lt;15% margin)
            </h3>
            <p className="mt-0.5 text-xs text-gray-400">
              Προτεινόμενη τιμή για ~30% margin · unit_price = τιμή χρέωσης, internal_price_eur = εσωτερική αναφορά
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[560px] text-sm">
              <thead>
                <tr className={premiumTableHead}>
                  {[
                    "Προϊόν",
                    "Margin %",
                    "Αγορά (€)",
                    "Πώληση (€)",
                    "Προτεινόμενη (30%)",
                    "",
                  ].map((label) => (
                    <th key={label || "action"} className="px-4 py-3">
                      {label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {priceReviewProducts.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-3 py-10 text-center text-muted-foreground">
                      Όλα τα προϊόντα έχουν επαρκές περιθώριο.
                    </td>
                  </tr>
                ) : (
                  priceReviewProducts.map((row) => (
                    <tr key={row.productId} className="border-b border-border/60 last:border-0 hover:bg-muted/30">
                      <td className="px-3 py-3 font-medium text-kartex-navy">{row.product}</td>
                      <td className="px-3 py-3">
                        <MarginBadge marginPct={`${row.marginPct.toFixed(1)}%`} tone="danger" />
                      </td>
                      <td className="px-3 py-3 tabular-nums">
                        {row.purchase.toLocaleString("el-GR", { minimumFractionDigits: 2 })}
                      </td>
                      <td className="px-3 py-3 tabular-nums">
                        {row.sale.toLocaleString("el-GR", { minimumFractionDigits: 2 })}
                      </td>
                      <td className="px-3 py-3 tabular-nums font-medium text-emerald-700">
                        {row.suggestedPrice.toLocaleString("el-GR", { minimumFractionDigits: 2 })}
                      </td>
                      <td className="px-3 py-3">
                        <a
                          href={`/products/${row.productId}/edit`}
                          className="inline-flex rounded-md bg-kartex-gold px-3 py-1.5 text-xs font-semibold text-kartex-navy hover:bg-kartex-gold/90"
                        >
                          Ενημέρωση Τιμής
                        </a>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className={premiumTableWrap}>
        <div className="border-b border-gray-100 px-5 py-4">
          <h3 className="text-lg font-semibold text-navy-900">Κερδοφορία ανά Πελάτη</h3>
          <p className="mt-0.5 text-xs text-gray-400">
            Έσοδα από unit_price παραγγελιών · κόστος από purchase/internal_price_eur
            {rangeLabel ? ` · ${rangeLabel}` : ""}
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[560px] text-sm">
            <thead>
              <tr className={premiumTableHead}>
                {["Πελάτης", "Τύπος", "Έσοδα (€)", "Κόστος (€)", "Κέρδος (€)", "Margin %"].map(
                  (label) => (
                    <th key={label} className="px-4 py-3">
                      {label}
                    </th>
                  ),
                )}
              </tr>
            </thead>
            <tbody>
              {customerProfitability.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-3 py-10 text-center text-muted-foreground">
                    Δεν υπάρχουν ολοκληρωμένες παραγγελίες στην περίοδο.
                  </td>
                </tr>
              ) : (
                customerProfitability.map((row, index) => (
                  <tr key={index} className="border-b border-border/60 last:border-0 hover:bg-muted/30">
                    <td className="px-3 py-3 font-medium text-kartex-navy">{row.customer}</td>
                    <td className="px-3 py-3">{row.type}</td>
                    <td className="px-3 py-3 tabular-nums">{row.revenue}</td>
                    <td className="px-3 py-3 tabular-nums">{row.cost}</td>
                    <td className="px-3 py-3 font-medium tabular-nums text-emerald-700">{row.profit}</td>
                    <td className="px-3 py-3 tabular-nums">{row.marginPct}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
