import { NextResponse } from "next/server";

import { createAdminClient } from "@/lib/supabase/admin";
import {
  mapProductMasterImageRow,
  sortImages,
} from "@/lib/website/product-master-images";
import {
  mapWebsiteProductMasterRow,
  WEBSITE_PRODUCT_MASTER_DETAIL_SELECT,
} from "@/lib/website/product-masters";
import {
  isNextResponse,
  requireWebsiteAdmin,
} from "@/lib/website/require-website-admin";

type RouteContext = {
  params: Promise<{ masterId: string; imageId: string }>;
};

async function refreshMaster(admin: ReturnType<typeof createAdminClient>, masterId: string) {
  const { data, error } = await admin
    .from("product_masters")
    .select(WEBSITE_PRODUCT_MASTER_DETAIL_SELECT)
    .eq("id", masterId)
    .single();

  if (error || !data) return null;
  return mapWebsiteProductMasterRow(
    data as Parameters<typeof mapWebsiteProductMasterRow>[0],
  );
}

export async function PATCH(request: Request, context: RouteContext) {
  const access = await requireWebsiteAdmin();
  if (isNextResponse(access)) return access;

  const { masterId, imageId } = await context.params;
  const body = (await request.json()) as {
    altText?: string | null;
    setPrimary?: boolean;
  };

  const admin = createAdminClient();

  if (body.setPrimary) {
    const { data: images, error: listError } = await admin
      .from("product_master_images")
      .select("id, sort_order")
      .eq("master_id", masterId)
      .order("sort_order")
      .order("created_at");

    if (listError) {
      return NextResponse.json({ error: listError.message }, { status: 500 });
    }

    const orderedIds = (images ?? []).map((row) => row.id as string);
    if (!orderedIds.includes(imageId)) {
      return NextResponse.json({ error: "Image not found." }, { status: 404 });
    }

    const reordered = [
      imageId,
      ...orderedIds.filter((id) => id !== imageId),
    ];

    for (let index = 0; index < reordered.length; index += 1) {
      const id = reordered[index];
      const { error: updateError } = await admin
        .from("product_master_images")
        .update({ sort_order: index })
        .eq("id", id)
        .eq("master_id", masterId);

      if (updateError) {
        return NextResponse.json({ error: updateError.message }, { status: 500 });
      }
    }

    const master = await refreshMaster(admin, masterId);
    return NextResponse.json({ master });
  }

  if (body.altText !== undefined) {
    const { data, error } = await admin
      .from("product_master_images")
      .update({ alt_text: body.altText?.trim() || null })
      .eq("id", imageId)
      .eq("master_id", masterId)
      .select("id, master_id, url, sort_order, alt_text, created_at")
      .maybeSingle();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!data) {
      return NextResponse.json({ error: "Image not found." }, { status: 404 });
    }

    return NextResponse.json({ image: mapProductMasterImageRow(data) });
  }

  return NextResponse.json({ error: "No supported action." }, { status: 400 });
}

export async function DELETE(_request: Request, context: RouteContext) {
  const access = await requireWebsiteAdmin();
  if (isNextResponse(access)) return access;

  const { masterId, imageId } = await context.params;
  const admin = createAdminClient();

  const { data: image, error: fetchError } = await admin
    .from("product_master_images")
    .select("id, url")
    .eq("id", imageId)
    .eq("master_id", masterId)
    .maybeSingle();

  if (fetchError) {
    return NextResponse.json({ error: fetchError.message }, { status: 500 });
  }

  if (!image) {
    return NextResponse.json({ error: "Image not found." }, { status: 404 });
  }

  const { error: deleteError } = await admin
    .from("product_master_images")
    .delete()
    .eq("id", imageId)
    .eq("master_id", masterId);

  if (deleteError) {
    return NextResponse.json({ error: deleteError.message }, { status: 500 });
  }

  const url = image.url as string;
  const marker = "/product-images/";
  const storageIndex = url.indexOf(marker);
  if (storageIndex >= 0) {
    const storagePath = url.slice(storageIndex + marker.length);
    await admin.storage.from("product-images").remove([storagePath]);
  }

  const { data: remaining, error: remainingError } = await admin
    .from("product_master_images")
    .select("id")
    .eq("master_id", masterId)
    .order("sort_order")
    .order("created_at");

  if (!remainingError && remaining) {
    for (let index = 0; index < remaining.length; index += 1) {
      await admin
        .from("product_master_images")
        .update({ sort_order: index })
        .eq("id", remaining[index].id);
    }
  }

  const master = await refreshMaster(admin, masterId);
  return NextResponse.json({ master });
}
