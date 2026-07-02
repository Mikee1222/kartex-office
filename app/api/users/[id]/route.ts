import { NextResponse } from "next/server";

import { ALL_PERMISSION_KEYS, normalizeAppRole } from "@/lib/permissions";
import { requireManageUsers } from "@/lib/auth/get-session-access";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{ id: string }>;
};

function sanitizeCustomPermissions(
  value: unknown,
): Record<string, boolean> | undefined {
  if (!value || typeof value !== "object") return undefined;
  const input = value as Record<string, boolean>;
  const output: Record<string, boolean> = {};
  for (const key of ALL_PERMISSION_KEYS) {
    if (typeof input[key] === "boolean") {
      output[key] = input[key];
    }
  }
  return Object.keys(output).length > 0 ? output : undefined;
}

export async function PATCH(request: Request, context: RouteContext) {
  const gate = await requireManageUsers();
  if ("error" in gate) {
    return NextResponse.json({ error: gate.error }, { status: gate.status });
  }

  const { id: userId } = await context.params;

  let body: {
    role?: string;
    active?: boolean;
    custom_permissions?: Record<string, boolean>;
  };

  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const role = body.role ? normalizeAppRole(body.role) : undefined;
  if (body.role && !role) {
    return NextResponse.json({ error: "Μη έγκυρος ρόλος." }, { status: 400 });
  }

  const customPermissions = sanitizeCustomPermissions(body.custom_permissions);

  try {
    const admin = createAdminClient();

    const { data: existing, error: fetchError } =
      await admin.auth.admin.getUserById(userId);

    if (fetchError || !existing.user) {
      return NextResponse.json({ error: "Ο χρήστης δεν βρέθηκε." }, { status: 404 });
    }

    const metadata: Record<string, unknown> = {
      ...(existing.user.user_metadata as Record<string, unknown>),
      ...(role ? { role } : {}),
      ...(typeof body.active === "boolean" ? { active: body.active } : {}),
    };

    if (body.custom_permissions !== undefined) {
      metadata.custom_permissions = customPermissions ?? {};
    }

    const { error: updateAuthError } = await admin.auth.admin.updateUserById(
      userId,
      {
        user_metadata: metadata,
      },
    );

    if (updateAuthError) {
      return NextResponse.json({ error: updateAuthError.message }, { status: 400 });
    }

    if (role) {
      const { error: roleError } = await admin.from("user_roles").upsert(
        { user_id: userId, role },
        { onConflict: "user_id" },
      );

      if (roleError) {
        return NextResponse.json({ error: roleError.message }, { status: 500 });
      }
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Admin client configuration error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  const gate = await requireManageUsers();
  if ("error" in gate) {
    return NextResponse.json({ error: gate.error }, { status: gate.status });
  }

  const { id: userId } = await context.params;

  if (gate.userId === userId) {
    return NextResponse.json(
      { error: "Δεν μπορείτε να διαγράψετε τον δικό σας λογαριασμό." },
      { status: 400 },
    );
  }

  try {
    const admin = createAdminClient();
    const { error } = await admin.auth.admin.deleteUser(userId);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Admin client configuration error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
