import { NextResponse } from "next/server";

import { getSessionAccess } from "@/lib/auth/get-session-access";
import { hasPermission } from "@/lib/permissions";
import { loadAnalyticsDashboard } from "@/lib/website/analytics-queries";
import type { AnalyticsDatePreset } from "@/lib/website/analytics-types";

const VALID_PRESETS = new Set<AnalyticsDatePreset>(["today", "7d", "30d"]);

function parsePreset(value: string | null): AnalyticsDatePreset {
  if (value && VALID_PRESETS.has(value as AnalyticsDatePreset)) {
    return value as AnalyticsDatePreset;
  }
  return "today";
}

export async function GET(request: Request) {
  const access = await getSessionAccess();
  if (!access) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!hasPermission(access.role, "canManageUsers", access.customPermissions)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const preset = parsePreset(searchParams.get("range"));
  const { data, error } = await loadAnalyticsDashboard(preset);

  if (error || !data) {
    return NextResponse.json({ error: error ?? "Failed to load analytics." }, { status: 500 });
  }

  return NextResponse.json(data);
}
