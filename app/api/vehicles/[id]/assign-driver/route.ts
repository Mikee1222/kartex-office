import { NextResponse } from "next/server";

import { getSessionAccess } from "@/lib/auth/get-session-access";
import { createAdminClient } from "@/lib/supabase/admin";

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(request: Request, context: RouteContext) {
  const access = await getSessionAccess();
  if (!access) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: vehicleId } = await context.params;
  const body = (await request.json()) as { driverUserId?: string | null };
  const driverUserId = body.driverUserId ?? null;

  const admin = createAdminClient();

  const { data: currentAssignments, error: listError } = await admin
    .from("user_roles")
    .select("user_id")
    .eq("vehicle_id", vehicleId)
    .eq("role", "driver");

  if (listError) {
    return NextResponse.json({ error: listError.message }, { status: 500 });
  }

  const previousDriverIds = (currentAssignments ?? []).map((row) => row.user_id);

  if (previousDriverIds.length > 0) {
    const { error: clearError } = await admin
      .from("user_roles")
      .update({ vehicle_id: null })
      .in("user_id", previousDriverIds);

    if (clearError) {
      return NextResponse.json({ error: clearError.message }, { status: 500 });
    }
  }

  if (driverUserId) {
    const { error: assignError } = await admin
      .from("user_roles")
      .update({ vehicle_id: vehicleId })
      .eq("user_id", driverUserId)
      .eq("role", "driver");

    if (assignError) {
      return NextResponse.json({ error: assignError.message }, { status: 500 });
    }
  }

  return NextResponse.json({ ok: true });
}
