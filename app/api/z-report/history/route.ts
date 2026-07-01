import { NextResponse } from "next/server";

import { listReports } from "@/lib/z-report/z-report-service";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const limit = Number(searchParams.get("limit") ?? 90);

  try {
    const reports = await listReports(supabase, { limit });
    return NextResponse.json({ reports });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Σφάλμα";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
