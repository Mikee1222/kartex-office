"use client";

import {
  Activity,
  Clock,
  FileText,
  MousePointerClick,
  TrendingDown,
  TrendingUp,
  Users,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { Skeleton } from "@/components/ui/skeleton";
import type { AnalyticsStatCards, AnalyticsStatTrend } from "@/lib/website/analytics-types";
import { formatDurationCompact } from "@/lib/website/analytics-date-range";
import { premiumStatCard } from "@/lib/ui/premium-styles";
import { cn } from "@/lib/utils";

type StatCardConfig = {
  key: string;
  label: string;
  value: string;
  hint?: string;
  icon: LucideIcon;
  prominent?: boolean;
  tone?: "default" | "success";
  trend?: AnalyticsStatTrend;
};

function TrendBadge({ trend }: { trend?: AnalyticsStatTrend }) {
  if (!trend || trend.pctChange == null) return null;

  const up = trend.pctChange >= 0;
  const Icon = up ? TrendingUp : TrendingDown;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-[11px] font-semibold tabular-nums",
        up ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700",
      )}
    >
      <Icon className="size-3" aria-hidden />
      {up ? "+" : ""}
      {trend.pctChange.toLocaleString("el-GR", { maximumFractionDigits: 1 })}%
      <span className="font-normal text-muted-foreground">{trend.comparisonLabel}</span>
    </span>
  );
}

function buildStatCards(stats: AnalyticsStatCards): StatCardConfig[] {
  return [
    {
      key: "active",
      label: "Ενεργές συνεδρίες τώρα",
      value: String(stats.activeSessionsNow),
      hint: "Τελευταία 5 λεπτά",
      icon: Activity,
      prominent: true,
      tone: stats.activeSessionsNow > 0 ? "success" : "default",
    },
    {
      key: "visits",
      label: "Επισκέψεις σήμερα",
      value: String(stats.visitsToday),
      hint: "Europe/Athens",
      icon: Users,
      trend: stats.trends?.visitsToday,
    },
    {
      key: "pages",
      label: "Σελίδες/επίσκεψη",
      value: stats.pagesPerVisit.toLocaleString("el-GR", {
        minimumFractionDigits: 1,
        maximumFractionDigits: 1,
      }),
      hint: "Μέσος όρος περιόδου",
      icon: FileText,
      trend: stats.trends?.pagesPerVisit,
    },
    {
      key: "duration",
      label: "Μέσος χρόνος στο site",
      value: formatDurationCompact(stats.avgTimeOnSiteSeconds),
      hint: "Μέχρι 2ω ανά συνεδρία",
      icon: Clock,
    },
    {
      key: "conversion",
      label: "Ποσοστό μετατροπής",
      value: `${stats.conversionRatePct.toLocaleString("el-GR", {
        minimumFractionDigits: 1,
        maximumFractionDigits: 1,
      })}%`,
      hint: `${stats.convertedSessionsInRange}/${stats.sessionsInRange} συνεδρίες`,
      icon: MousePointerClick,
      prominent: true,
      tone: stats.conversionRatePct >= 5 ? "success" : "default",
      trend: stats.trends?.conversionRatePct,
    },
  ];
}

export function AnalyticsStatCards({
  stats,
  loading,
}: {
  stats: AnalyticsStatCards | null;
  loading?: boolean;
}) {
  if (loading) {
    return (
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {Array.from({ length: 5 }).map((_, index) => (
          <div key={index} className={cn(premiumStatCard, "p-5")}>
            <Skeleton className="h-4 w-24" />
            <Skeleton className="mt-4 h-9 w-16" />
          </div>
        ))}
      </section>
    );
  }

  if (!stats) return null;

  const cards = buildStatCards(stats);

  return (
    <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <div
            key={card.key}
            className={cn(
              premiumStatCard,
              "relative overflow-hidden p-5",
              card.prominent && "ring-1 ring-gold-500/20",
              card.tone === "success" && "border-l-[3px] border-l-emerald-500",
            )}
          >
            <div className="flex items-start justify-between gap-2">
              <span
                className={cn(
                  "flex size-9 shrink-0 items-center justify-center rounded-xl",
                  card.prominent ? "bg-gold-500/15 text-gold-600" : "bg-navy-900/5 text-navy-900",
                )}
              >
                <Icon className="size-4" aria-hidden />
              </span>
              <TrendBadge trend={card.trend} />
            </div>
            <p className="mt-3 text-xs font-medium text-muted-foreground">{card.label}</p>
            <p
              className={cn(
                "mt-1 font-semibold tracking-tight text-kartex-navy",
                card.prominent ? "text-4xl" : "text-3xl",
              )}
            >
              {card.value}
            </p>
            {card.hint ? (
              <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">{card.hint}</p>
            ) : null}
          </div>
        );
      })}
    </section>
  );
}
