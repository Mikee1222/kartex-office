import { NextResponse } from "next/server";

import { submitZReport } from "@/lib/mydata/mydata-service";
import {
  getReportByDate,
  issueReport,
  updateMydataStatus,
} from "@/lib/z-report/z-report-service";
import { getAthensDateString } from "@/lib/datetime";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let reportDate = getAthensDateString();
  try {
    const body = (await request.json()) as { reportDate?: string };
    if (body.reportDate) reportDate = body.reportDate;
  } catch {
    // default today
  }

  try {
    let report = await getReportByDate(supabase, reportDate);
    if (!report?.issuedAt) {
      report = await issueReport(supabase, { reportDate, userId: user.id });
    }

    if (!report) {
      return NextResponse.json(
        { error: "Δεν βρέθηκε ημερήσιο Ζ για αυτή την ημερομηνία." },
        { status: 404 },
      );
    }

    if (report.mydataStatus === "submitted" && report.mydataMark) {
      return NextResponse.json({
        report,
        message: "Ήδη υποβλήθηκε στο myDATA.",
      });
    }

    const result = await submitZReport(report);

    if (!result.success) {
      const updated = await updateMydataStatus(supabase, reportDate, {
        mydata_status: "error",
        mydata_error: result.error,
        mydata_submitted_at: new Date().toISOString(),
      });
      return NextResponse.json(
        { report: updated, error: result.error },
        { status: 502 },
      );
    }

    const updated = await updateMydataStatus(supabase, reportDate, {
      mydata_status: "submitted",
      mydata_mark: result.mark,
      mydata_submitted_at: new Date().toISOString(),
      mydata_error: null,
    });

    return NextResponse.json({ report: updated, mark: result.mark });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Σφάλμα";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
