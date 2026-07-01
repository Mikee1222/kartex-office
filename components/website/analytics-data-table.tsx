"use client";

import { BarChart3 } from "lucide-react";

import { AnalyticsEmptyState } from "@/components/website/analytics-section";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDurationSeconds } from "@/lib/website/analytics-date-range";
import { premiumStatCard, premiumTableHead } from "@/lib/ui/premium-styles";
import { cn } from "@/lib/utils";

export type AnalyticsTableColumn = {
  key: string;
  label: string;
  align?: "left" | "right";
  /** When set, renders a proportional bar behind numeric values. */
  barKey?: boolean;
};

export type AnalyticsTableRow = Record<string, string | number>;

function CountCell({ value, max }: { value: number; max: number }) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0;

  return (
    <div className="relative min-w-[5rem]">
      <div
        className="absolute inset-y-0 right-0 rounded-md bg-gold-500/10 transition-all duration-300"
        style={{ width: `${Math.max(8, pct)}%` }}
        aria-hidden
      />
      <span className="relative font-semibold tabular-nums text-kartex-navy">
        {value.toLocaleString("el-GR")}
      </span>
    </div>
  );
}

export function AnalyticsDataTable({
  title,
  description,
  columns,
  rows,
  loading,
  emptyTitle,
  emptyDescription,
}: {
  title: string;
  description: string;
  columns: AnalyticsTableColumn[];
  rows: AnalyticsTableRow[];
  loading?: boolean;
  emptyTitle: string;
  emptyDescription: string;
}) {
  const countColumn = columns.find((column) => column.barKey)?.key;
  const maxCount =
    countColumn != null
      ? Math.max(...rows.map((row) => Number(row[countColumn] ?? 0)), 1)
      : 1;

  if (loading) {
    return (
      <div className={cn(premiumStatCard, "overflow-hidden")}>
        <div className="border-b border-gray-100 px-5 py-4">
          <Skeleton className="h-5 w-40" />
        </div>
        <div className="space-y-3 p-5">
          {Array.from({ length: 5 }).map((_, index) => (
            <Skeleton key={index} className="h-10 w-full" />
          ))}
        </div>
      </div>
    );
  }

  if (rows.length === 0) {
    return (
      <div className={cn(premiumStatCard, "overflow-hidden")}>
        <div className="border-b border-gray-100 bg-white px-5 py-4">
          <h3 className="text-sm font-semibold text-kartex-navy">{title}</h3>
          <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>
        </div>
        <AnalyticsEmptyState
          icon={BarChart3}
          title={emptyTitle}
          description={emptyDescription}
        />
      </div>
    );
  }

  return (
    <div className={cn(premiumStatCard, "overflow-hidden")}>
      <div className="border-b border-gray-100 bg-white px-5 py-4">
        <h3 className="text-sm font-semibold text-kartex-navy">{title}</h3>
        <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[320px] text-sm">
          <thead>
            <tr className={premiumTableHead}>
              {columns.map((column) => (
                <th
                  key={column.key}
                  className={cn(
                    "px-5 py-3",
                    column.align === "right" && "text-right",
                  )}
                >
                  {column.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, index) => (
              <tr
                key={index}
                className="group border-b border-gray-100/80 transition-colors last:border-0 hover:bg-gold-500/[0.03]"
              >
                {columns.map((column) => {
                  const raw = row[column.key];
                  const isCountBar = column.barKey && typeof raw === "number";

                  return (
                    <td
                      key={column.key}
                      className={cn(
                        "px-5 py-3.5",
                        column.align === "right" && "text-right",
                        column.key === columns[0]?.key &&
                          "max-w-[280px] truncate font-medium text-kartex-navy",
                      )}
                    >
                      {isCountBar ? (
                        <CountCell value={raw} max={maxCount} />
                      ) : column.key === "avgTime" && typeof raw === "string" ? (
                        raw
                      ) : (
                        String(raw ?? "—")
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function formatPageAvgTime(seconds: number | null): string {
  if (seconds == null) return "—";
  return formatDurationSeconds(seconds);
}
