import { NextResponse } from "next/server";

import { getSessionAccess } from "@/lib/auth/get-session-access";
import { hasPermission } from "@/lib/permissions";
import type { SessionAccess } from "@/lib/auth/get-session-access";
import type { PermissionKey } from "@/lib/permissions";

async function requireProductPermission(
  permission: PermissionKey,
): Promise<SessionAccess | NextResponse> {
  const access = await getSessionAccess();
  if (!access) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!hasPermission(access.role, permission, access.customPermissions)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  return access;
}

export async function requireProductViewer(): Promise<
  SessionAccess | NextResponse
> {
  return requireProductPermission("canViewProducts");
}

export async function requireProductEditor(): Promise<
  SessionAccess | NextResponse
> {
  return requireProductPermission("canCreateProducts");
}

export function isNextResponse(value: unknown): value is NextResponse {
  return value instanceof NextResponse;
}
