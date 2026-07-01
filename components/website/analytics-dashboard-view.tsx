"use client";

import { Activity, Globe, MousePointerClick, RefreshCw, Sparkles } from "lucide-react";
import * as React from "react";

import { DataError } from "@/components/dashboard/data-error";
import { AnalyticsBreakdownChart } from "@/components/website/analytics-breakdown-chart";
import {
  AnalyticsDataTable,
  formatPageAvgTime,
} from "@/components/website/analytics-data-table";
import { AnalyticsEmptyState, AnalyticsSection } from "@/components/website/analytics-section";
import { AnalyticsStatCards } from "@/components/website/analytics-stat-cards";
import { PageHeader } from "@/components/ui/page-header";
import { formatReportDateTime } from "@/lib/reports/date-range";
import {
  breakdownToAnalyticsChartPoints,
  preferDonutChart,
} from "@/lib/website/analytics-chart-utils";
import type {
  AnalyticsDashboardData,
  AnalyticsDatePreset,
} from "@/lib/website/analytics-types";
import {
  premiumFilterTabActive,
  premiumFilterTabInactive,
  premiumPageSubtitle,
  premiumStatCard,
} from "@/lib/ui/premium-styles";
import { cn } from "@/lib/utils";

const POLL_MS = 45_000;

const RANGE_TABS: { id: AnalyticsDatePreset; label: string }[] = [
  { id: "today", label: "Σήμερα" },
  { id: "7d", label: "Τελευταίες 7 ημέρες" },
  { id: "30d", label: "Τελευταίες 30 ημέρες" },
];

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

  const devicePoints = data ? breakdownToAnalyticsChartPoints(data.devices) : [];
  const browserPoints = data ? breakdownToAnalyticsChartPoints(data.browsers) : [];
  const referrerPoints = data ? breakdownToAnalyticsChartPoints(data.referrers) : [];

  return (
    <div className="space-y-8">
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

      <AnalyticsStatCards stats={data?.stats ?? null} loading={loading} />

      {!loading && data ? (
        <>
          <AnalyticsSection
            title="Κατανομή επισκεψιμότητας"
            description="Πώς φτάνουν οι επισκέπτες στο site και από ποια συσκευή περιηγούνται."
          >
            <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
              <AnalyticsBreakdownChart
                title="Συσκευές"
                description="Κινητό, tablet ή desktop ανά συνεδρία."
                data={devicePoints}
                totalLabel="συνεδρίες"
                preferDonut={preferDonutChart(devicePoints.length)}
              />
              <AnalyticsBreakdownChart
                title="Browsers"
                description="Φυλλομετρητές που χρησιμοποιήθηκαν."
                data={browserPoints}
                totalLabel="συνεδρίες"
                preferDonut={preferDonutChart(browserPoints.length)}
              />
              <AnalyticsBreakdownChart
                title="Πηγές επισκεψιμότητας"
                description="Απευθείας, Google, Facebook, Instagram ή άλλες πηγές."
                data={referrerPoints}
                totalLabel="συνεδρίες"
                preferDonut={preferDonutChart(referrerPoints.length)}
              />
            </div>
          </AnalyticsSection>

          <AnalyticsSection
            title="Σελίδες & CTA"
            description="Ποιες σελίδες τραβούν την προσοχή και ποια κουμπιά κάνουν κλικ."
          >
            <div className="grid gap-4 xl:grid-cols-2">
              <AnalyticsDataTable
                title="Δημοφιλέστερες σελίδες"
                description="Με μέσο χρόνο παραμονής ανά pageview."
                columns={[
                  { key: "path", label: "Διαδρομή" },
                  { key: "count", label: "Επισκέψεις", align: "right", barKey: true },
                  { key: "avgTime", label: "Μέσος χρόνος", align: "right" },
                ]}
                rows={data.popularPages.map((row) => ({
                  path: row.displayPath,
                  count: row.count,
                  avgTime: formatPageAvgTime(row.avgTimeOnPageSeconds),
                }))}
                emptyTitle="Δεν υπάρχουν pageviews"
                emptyDescription="Στην επιλεγμένη περίοδο δεν καταγράφηκαν προβολές σελίδων."
              />

              <AnalyticsDataTable
                title="Δημοφιλέστερα CTA"
                description="Κλικ σε κουμπιά και links μετατροπής."
                columns={[
                  { key: "target", label: "CTA" },
                  { key: "count", label: "Κλικ", align: "right", barKey: true },
                  { key: "typicalPage", label: "Τυπική σελίδα" },
                ]}
                rows={data.topCtas.map((row) => ({
                  target: row.target,
                  count: row.count,
                  typicalPage: row.displayTypicalPage,
                }))}
                emptyTitle="Δεν καταγράφηκαν κλικ CTA"
                emptyDescription="Δεν υπάρχουν events κλικ στην επιλεγμένη περίοδο."
              />
            </div>
          </AnalyticsSection>

          <AnalyticsSection
            title="Πρόσφατες μετατροπές"
            description="Αιτήματα προσφοράς με συνδεδεμένο ταξίδι χρήστη."
          >
            <div className={cn(premiumStatCard, "overflow-hidden p-0")}>
              {data.recentConversions.length === 0 ? (
                <AnalyticsEmptyState
                  icon={Sparkles}
                  title="Δεν υπάρχουν μετατροπές ακόμα"
                  description="Εμφανίζονται αιτήματα προσφοράς με συνδεδεμένη analytics συνεδρία."
                />
              ) : (
                <div className="space-y-3 p-5">
                  {data.recentConversions.map((conversion) => (
                    <div
                      key={conversion.id}
                      className="rounded-xl border border-gray-100 bg-gray-50/60 p-4 transition-colors duration-150 hover:border-gold-500/20 hover:bg-gold-500/[0.03]"
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
                  ))}
                </div>
              )}
            </div>
          </AnalyticsSection>
        </>
      ) : null}
    </div>
  );
}
