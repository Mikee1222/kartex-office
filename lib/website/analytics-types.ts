/** Shared analytics types for office dashboard (future) and website tracking. */

export type AnalyticsDeviceType = "mobile" | "tablet" | "desktop";

export type AnalyticsEventType =
  | "click"
  | "quote_submitted"
  | "add_to_quote_cart"
  | "pageview"
  | "session_start";

export type AnalyticsSessionRow = {
  id: string;
  session_id: string;
  started_at: string;
  last_seen_at: string;
  ended_at: string | null;
  ip_anonymized: string | null;
  user_agent: string | null;
  device_type: AnalyticsDeviceType | null;
  browser: string | null;
  os: string | null;
  country: string | null;
  referrer: string | null;
  landing_page: string | null;
  locale: string | null;
};

export type AnalyticsPageviewRow = {
  id: string;
  session_id: string;
  path: string;
  viewed_at: string;
  time_on_page_seconds: number | null;
};

export type AnalyticsEventRow = {
  id: string;
  session_id: string;
  event_type: AnalyticsEventType | string;
  event_target: string | null;
  path: string | null;
  occurred_at: string;
  metadata: Record<string, unknown>;
};

export type AnalyticsTrackAction =
  | "session_upsert"
  | "pageview"
  | "heartbeat"
  | "event"
  | "pageview_duration_update";

export type AnalyticsSessionUpsertPayload = {
  action: "session_upsert";
  session_id: string;
  user_agent?: string;
  device_type?: AnalyticsDeviceType;
  browser?: string;
  os?: string;
  referrer?: string;
  landing_page?: string;
  locale?: string;
};

export type AnalyticsPageviewPayload = {
  action: "pageview";
  session_id: string;
  pageview_id: string;
  path: string;
};

export type AnalyticsHeartbeatPayload = {
  action: "heartbeat";
  session_id: string;
};

export type AnalyticsEventPayload = {
  action: "event";
  session_id: string;
  event_type: AnalyticsEventType | string;
  event_target?: string;
  path?: string;
  metadata?: Record<string, unknown>;
};

export type AnalyticsPageviewDurationPayload = {
  action: "pageview_duration_update";
  session_id: string;
  pageview_id: string;
  time_on_page_seconds: number;
};

export type AnalyticsTrackPayload =
  | AnalyticsSessionUpsertPayload
  | AnalyticsPageviewPayload
  | AnalyticsHeartbeatPayload
  | AnalyticsEventPayload
  | AnalyticsPageviewDurationPayload;

export type AnalyticsDatePreset = "today" | "7d" | "30d";

export type AnalyticsStatTrend = {
  /** Percent change vs comparison window; null when comparison baseline is zero. */
  pctChange: number | null;
  /** Human label for the comparison, e.g. "από χθες". */
  comparisonLabel: string;
};

export type AnalyticsStatCards = {
  activeSessionsNow: number;
  /** Distinct sessions that started today (Europe/Athens), regardless of selected range. */
  visitsToday: number;
  pagesPerVisit: number;
  avgTimeOnSiteSeconds: number;
  conversionRatePct: number;
  /** Sessions in the selected date range (conversion denominator). */
  sessionsInRange: number;
  convertedSessionsInRange: number;
  /** Optional day-over-day trends (today preset only). */
  trends?: {
    visitsToday?: AnalyticsStatTrend;
    pagesPerVisit?: AnalyticsStatTrend;
    conversionRatePct?: AnalyticsStatTrend;
  };
};

export type AnalyticsPopularPageRow = {
  path: string;
  /** Resolved product clean_name when path is /{locale}/products/{uuid}. */
  displayPath: string;
  count: number;
  avgTimeOnPageSeconds: number | null;
};

export type AnalyticsBreakdownRow = {
  id: string;
  label: string;
  count: number;
  pct: number;
};

export type AnalyticsCtaRow = {
  target: string;
  count: number;
  typicalPage: string;
  displayTypicalPage: string;
};

export type AnalyticsConversionRow = {
  id: string;
  submittedAt: string;
  companyName: string;
  contactName: string;
  journey: string[];
};

export type AnalyticsDashboardData = {
  fetchedAt: string;
  rangeLabel: string;
  preset: AnalyticsDatePreset;
  stats: AnalyticsStatCards;
  popularPages: AnalyticsPopularPageRow[];
  devices: AnalyticsBreakdownRow[];
  browsers: AnalyticsBreakdownRow[];
  referrers: AnalyticsBreakdownRow[];
  topCtas: AnalyticsCtaRow[];
  recentConversions: AnalyticsConversionRow[];
};
