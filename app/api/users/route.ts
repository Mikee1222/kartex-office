import { NextResponse } from "next/server";

import { requireManageUsers } from "@/lib/auth/get-session-access";
import { createAdminClient } from "@/lib/supabase/admin";
import { normalizeUserRole, USER_ROLE_KEYS } from "@/lib/users/roles";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const gate = await requireManageUsers();
  if ("error" in gate) {
    return NextResponse.json({ error: gate.error }, { status: gate.status });
  }

  let body: { email?: string; password?: string; role?: string };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const email = body.email?.trim();
  const password = body.password;
  const role = normalizeUserRole(body.role);

  if (!email || !password) {
    return NextResponse.json(
      { error: "Email και κωδικός είναι υποχρεωτικά." },
      { status: 400 },
    );
  }

  if (!USER_ROLE_KEYS.includes(role)) {
    return NextResponse.json({ error: "Μη έγκυρος ρόλος." }, { status: 400 });
  }

  try {
    const admin = createAdminClient();
    const { data, error } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        role,
        active: true,
      },
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    const newUser = data.user;
    if (newUser) {
      const { error: roleError } = await admin.from("user_roles").upsert(
        { user_id: newUser.id, role },
        { onConflict: "user_id" },
      );

      if (roleError) {
        return NextResponse.json(
          {
            error: `Ο χρήστης δημιουργήθηκε αλλά απέτυχε η αποθήκευση ρόλου: ${roleError.message}`,
          },
          { status: 500 },
        );
      }
    }

    return NextResponse.json({ user: newUser });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Admin client configuration error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
