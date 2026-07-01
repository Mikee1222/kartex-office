import { NextResponse } from "next/server";

import { createOrGetTodayReport } from "@/lib/z-report/z-report-service";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { report, computation } = await createOrGetTodayReport(supabase);
    return NextResponse.json({
      report,
      computation,
      issued: Boolean(report?.issuedAt),
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Σφάλμα";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
