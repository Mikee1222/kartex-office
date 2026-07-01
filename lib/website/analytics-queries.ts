import { createAdminClient } from "@/lib/supabase/admin";
import {
  resolveAnalyticsDateBounds,
  type AnalyticsDatePreset,
} from "@/lib/website/analytics-date-range";
import { bucketReferrer } from "@/lib/website/analytics-referrer";
import type {
  AnalyticsBreakdownRow,
  AnalyticsCtaRow,
  AnalyticsConversionRow,
  AnalyticsDashboardData,
  AnalyticsPopularPageRow,
} from "@/lib/website/analytics-types";

const MAX_SESSION_DURATION_SECONDS = 2 * 60 * 60;
const ACTIVE_WINDOW_MS = 5 * 60 * 1000;

const DEVICE_LABELS: Record<string, string> = {
  mobile: "Κινητό",
  tablet: "Tablet",
  desktop: "Desktop",
};

type SessionRow = {
  session_id: string;
  started_at: string;
  last_seen_at: string;
  device_type: string | null;
  browser: string | null;
  referrer: string | null;
  landing_page: string | null;
};

type PageviewRow = {
  session_id: string;
  path: string;
  time_on_page_seconds: number | null;
};

type EventRow = {
  event_target: string | null;
  path: string | null;
};

type QuoteRow = {
  id: string;
  session_id: string | null;
  company_name: string;
  contact_name: string;
  created_at: string;
};

function sessionDurationSeconds(session: SessionRow): number {
  const start = new Date(session.started_at).getTime();
  const end = new Date(session.last_seen_at).getTime();
  if (Number.isNaN(start) || Number.isNaN(end) || end <= start) return 0;
  return Math.min(Math.round((end - start) / 1000), MAX_SESSION_DURATION_SECONDS);
}

function aggregatePopularPages(pageviews: PageviewRow[]): AnalyticsPopularPageRow[] {
  const map = new Map<string, { count: number; totalTime: number; timeCount: number }>();

  for (const row of pageviews) {
    const existing = map.get(row.path) ?? { count: 0, totalTime: 0, timeCount: 0 };
    existing.count += 1;
    if (row.time_on_page_seconds != null && row.time_on_page_seconds >= 0) {
      existing.totalTime += row.time_on_page_seconds;
      existing.timeCount += 1;
    }
    map.set(row.path, existing);
  }

  return [...map.entries()]
    .map(([path, stats]) => ({
      path,
      count: stats.count,
      avgTimeOnPageSeconds:
        stats.timeCount > 0 ? Math.round(stats.totalTime / stats.timeCount) : null,
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 15);
}

function aggregateBreakdown(
  sessions: SessionRow[],
  pickValue: (session: SessionRow) => string | null,
  labelMap?: Record<string, string>,
): AnalyticsBreakdownRow[] {
  const counts = new Map<string, number>();

  for (const session of sessions) {
    const raw = pickValue(session)?.trim() || "unknown";
    counts.set(raw, (counts.get(raw) ?? 0) + 1);
  }

  const total = sessions.length || 1;

  return [...counts.entries()]
    .map(([id, count]) => ({
      id,
      label: labelMap?.[id] ?? (id === "unknown" ? "Άγνωστο" : id),
      count,
      pct: Math.round((count / total) * 1000) / 10,
    }))
    .sort((a, b) => b.count - a.count);
}

function aggregateReferrers(sessions: SessionRow[]): AnalyticsBreakdownRow[] {
  const counts = new Map<string, { id: string; label: string; count: number }>();

  for (const session of sessions) {
    const { bucket, label } = bucketReferrer(session.referrer);
    const key = bucket === "other" ? `other:${label}` : bucket;
    const existing = counts.get(key) ?? { id: key, label, count: 0 };
    existing.count += 1;
    counts.set(key, existing);
  }

  const total = sessions.length || 1;

  return [...counts.values()]
    .map((row) => ({
      ...row,
      pct: Math.round((row.count / total) * 1000) / 10,
    }))
    .sort((a, b) => b.count - a.count);
}

function aggregateCtas(events: EventRow[]): AnalyticsCtaRow[] {
  const map = new Map<string, { count: number; pages: Map<string, number> }>();

  for (const event of events) {
    const target = event.event_target?.trim() || "Άγνωστο CTA";
    const existing = map.get(target) ?? { count: 0, pages: new Map<string, number>() };
    existing.count += 1;
    if (event.path) {
      existing.pages.set(event.path, (existing.pages.get(event.path) ?? 0) + 1);
    }
    map.set(target, existing);
  }

  return [...map.entries()]
    .map(([target, stats]) => {
      let typicalPage = "—";
      let maxCount = 0;
      for (const [path, count] of stats.pages) {
        if (count > maxCount) {
          maxCount = count;
          typicalPage = path;
        }
      }
      return { target, count: stats.count, typicalPage };
    })
    .sort((a, b) => b.count - a.count)
    .slice(0, 15);
}

async function loadRecentConversions(
  supabase: ReturnType<typeof createAdminClient>,
): Promise<AnalyticsConversionRow[]> {
  const { data: quotes, error } = await supabase
    .from("quote_requests")
    .select("id, session_id, company_name, contact_name, created_at")
    .not("session_id", "is", null)
    .order("created_at", { ascending: false })
    .limit(10);

  if (error || !quotes?.length) {
    return [];
  }

  const rows = quotes as QuoteRow[];
  const sessionIds = [...new Set(rows.map((row) => row.session_id).filter(Boolean))] as string[];

  const [{ data: sessions }, { data: pageviews }] = await Promise.all([
    supabase
      .from("analytics_sessions")
      .select("session_id, landing_page")
      .in("session_id", sessionIds),
    supabase
      .from("analytics_pageviews")
      .select("session_id, path, viewed_at")
      .in("session_id", sessionIds)
      .order("viewed_at", { ascending: true }),
  ]);

  const landingBySession = new Map<string, string | null>();
  for (const session of (sessions ?? []) as { session_id: string; landing_page: string | null }[]) {
    landingBySession.set(session.session_id, session.landing_page);
  }

  const pathsBySession = new Map<string, string[]>();
  for (const pageview of (pageviews ?? []) as {
    session_id: string;
    path: string;
    viewed_at: string;
  }[]) {
    const paths = pathsBySession.get(pageview.session_id) ?? [];
    if (paths[paths.length - 1] !== pageview.path) {
      paths.push(pageview.path);
    }
    pathsBySession.set(pageview.session_id, paths);
  }

  return rows.map((quote) => {
    const sessionId = quote.session_id!;
    const landing = landingBySession.get(sessionId);
    const paths = pathsBySession.get(sessionId) ?? [];
    const journey: string[] = [];

    if (landing) journey.push(landing);
    for (const path of paths) {
      if (journey[journey.length - 1] !== path) journey.push(path);
    }
    journey.push("Αίτημα προσφοράς");

    return {
      id: quote.id,
      submittedAt: quote.created_at,
      companyName: quote.company_name,
      contactName: quote.contact_name,
      journey,
    };
  });
}

export async function loadAnalyticsDashboard(
  preset: AnalyticsDatePreset,
): Promise<{ data: AnalyticsDashboardData | null; error: string | null }> {
  try {
    const supabase = createAdminClient();
    const bounds = resolveAnalyticsDateBounds(preset);
    const todayBounds = resolveAnalyticsDateBounds("today");
    const activeSince = new Date(Date.now() - ACTIVE_WINDOW_MS).toISOString();

    const [
      activeRes,
      visitsTodayRes,
      sessionsRes,
      pageviewsRes,
      eventsRes,
      conversionsRes,
    ] = await Promise.all([
      supabase
        .from("analytics_sessions")
        .select("session_id", { count: "exact", head: true })
        .gte("last_seen_at", activeSince),
      supabase
        .from("analytics_sessions")
        .select("session_id", { count: "exact", head: true })
        .gte("started_at", todayBounds.startIso)
        .lt("started_at", todayBounds.endIso),
      supabase
        .from("analytics_sessions")
        .select("session_id, started_at, last_seen_at, device_type, browser, referrer, landing_page")
        .gte("started_at", bounds.startIso)
        .lt("started_at", bounds.endIso),
      supabase
        .from("analytics_pageviews")
        .select("session_id, path, time_on_page_seconds")
        .gte("viewed_at", bounds.startIso)
        .lt("viewed_at", bounds.endIso),
      supabase
        .from("analytics_events")
        .select("event_target, path")
        .eq("event_type", "click")
        .gte("occurred_at", bounds.startIso)
        .lt("occurred_at", bounds.endIso),
      loadRecentConversions(supabase),
    ]);

    if (sessionsRes.error) {
      return { data: null, error: sessionsRes.error.message };
    }

    const sessions = (sessionsRes.data ?? []) as SessionRow[];
    const pageviews = (pageviewsRes.data ?? []) as PageviewRow[];
    const events = (eventsRes.data ?? []) as EventRow[];
    const sessionsInRange = sessions.length;

    const totalPageviews = pageviews.length;
    const pagesPerVisit = sessionsInRange > 0 ? totalPageviews / sessionsInRange : 0;

    const durations = sessions.map(sessionDurationSeconds).filter((value) => value > 0);
    const avgTimeOnSiteSeconds =
      durations.length > 0
        ? durations.reduce((sum, value) => sum + value, 0) / durations.length
        : 0;

    const sessionIdsInRange = sessions.map((session) => session.session_id);
    let convertedSessionsInRange = 0;

    if (sessionIdsInRange.length > 0) {
      const { data: convertedRows } = await supabase
        .from("quote_requests")
        .select("session_id")
        .in("session_id", sessionIdsInRange)
        .not("session_id", "is", null);

      convertedSessionsInRange = new Set(
        (convertedRows ?? [])
          .map((row) => row.session_id)
          .filter((value): value is string => Boolean(value)),
      ).size;
    }

    const conversionRatePct =
      sessionsInRange > 0 ? (convertedSessionsInRange / sessionsInRange) * 100 : 0;

    const data: AnalyticsDashboardData = {
      fetchedAt: new Date().toISOString(),
      rangeLabel: bounds.label,
      preset,
      stats: {
        activeSessionsNow: activeRes.count ?? 0,
        visitsToday: visitsTodayRes.count ?? 0,
        pagesPerVisit: Math.round(pagesPerVisit * 10) / 10,
        avgTimeOnSiteSeconds: Math.round(avgTimeOnSiteSeconds),
        conversionRatePct: Math.round(conversionRatePct * 10) / 10,
        sessionsInRange,
        convertedSessionsInRange,
      },
      popularPages: aggregatePopularPages(pageviews),
      devices: aggregateBreakdown(
        sessions,
        (session) => session.device_type,
        DEVICE_LABELS,
      ),
      browsers: aggregateBreakdown(sessions, (session) => session.browser),
      referrers: aggregateReferrers(sessions),
      topCtas: aggregateCtas(events),
      recentConversions: conversionsRes,
    };

    return { data, error: null };
  } catch (err) {
    return {
      data: null,
      error: err instanceof Error ? err.message : "Αποτυχία φόρτωσης analytics.",
    };
  }
}
