"use client";

import { Activity, Globe, RefreshCw } from "lucide-react";
import * as React from "react";

import { DataError } from "@/components/dashboard/data-error";
import {
  HorizontalBarChart,
  ReportKpiRow,
  ReportTable,
} from "@/components/reports/report-ui";
import { PageHeader } from "@/components/ui/page-header";
import { formatReportDateTime } from "@/lib/reports/date-range";
import { breakdownToChartPoints } from "@/lib/website/analytics-chart-utils";
import { formatDurationSeconds } from "@/lib/website/analytics-date-range";
import type {
  AnalyticsDashboardData,
  AnalyticsDatePreset,
} from "@/lib/website/analytics-types";
import type { ReportKpi } from "@/lib/reports/compute-analytics";
import {
  premiumFilterTabActive,
  premiumFilterTabInactive,
  premiumPageSubtitle,
  premiumStatCard,
} from "@/lib/ui/premium-styles";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const POLL_MS = 45_000;

const RANGE_TABS: { id: AnalyticsDatePreset; label: string }[] = [
  { id: "today", label: "Σήμερα" },
  { id: "7d", label: "Τελευταίες 7 ημέρες" },
  { id: "30d", label: "Τελευταίες 30 ημέρες" },
];

function buildKpis(data: AnalyticsDashboardData): ReportKpi[] {
  return [
    {
      key: "active",
      label: "Ενεργές συνεδρίες τώρα",
      value: String(data.stats.activeSessionsNow),
      tone: data.stats.activeSessionsNow > 0 ? "success" : "default",
      hint: "Τελευταία 5 λεπτά",
    },
    {
      key: "visits",
      label: "Επισκέψεις σήμερα",
      value: String(data.stats.visitsToday),
      hint: "Europe/Athens",
    },
    {
      key: "pages",
      label: "Σελίδες/επίσκεψη",
      value: data.stats.pagesPerVisit.toLocaleString("el-GR", {
        minimumFractionDigits: 1,
        maximumFractionDigits: 1,
      }),
      hint: data.rangeLabel,
    },
    {
      key: "duration",
      label: "Μέσος χρόνος στο site",
      value: formatDurationSeconds(data.stats.avgTimeOnSiteSeconds),
      hint: `Μέγ. 2ω — ${data.rangeLabel}`,
    },
    {
      key: "conversion",
      label: "Ποσοστό μετατροπής",
      value: `${data.stats.conversionRatePct.toLocaleString("el-GR", {
        minimumFractionDigits: 1,
        maximumFractionDigits: 1,
      })}%`,
      tone: data.stats.conversionRatePct >= 5 ? "success" : "default",
      hint: `${data.stats.convertedSessionsInRange}/${data.stats.sessionsInRange} συνεδρίες`,
    },
  ];
}

function secondsAgoLabel(fetchedAt: string, now: number): string {
  const seconds = Math.max(0, Math.floor((now - new Date(fetchedAt).getTime()) / 1000));
  if (seconds < 5) return "μόλις τώρα";
  return `${seconds} δευτερόλεπτα`;
}

export function AnalyticsDashboardView() {
  const [preset, setPreset] = React.useState<AnalyticsDatePreset>("today");
  const [data, setData] = React.useState<AnalyticsDashboardData | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [refreshing, setRefreshing] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [now, setNow] = React.useState(() => Date.now());

  const load = React.useCallback(
    async (options?: { silent?: boolean }) => {
      if (!options?.silent) {
        setLoading(true);
      } else {
        setRefreshing(true);
      }
      setError(null);

      try {
        const res = await fetch(`/api/analytics?range=${preset}`, { cache: "no-store" });
        const json = (await res.json()) as AnalyticsDashboardData & { error?: string };

        if (!res.ok) {
          setError(json.error ?? "Αποτυχία φόρτωσης.");
          setData(null);
        } else {
          setData(json);
        }
      } catch {
        setError("Αποτυχία φόρτωσης.");
        setData(null);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [preset],
  );

  React.useEffect(() => {
    void load();
  }, [load]);

  React.useEffect(() => {
    const interval = window.setInterval(() => {
      setNow(Date.now());
    }, 1000);
    return () => window.clearInterval(interval);
  }, []);

  React.useEffect(() => {
    const interval = window.setInterval(() => {
      void load({ silent: true });
    }, POLL_MS);
    return () => window.clearInterval(interval);
  }, [load]);

  const kpis = data ? buildKpis(data) : [];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Website Analytics"
        subtitle={
          <span className={cn(premiumPageSubtitle, "inline-flex items-center gap-1.5")}>
            <Globe className="size-3.5 shrink-0 text-gold-500/70" aria-hidden />
            Στατιστικά επισκεψιμότητας kartex.gr — {data?.rangeLabel ?? "Σήμερα"}
          </span>
        }
        action={
          <div className="flex flex-wrap items-center gap-3">
            {data ? (
              <span className="text-xs text-gray-400">
                Ενημερώθηκε πριν {secondsAgoLabel(data.fetchedAt, now)}
              </span>
            ) : null}
            <span
              className={cn(
                "inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold",
                refreshing
                  ? "border-amber-200 bg-amber-50 text-amber-700"
                  : "border-emerald-200 bg-emerald-50 text-emerald-700",
              )}
            >
              <Activity className="size-3.5" aria-hidden />
              {refreshing ? "Ενημέρωση…" : "Live polling"}
            </span>
            <button
              type="button"
              onClick={() => void load({ silent: true })}
              disabled={refreshing || loading}
              className={cn(
                "inline-flex items-center gap-2 rounded-lg border border-gold-500/30 bg-white px-4 py-2.5 text-sm font-semibold text-navy-900 shadow-sm transition-all duration-200",
                "hover:border-gold-500/50 hover:bg-gold-500/[0.04] hover:shadow-md",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-500/40",
                "disabled:pointer-events-none disabled:opacity-60",
              )}
            >
              <RefreshCw
                className={cn("size-4 text-gold-500", refreshing && "animate-spin")}
                aria-hidden
              />
              Ανανέωση
            </button>
          </div>
        }
      />

      <div className="flex flex-wrap gap-2">
        {RANGE_TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setPreset(tab.id)}
            className={preset === tab.id ? premiumFilterTabActive : premiumFilterTabInactive}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {error ? <DataError message={error} onRetry={() => void load()} /> : null}

      <ReportKpiRow kpis={kpis} loading={loading} />

      {!loading && data ? (
        <>
          <div className="grid gap-4 lg:grid-cols-2">
            <HorizontalBarChart
              title="Συσκευές (%)"
              data={breakdownToChartPoints(data.devices)}
            />
            <HorizontalBarChart
              title="Browsers (%)"
              data={breakdownToChartPoints(data.browsers)}
            />
          </div>

          <HorizontalBarChart
            title="Πηγές επισκεψιμότητας (%)"
            data={breakdownToChartPoints(data.referrers)}
          />

          <ReportTable
            title="Δημοφιλέστερες σελίδες"
            columns={[
              { key: "path", label: "Διαδρομή" },
              { key: "count", label: "Επισκέψεις", align: "right" },
              { key: "avgTime", label: "Μέσος χρόνος", align: "right" },
            ]}
            rows={data.popularPages.map((row) => ({
              path: row.path,
              count: row.count,
              avgTime:
                row.avgTimeOnPageSeconds != null
                  ? formatDurationSeconds(row.avgTimeOnPageSeconds)
                  : "—",
            }))}
            emptyMessage="Δεν υπάρχουν pageviews στην επιλεγμένη περίοδο."
          />

          <ReportTable
            title="Δημοφιλέστερα CTA"
            columns={[
              { key: "target", label: "CTA" },
              { key: "count", label: "Κλικ", align: "right" },
              { key: "typicalPage", label: "Τυπική σελίδα" },
            ]}
            rows={data.topCtas.map((row) => ({
              target: row.target,
              count: row.count,
              typicalPage: row.typicalPage,
            }))}
            emptyMessage="Δεν καταγράφηκαν κλικ CTA."
          />

          <Card className={cn(premiumStatCard, "border-border/80")}>
            <CardHeader>
              <CardTitle className="text-lg text-kartex-navy">Πρόσφατες μετατροπές</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {data.recentConversions.length === 0 ? (
                <p className="py-6 text-center text-sm text-muted-foreground">
                  Δεν υπάρχουν αιτήματα προσφοράς με συνδεδεμένη συνεδρία.
                </p>
              ) : (
                data.recentConversions.map((conversion) => (
                  <div
                    key={conversion.id}
                    className="rounded-xl border border-gray-100 bg-gray-50/60 p-4"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div>
                        <p className="font-semibold text-kartex-navy">{conversion.companyName}</p>
                        <p className="text-sm text-muted-foreground">{conversion.contactName}</p>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {formatReportDateTime(conversion.submittedAt)}
                      </p>
                    </div>
                    <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
                      {conversion.journey.join(" → ")}
                    </p>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </>
      ) : null}
    </div>
  );
}
