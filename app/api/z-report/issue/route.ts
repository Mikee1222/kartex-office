import { NextResponse } from "next/server";

import { issueReport } from "@/lib/z-report/z-report-service";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let reportDate: string | undefined;
  try {
    const body = (await request.json()) as { reportDate?: string };
    reportDate = body.reportDate;
  } catch {
    reportDate = undefined;
  }

  try {
    const report = await issueReport(supabase, {
      reportDate,
      userId: user.id,
    });
    return NextResponse.json({ report });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Σφάλμα";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
