import { NextResponse } from "next/server";

import { getSessionAccess } from "@/lib/auth/get-session-access";
import { hasPermission } from "@/lib/permissions";
import type { SessionAccess } from "@/lib/auth/get-session-access";

export async function requireWebsiteAdmin(): Promise<
  SessionAccess | NextResponse
> {
  const access = await getSessionAccess();
  if (!access) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!hasPermission(access.role, "canManageUsers", access.customPermissions)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  return access;
}

export function isNextResponse(value: unknown): value is NextResponse {
  return value instanceof NextResponse;
}
