"use client";

import { PieChart as PieChartIcon } from "lucide-react";
import * as React from "react";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";

import { AnalyticsEmptyState } from "@/components/website/analytics-section";

import { Skeleton } from "@/components/ui/skeleton";
import type { AnalyticsChartPoint } from "@/lib/website/analytics-chart-utils";
import { premiumStatCard } from "@/lib/ui/premium-styles";
import { cn } from "@/lib/utils";

const NAVY = "#0A1628";

function visitLabel(count: number): string {
  return count === 1 ? "1 επίσκεψη" : `${count.toLocaleString("el-GR")} επισκέψεις`;
}

function BreakdownTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: { payload: AnalyticsChartPoint }[];
}) {
  if (!active || !payload?.[0]?.payload) return null;
  const row = payload[0].payload;
  return (
    <div className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs shadow-md">
      <p className="font-semibold text-kartex-navy">{row.label}</p>
      <p className="text-muted-foreground">
        {row.value.toLocaleString("el-GR", { maximumFractionDigits: 1 })}% — {visitLabel(row.count)}
      </p>
    </div>
  );
}

function AnalyticsDonutChart({
  title,
  description,
  data,
  totalLabel,
}: {
  title: string;
  description: string;
  data: AnalyticsChartPoint[];
  totalLabel: string;
}) {
  const total = data.reduce((sum, row) => sum + row.count, 0);

  return (
    <div className={cn(premiumStatCard, "flex h-full flex-col p-5")}>
      <div className="mb-4">
        <h3 className="text-sm font-semibold text-kartex-navy">{title}</h3>
        <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>
      </div>
      <div className="relative mx-auto h-[200px] w-full max-w-[240px] flex-1">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              dataKey="count"
              nameKey="label"
              cx="50%"
              cy="50%"
              innerRadius={54}
              outerRadius={82}
              paddingAngle={2}
              strokeWidth={0}
            >
              {data.map((row) => (
                <Cell key={row.id} fill={row.color ?? NAVY} />
              ))}
            </Pie>
            <Tooltip content={<BreakdownTooltip />} />
          </PieChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <p className="text-2xl font-bold text-kartex-navy">{total}</p>
          <p className="text-[10px] uppercase tracking-wide text-muted-foreground">{totalLabel}</p>
        </div>
      </div>
      <ul className="mt-4 space-y-2">
        {data.map((row) => (
          <li key={row.id} className="flex items-center justify-between gap-2 text-xs">
            <span className="flex min-w-0 items-center gap-2">
              <span
                className="size-2.5 shrink-0 rounded-full"
                style={{ backgroundColor: row.color ?? NAVY }}
              />
              <span className="truncate font-medium text-kartex-navy">{row.label}</span>
            </span>
            <span className="shrink-0 tabular-nums text-muted-foreground">
              {row.value.toLocaleString("el-GR", { maximumFractionDigits: 1 })}% ({visitLabel(row.count)})
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function AnalyticsHorizontalBreakdown({
  title,
  description,
  data,
}: {
  title: string;
  description: string;
  data: AnalyticsChartPoint[];
}) {
  const maxPct = Math.max(...data.map((row) => row.value), 1);

  return (
    <div className={cn(premiumStatCard, "flex h-full flex-col p-5")}>
      <div className="mb-4">
        <h3 className="text-sm font-semibold text-kartex-navy">{title}</h3>
        <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>
      </div>
      <ul className="space-y-3">
        {data.map((row) => (
          <li key={row.id}>
            <div className="mb-1 flex items-center justify-between gap-2 text-xs">
              <span className="font-medium text-kartex-navy">{row.label}</span>
              <span className="shrink-0 tabular-nums text-muted-foreground">
                {row.value.toLocaleString("el-GR", { maximumFractionDigits: 1 })}% ({visitLabel(row.count)})
              </span>
            </div>
            <div className="h-2.5 overflow-hidden rounded-full bg-gray-100">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${Math.max(4, Math.round((row.value / maxPct) * 100))}%`,
                  backgroundColor: row.color ?? NAVY,
                }}
              />
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function AnalyticsBreakdownChart({
  title,
  description,
  data,
  totalLabel = "σύνολο",
  preferDonut,
  loading,
}: {
  title: string;
  description: string;
  data: AnalyticsChartPoint[];
  totalLabel?: string;
  preferDonut: boolean;
  loading?: boolean;
}) {
  if (loading) {
    return <Skeleton className="h-[340px] w-full rounded-2xl" />;
  }

  if (data.length === 0) {
    return (
      <div className={cn(premiumStatCard, "overflow-hidden")}>
        <div className="border-b border-gray-100 px-5 py-4">
          <h3 className="text-sm font-semibold text-kartex-navy">{title}</h3>
          <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>
        </div>
        <AnalyticsEmptyState
          icon={PieChartIcon}
          title="Δεν υπάρχουν δεδομένα"
          description="Για την επιλεγμένη περίοδο."
        />
      </div>
    );
  }

  if (preferDonut) {
    return (
      <AnalyticsDonutChart
        title={title}
        description={description}
        data={data}
        totalLabel={totalLabel}
      />
    );
  }

  return (
    <AnalyticsHorizontalBreakdown title={title} description={description} data={data} />
  );
}
