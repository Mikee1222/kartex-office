import { renderToBuffer } from "@react-pdf/renderer";
import { NextResponse } from "next/server";

import { createZReportPdfDocument } from "@/components/z-report/z-report-pdf";
import { computeDailyZReport } from "@/lib/z-report/compute-daily-z";
import { getReportByDate } from "@/lib/z-report/z-report-service";
import type { ZReport } from "@/lib/z-report/types";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{ date: string }>;
};

function zReportFromComputation(
  computation: Awaited<ReturnType<typeof computeDailyZReport>>,
): ZReport {
  return {
    id: "preview",
    reportDate: computation.reportDate,
    totalOrders: computation.totalOrders,
    cancelledOrders: computation.cancelledOrders,
    totalRevenue: computation.totalRevenue,
    totalVat: computation.totalVat,
    netAmount: computation.netAmount,
    categoryBreakdown: computation.categoryBreakdown,
    customerTypeBreakdown: computation.customerTypeBreakdown,
    mydataStatus: "pending",
    mydataMark: null,
    mydataSubmittedAt: null,
    mydataError: null,
    issuedAt: null,
    issuedBy: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

export async function GET(_request: Request, context: RouteContext) {
  const { date } = await context.params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return NextResponse.json({ error: "Invalid date" }, { status: 400 });
  }

  try {
    let report = await getReportByDate(supabase, date);
    if (!report) {
      const computation = await computeDailyZReport(supabase, date);
      report = zReportFromComputation(computation);
    }

    const buffer = await renderToBuffer(createZReportPdfDocument(report));
    const filename = `Z-${date}.pdf`;

    return new NextResponse(new Uint8Array(buffer), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="${filename}"`,
        "Cache-Control": "private, no-cache",
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Σφάλμα";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
