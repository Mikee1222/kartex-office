import { randomUUID } from "node:crypto";

import { NextResponse } from "next/server";

import { createAdminClient } from "@/lib/supabase/admin";
import {
  removeCatalogImageByUrl,
  resolveImageUploadBuffer,
  uploadCompressedCatalogImageFromBuffer,
} from "@/lib/website/catalog-image-storage";
import { UPLOAD_GENERIC_ERROR_EL } from "@/lib/website/constants";
import {
  isNextResponse,
  requireWebsiteAdmin,
} from "@/lib/website/require-website-admin";

type RouteContext = { params: Promise<{ categoryId: string }> };

export async function POST(request: Request, context: RouteContext) {
  const access = await requireWebsiteAdmin();
  if (isNextResponse(access)) return access;

  const { categoryId } = await context.params;

  const admin = createAdminClient();

  const bufferResult = await resolveImageUploadBuffer(request, admin);
  if ("error" in bufferResult) {
    return NextResponse.json(
      { error: bufferResult.error },
      { status: bufferResult.status },
    );
  }

  const { data: category, error: categoryError } = await admin
    .from("website_categories")
    .select("id, image_url")
    .eq("id", categoryId)
    .maybeSingle();

  if (categoryError) {
    return NextResponse.json({ error: categoryError.message }, { status: 500 });
  }

  if (!category) {
    return NextResponse.json({ error: "Category not found." }, { status: 404 });
  }

  const imageId = randomUUID();
  const storagePath = `categories/${categoryId}/${imageId}.jpg`;

  const uploadResult = await uploadCompressedCatalogImageFromBuffer(
    admin,
    storagePath,
    bufferResult.buffer,
  );
  if ("error" in uploadResult) {
    return NextResponse.json(
      { error: uploadResult.error },
      { status: uploadResult.status },
    );
  }

  await removeCatalogImageByUrl(admin, category.image_url);

  const { data: updated, error: updateError } = await admin
    .from("website_categories")
    .update({ image_url: uploadResult.publicUrl })
    .eq("id", categoryId)
    .select("id, image_url")
    .single();

  if (updateError) {
    await admin.storage.from("product-images").remove([storagePath]);
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  return NextResponse.json(
    { imageUrl: updated.image_url as string },
    { status: 201 },
  );
}

export async function DELETE(_request: Request, context: RouteContext) {
  const access = await requireWebsiteAdmin();
  if (isNextResponse(access)) return access;

  const { categoryId } = await context.params;
  const admin = createAdminClient();

  const { data: category, error: categoryError } = await admin
    .from("website_categories")
    .select("id, image_url")
    .eq("id", categoryId)
    .maybeSingle();

  if (categoryError) {
    return NextResponse.json({ error: categoryError.message }, { status: 500 });
  }

  if (!category) {
    return NextResponse.json({ error: "Category not found." }, { status: 404 });
  }

  await removeCatalogImageByUrl(admin, category.image_url);

  const { error: updateError } = await admin
    .from("website_categories")
    .update({ image_url: null })
    .eq("id", categoryId);

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  return NextResponse.json({ imageUrl: null });
}
