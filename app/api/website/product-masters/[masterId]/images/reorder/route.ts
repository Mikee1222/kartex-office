import { NextResponse } from "next/server";

import { createAdminClient } from "@/lib/supabase/admin";
import {
  mapWebsiteProductMasterRow,
  WEBSITE_PRODUCT_MASTER_DETAIL_SELECT,
} from "@/lib/website/product-masters";
import {
  isNextResponse,
  requireWebsiteAdmin,
} from "@/lib/website/require-website-admin";

type RouteContext = { params: Promise<{ masterId: string }> };

export async function POST(request: Request, context: RouteContext) {
  const access = await requireWebsiteAdmin();
  if (isNextResponse(access)) return access;

  const { masterId } = await context.params;
  const body = (await request.json()) as { orderedIds?: string[] };

  if (!body.orderedIds?.length) {
    return NextResponse.json({ error: "orderedIds required." }, { status: 400 });
  }

  const admin = createAdminClient();
  const { data: existing, error: listError } = await admin
    .from("product_master_images")
    .select("id")
    .eq("master_id", masterId);

  if (listError) {
    return NextResponse.json({ error: listError.message }, { status: 500 });
  }

  const existingIds = new Set((existing ?? []).map((row) => row.id as string));
  if (
    body.orderedIds.length !== existingIds.size ||
    body.orderedIds.some((id) => !existingIds.has(id))
  ) {
    return NextResponse.json({ error: "Invalid image order." }, { status: 400 });
  }

  for (let index = 0; index < body.orderedIds.length; index += 1) {
    const id = body.orderedIds[index];
    const { error: updateError } = await admin
      .from("product_master_images")
      .update({ sort_order: index })
      .eq("id", id)
      .eq("master_id", masterId);

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }
  }

  const { data, error } = await admin
    .from("product_masters")
    .select(WEBSITE_PRODUCT_MASTER_DETAIL_SELECT)
    .eq("id", masterId)
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    master: mapWebsiteProductMasterRow(
      data as Parameters<typeof mapWebsiteProductMasterRow>[0],
    ),
  });
}
