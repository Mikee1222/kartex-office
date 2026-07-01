import { NextResponse } from "next/server";

import { getSessionAccess } from "@/lib/auth/get-session-access";
import { createAdminClient } from "@/lib/supabase/admin";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: Request, context: RouteContext) {
  const access = await getSessionAccess();
  if (!access) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("vehicles")
    .select("id, plate, model, max_boxes, notes, is_active")
    .eq("id", id)
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  if (!data) {
    return NextResponse.json({ error: "Δεν βρέθηκε το όχημα." }, { status: 404 });
  }

  return NextResponse.json({
    vehicle: {
      id: data.id,
      plate: data.plate,
      model: data.model ?? "",
      maxBoxes: data.max_boxes,
      notes: data.notes ?? "",
      isActive: data.is_active,
    },
  });
}

export async function PATCH(request: Request, context: RouteContext) {
  const access = await getSessionAccess();
  if (!access) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;
  const body = (await request.json()) as {
    plate?: string;
    model?: string;
    maxBoxes?: number;
    notes?: string;
    isActive?: boolean;
  };

  const updates: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };

  if (body.plate !== undefined) {
    const plate = body.plate.trim().toUpperCase();
    if (!plate) {
      return NextResponse.json({ error: "Η πινακίδα είναι υποχρεωτική." }, { status: 400 });
    }
    updates.plate = plate;
  }
  if (body.model !== undefined) updates.model = body.model.trim() || null;
  if (body.maxBoxes !== undefined) {
    if (body.maxBoxes < 1) {
      return NextResponse.json(
        { error: "Τα μέγιστα κιβώτια πρέπει να είναι ≥ 1." },
        { status: 400 },
      );
    }
    updates.max_boxes = body.maxBoxes;
  }
  if (body.notes !== undefined) updates.notes = body.notes.trim() || null;
  if (body.isActive !== undefined) updates.is_active = body.isActive;

  const admin = createAdminClient();
  const { error } = await admin.from("vehicles").update(updates).eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
