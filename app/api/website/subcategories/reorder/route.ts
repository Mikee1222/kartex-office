import { NextResponse } from "next/server";

import { createAdminClient } from "@/lib/supabase/admin";
import {
  isNextResponse,
  requireWebsiteAdmin,
} from "@/lib/website/require-website-admin";

export async function POST(request: Request) {
  const access = await requireWebsiteAdmin();
  if (isNextResponse(access)) return access;

  const body = (await request.json()) as {
    categoryId?: string;
    orderedIds?: string[];
  };

  if (!body.categoryId || !body.orderedIds?.length) {
    return NextResponse.json(
      { error: "categoryId and orderedIds required." },
      { status: 400 },
    );
  }

  const admin = createAdminClient();
  const { data: existing, error: listError } = await admin
    .from("website_subcategories")
    .select("id")
    .eq("category_id", body.categoryId);

  if (listError) {
    return NextResponse.json({ error: listError.message }, { status: 500 });
  }

  const existingIds = new Set((existing ?? []).map((row) => row.id as string));
  if (
    body.orderedIds.length !== existingIds.size ||
    body.orderedIds.some((id) => !existingIds.has(id))
  ) {
    return NextResponse.json({ error: "Invalid subcategory order." }, { status: 400 });
  }

  for (let index = 0; index < body.orderedIds.length; index += 1) {
    const id = body.orderedIds[index];
    const { error: updateError } = await admin
      .from("website_subcategories")
      .update({ sort_order: index })
      .eq("id", id)
      .eq("category_id", body.categoryId);

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }
  }

  return NextResponse.json({ ok: true });
}
