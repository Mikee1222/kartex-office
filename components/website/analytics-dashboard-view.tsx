"use client";

import { Activity, Globe, MousePointerClick, RefreshCw, Route } from "lucide-react";
import * as React from "react";

import { DataError } from "@/components/dashboard/data-error";
import { EmptyState } from "@/components/dashboard/empty-state";
import { AnalyticsBreakdownChart } from "@/components/website/analytics-breakdown-chart";
import {
  AnalyticsDataTable,
  formatPageAvgTime,
} from "@/components/website/analytics-data-table";
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

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

function hasAnyData(data: AnalyticsDashboardData): boolean {
  return (
    data.stats.sessionsInRange > 0 ||
    data.popularPages.length > 0 ||
    data.topCtas.length > 0 ||
    data.recentConversions.length > 0
  );
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

  const showEmpty =
    !loading && !error && data != null && !hasAnyData(data);

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

      <AnalyticsStatCards stats={data?.stats ?? null} loading={loading} />

      {showEmpty ? (
        <EmptyState
          icon={Globe}
          title="Δεν υπάρχουν δεδομένα analytics"
          description="Όταν επισκέπτες αλληλεπιδράσουν με το kartex.gr, οι επισκέψεις, οι πηγές και τα CTA θα εμφανίζονται εδώ."
        />
      ) : null}

      {!loading && data && hasAnyData(data) ? (
        <>
          <section className="space-y-3">
            <div>
              <h2 className="text-base font-semibold text-kartex-navy">Κατανομή επισκεπτών</h2>
              <p className="text-xs text-muted-foreground">
                Συσκευές, browsers και πηγές για την επιλεγμένη περίοδο.
              </p>
            </div>
            <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
              <AnalyticsBreakdownChart
                title="Συσκευές"
                description="Desktop, κινητό ή tablet."
                data={breakdownToAnalyticsChartPoints(data.devices)}
                preferDonut={preferDonutChart(data.devices.length)}
                totalLabel="συνεδρίες"
              />
              <AnalyticsBreakdownChart
                title="Browsers"
                description="Ποιο browser χρησιμοποιούν οι επισκέπτες."
                data={breakdownToAnalyticsChartPoints(data.browsers)}
                preferDonut={preferDonutChart(data.browsers.length)}
                totalLabel="συνεδρίες"
              />
              <AnalyticsBreakdownChart
                title="Πηγές επισκεψιμότητας"
                description="Απευθείας, Google, social ή άλλες πηγές."
                data={breakdownToAnalyticsChartPoints(data.referrers)}
                preferDonut={preferDonutChart(data.referrers.length)}
                totalLabel="συνεδρίες"
              />
            </div>
          </section>

          <section className="space-y-3">
            <div>
              <h2 className="text-base font-semibold text-kartex-navy">Συμπεριφορά στο site</h2>
              <p className="text-xs text-muted-foreground">
                Ποιες σελίδες βλέπουν και ποια κουμπιά κάνουν κλικ.
              </p>
            </div>
            <div className="grid gap-4 xl:grid-cols-2">
              <AnalyticsDataTable
                title="Δημοφιλέστερες σελίδες"
                description="Κατάταξη pageviews με μέσο χρόνο ανά σελίδα."
                columns={[
                  { key: "path", label: "Διαδρομή" },
                  { key: "count", label: "Επισκέψεις", align: "right", barKey: true },
                  { key: "avgTime", label: "Μέσος χρόνος", align: "right" },
                ]}
                rows={data.popularPages.map((row) => ({
                  path: row.path,
                  count: row.count,
                  avgTime: formatPageAvgTime(row.avgTimeOnPageSeconds),
                }))}
                emptyTitle="Δεν υπάρχουν pageviews"
                emptyDescription="Δεν καταγράφηκαν προβολές σελίδων στην επιλεγμένη περίοδο."
              />

              <AnalyticsDataTable
                title="Δημοφιλέστερα CTA"
                description="Κλικ σε κουμπιά δράσης και τυπική σελίδα προέλευσης."
                columns={[
                  { key: "target", label: "CTA" },
                  { key: "count", label: "Κλικ", align: "right", barKey: true },
                  { key: "typicalPage", label: "Τυπική σελίδα" },
                ]}
                rows={data.topCtas.map((row) => ({
                  target: row.target,
                  count: row.count,
                  typicalPage: row.typicalPage,
                }))}
                emptyTitle="Δεν καταγράφηκαν κλικ CTA"
                emptyDescription="Τα κλικ σε κουμπιά προσφοράς και επικοινωνίας θα εμφανίζονται εδώ."
              />
            </div>
          </section>

          <section className="space-y-3">
            <div>
              <h2 className="text-base font-semibold text-kartex-navy">Μετατροπές</h2>
              <p className="text-xs text-muted-foreground">
                Αιτήματα προσφοράς με συνδεδεμένη διαδρομή επισκέπτη.
              </p>
            </div>
            <Card className={cn(premiumStatCard, "overflow-hidden border-border/80")}>
              <CardHeader className="border-b border-gray-100 bg-white">
                <CardTitle className="text-sm font-semibold text-kartex-navy">
                  Πρόσφατες μετατροπές
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                {data.recentConversions.length === 0 ? (
                  <EmptyState
                    icon={Route}
                    title="Δεν υπάρχουν μετατροπές"
                    description="Όταν ένα αίτημα προσφοράς συνδέεται με analytics session, η διαδρομή θα εμφανίζεται εδώ."
                    className="py-8"
                  />
                ) : (
                  <ul className="divide-y divide-gray-100">
                    {data.recentConversions.map((conversion) => (
                      <li
                        key={conversion.id}
                        className="p-5 transition-colors hover:bg-gold-500/[0.03]"
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
                        <p className="mt-3 flex items-start gap-1.5 text-xs leading-relaxed text-muted-foreground">
                          <MousePointerClick className="mt-0.5 size-3.5 shrink-0 text-gold-500/70" aria-hidden />
                          {conversion.journey.join(" → ")}
                        </p>
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>
          </section>
        </>
      ) : null}
    </div>
  );
}
