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

export async function GET(_request: Request, context: RouteContext) {
  const access = await requireWebsiteAdmin();
  if (isNextResponse(access)) return access;

  const { masterId } = await context.params;
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("product_masters")
    .select(WEBSITE_PRODUCT_MASTER_DETAIL_SELECT)
    .eq("id", masterId)
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (!data) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({
    master: mapWebsiteProductMasterRow(
      data as Parameters<typeof mapWebsiteProductMasterRow>[0],
    ),
  });
}

export async function PATCH(request: Request, context: RouteContext) {
  const access = await requireWebsiteAdmin();
  if (isNextResponse(access)) return access;

  const { masterId } = await context.params;
  const body = (await request.json()) as {
    cleanName?: string;
    category?: string;
    subcategory?: string | null;
    qualityGrade?: string | null;
    material?: string | null;
    description?: string | null;
    isActive?: boolean;
  };

  const patch: Record<string, unknown> = {};
  if (body.cleanName !== undefined) {
    const trimmed = body.cleanName.trim();
    if (!trimmed) {
      return NextResponse.json({ error: "Name is required." }, { status: 400 });
    }
    patch.clean_name = trimmed;
  }
  if (body.category !== undefined) {
    const trimmed = body.category.trim();
    if (!trimmed) {
      return NextResponse.json({ error: "Category is required." }, { status: 400 });
    }
    patch.category = trimmed;
  }
  if (body.subcategory !== undefined) {
    patch.subcategory = body.subcategory?.trim() || null;
  }
  if (body.qualityGrade !== undefined) {
    patch.quality_grade = body.qualityGrade?.trim() || null;
  }
  if (body.material !== undefined) {
    patch.material = body.material?.trim() || null;
  }
  if (body.description !== undefined) {
    patch.description = body.description?.trim() || null;
  }
  if (body.isActive !== undefined) {
    patch.is_active = body.isActive;
  }

  if (Object.keys(patch).length === 0) {
    return NextResponse.json({ error: "No fields to update." }, { status: 400 });
  }

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("product_masters")
    .update(patch)
    .eq("id", masterId)
    .select(WEBSITE_PRODUCT_MASTER_DETAIL_SELECT)
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
