import type { SupabaseClient } from "@supabase/supabase-js";

import { getAthensDateString } from "@/lib/datetime";

import { computeDailyZReport } from "./compute-daily-z";
import type {
  CategoryBreakdownItem,
  CustomerTypeBreakdownItem,
  DailyZComputation,
  ZReport,
  ZReportRow,
} from "./types";

function toNumber(value: number | string | null | undefined): number {
  if (value === null || value === undefined) return 0;
  const n = typeof value === "number" ? value : Number.parseFloat(String(value));
  return Number.isFinite(n) ? n : 0;
}

export function mapZReportRow(row: ZReportRow): ZReport {
  return {
    id: row.id,
    reportDate: row.report_date,
    totalOrders: row.total_orders,
    cancelledOrders: row.cancelled_orders,
    totalRevenue: toNumber(row.total_revenue),
    totalVat: toNumber(row.total_vat),
    netAmount: toNumber(row.net_amount),
    categoryBreakdown: (row.category_breakdown ?? []) as CategoryBreakdownItem[],
    customerTypeBreakdown: (row.customer_type_breakdown ??
      []) as CustomerTypeBreakdownItem[],
    mydataStatus: row.mydata_status,
    mydataMark: row.mydata_mark,
    mydataSubmittedAt: row.mydata_submitted_at,
    mydataError: row.mydata_error,
    issuedAt: row.issued_at,
    issuedBy: row.issued_by,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function computationToInsert(
  computation: DailyZComputation,
  issuedBy: string | null,
  issued: boolean,
) {
  return {
    report_date: computation.reportDate,
    total_orders: computation.totalOrders,
    cancelled_orders: computation.cancelledOrders,
    total_revenue: computation.totalRevenue,
    total_vat: computation.totalVat,
    net_amount: computation.netAmount,
    category_breakdown: computation.categoryBreakdown,
    customer_type_breakdown: computation.customerTypeBreakdown,
    ...(issued
      ? {
          issued_at: new Date().toISOString(),
          issued_by: issuedBy,
        }
      : {}),
  };
}

export async function getReportByDate(
  supabase: SupabaseClient,
  reportDate: string,
): Promise<ZReport | null> {
  const { data, error } = await supabase
    .from("z_reports")
    .select("*")
    .eq("report_date", reportDate)
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!data) return null;
  return mapZReportRow(data as ZReportRow);
}

export async function listReports(
  supabase: SupabaseClient,
  options?: { limit?: number },
): Promise<ZReport[]> {
  const limit = options?.limit ?? 90;
  const { data, error } = await supabase
    .from("z_reports")
    .select("*")
    .order("report_date", { ascending: false })
    .limit(limit);

  if (error) throw new Error(error.message);
  return (data ?? []).map((row) => mapZReportRow(row as ZReportRow));
}

export async function createOrGetTodayReport(
  supabase: SupabaseClient,
): Promise<{ report: ZReport | null; computation: DailyZComputation }> {
  const reportDate = getAthensDateString();
  const existing = await getReportByDate(supabase, reportDate);
  const computation = await computeDailyZReport(supabase, reportDate);
  return { report: existing, computation };
}

export async function issueReport(
  supabase: SupabaseClient,
  options: { reportDate?: string; userId: string },
): Promise<ZReport> {
  const reportDate = options.reportDate ?? getAthensDateString();
  const computation = await computeDailyZReport(supabase, reportDate);

  const payload = computationToInsert(computation, options.userId, true);

  const { data, error } = await supabase
    .from("z_reports")
    .upsert(payload, { onConflict: "report_date" })
    .select("*")
    .single();

  if (error || !data) {
    throw new Error(error?.message ?? "Αποτυχία έκδοσης Ζ.");
  }

  return mapZReportRow(data as ZReportRow);
}

export async function updateMydataStatus(
  supabase: SupabaseClient,
  reportDate: string,
  update: {
    mydata_status: "pending" | "submitted" | "error";
    mydata_mark?: string | null;
    mydata_submitted_at?: string | null;
    mydata_error?: string | null;
  },
): Promise<ZReport> {
  const { data, error } = await supabase
    .from("z_reports")
    .update(update)
    .eq("report_date", reportDate)
    .select("*")
    .single();

  if (error || !data) {
    throw new Error(error?.message ?? "Αποτυχία ενημέρωσης myDATA.");
  }

  return mapZReportRow(data as ZReportRow);
}

export async function upsertReportFromComputation(
  supabase: SupabaseClient,
  computation: DailyZComputation,
  issued: boolean,
  userId: string | null,
): Promise<ZReport> {
  const payload = computationToInsert(computation, userId, issued);

  const { data, error } = await supabase
    .from("z_reports")
    .upsert(payload, { onConflict: "report_date" })
    .select("*")
    .single();

  if (error || !data) {
    throw new Error(error?.message ?? "Αποτυχία αποθήκευσης Ζ.");
  }

  return mapZReportRow(data as ZReportRow);
}
