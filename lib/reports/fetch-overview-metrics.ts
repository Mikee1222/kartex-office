import { OrderStatus } from "@/components/orders/types";
import { getAthensDateString } from "@/lib/datetime";
import { parseStatusHistory } from "@/lib/orders/status-timeline";
import type { ReportDateRange } from "@/lib/reports/date-range";
import { bucketReferrer } from "@/lib/website/analytics-referrer";
import type { SupabaseClient } from "@supabase/supabase-js";

export type OverviewMetrics = {
  sessions: number;
  conversionRatePct: number;
  topReferrer: string;
  dolphinConversations: number;
  dolphinTokens: number;
  quotesTotal: number;
  quotesConverted: number;
  quoteConversionPct: number;
  deliveryOnTimePct: number | null;
  deliveryEligible: number;
};

function addDays(dateStr: string, days: number): string {
  const [year, month, day] = dateStr.split("-").map(Number);
  const date = new Date(Date.UTC(year!, month! - 1, day!, 12, 0, 0));
  date.setUTCDate(date.getUTCDate() + days);
  return getAthensDateString(date);
}

function rangeToIsoBounds(range: ReportDateRange): {
  startIso: string;
  endIso: string;
} {
  return {
    startIso: `${range.startDate}T00:00:00+02:00`,
    endIso: `${addDays(range.endDate, 1)}T00:00:00+02:00`,
  };
}

function getCompletedAthensDay(
  status: string,
  statusHistory: unknown,
  fallbackIso: string,
): string | null {
  if (status !== OrderStatus.Completed) return null;
  const history = parseStatusHistory(statusHistory);
  const completed = history.find((entry) => entry.status === OrderStatus.Completed);
  const iso = completed?.changed_at ?? fallbackIso;
  const parsed = new Date(iso);
  if (Number.isNaN(parsed.getTime())) return null;
  return getAthensDateString(parsed);
}

export async function fetchOverviewMetrics(
  supabase: SupabaseClient,
  range: ReportDateRange,
  ordersForDelivery: {
    status: string;
    delivery_date?: string | null;
    status_history?: unknown;
    created_at: string;
    updated_at?: string;
  }[],
): Promise<OverviewMetrics> {
  const { startIso, endIso } = rangeToIsoBounds(range);

  const [sessionsResult, sessionsDataResult, quotesResult, dolphinResult] =
    await Promise.all([
      supabase
        .from("analytics_sessions")
        .select("session_id", { count: "exact", head: true })
        .gte("started_at", startIso)
        .lt("started_at", endIso),
      supabase
        .from("analytics_sessions")
        .select("session_id, referrer")
        .gte("started_at", startIso)
        .lt("started_at", endIso),
      supabase
        .from("quote_requests")
        .select("id, order_id, created_at")
        .gte("created_at", startIso)
        .lt("created_at", endIso),
      supabase
      .from("dolphin_chat_token_totals")
      .select("total_input_tokens, total_output_tokens, updated_at")
      .gte("updated_at", startIso)
      .lt("updated_at", endIso),
    ]);

  const sessions = sessionsResult.count ?? 0;
  const sessionRows = (sessionsDataResult.data ?? []) as {
    session_id: string;
    referrer: string | null;
  }[];

  let convertedSessions = 0;
  if (sessionRows.length > 0) {
    const sessionIds = sessionRows.map((row) => row.session_id);
    const { data: convertedRows } = await supabase
      .from("quote_requests")
      .select("session_id")
      .in("session_id", sessionIds)
      .not("session_id", "is", null);
    convertedSessions = new Set(
      (convertedRows ?? [])
        .map((row) => (row as { session_id: string | null }).session_id)
        .filter((value): value is string => Boolean(value)),
    ).size;
  }

  const conversionRatePct =
    sessions > 0 ? Math.round((convertedSessions / sessions) * 1000) / 10 : 0;

  const referrerCounts = new Map<string, number>();
  for (const row of sessionRows) {
    const { label } = bucketReferrer(row.referrer);
    referrerCounts.set(label, (referrerCounts.get(label) ?? 0) + 1);
  }
  const topReferrer =
    [...referrerCounts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? "—";

  const quotes = (quotesResult.data ?? []) as {
    id: string;
    order_id: string | null;
  }[];
  const quotesTotal = quotes.length;
  const quotesConverted = quotes.filter((row) => row.order_id != null).length;
  const quoteConversionPct =
    quotesTotal > 0 ? Math.round((quotesConverted / quotesTotal) * 1000) / 10 : 0;

  const dolphinRows = (dolphinResult.data ?? []) as {
    total_input_tokens: number | string;
    total_output_tokens: number | string;
  }[];
  let dolphinTokens = 0;
  for (const row of dolphinRows) {
    dolphinTokens +=
      Number(row.total_input_tokens ?? 0) + Number(row.total_output_tokens ?? 0);
  }

  let deliveryEligible = 0;
  let deliveryOnTime = 0;
  for (const order of ordersForDelivery) {
    if (!order.delivery_date) continue;
    const deliveryDay = order.delivery_date.slice(0, 10);
    if (deliveryDay < range.startDate || deliveryDay > range.endDate) continue;
    if (order.status !== OrderStatus.Completed) continue;

    deliveryEligible += 1;
    const completedDay = getCompletedAthensDay(
      order.status,
      order.status_history,
      order.updated_at ?? order.created_at,
    );
    if (completedDay && completedDay <= deliveryDay) {
      deliveryOnTime += 1;
    }
  }

  const deliveryOnTimePct =
    deliveryEligible >= 3
      ? Math.round((deliveryOnTime / deliveryEligible) * 1000) / 10
      : null;

  return {
    sessions,
    conversionRatePct,
    topReferrer,
    dolphinConversations: dolphinRows.length,
    dolphinTokens,
    quotesTotal,
    quotesConverted,
    quoteConversionPct,
    deliveryOnTimePct,
    deliveryEligible,
  };
}
