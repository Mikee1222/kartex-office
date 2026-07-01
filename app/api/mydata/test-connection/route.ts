import { NextResponse } from "next/server";

import { testConnection } from "@/lib/mydata/mydata-service";
import { createClient } from "@/lib/supabase/server";

export async function POST() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const result = await testConnection();
  return NextResponse.json(result, { status: result.ok ? 200 : 400 });
}
