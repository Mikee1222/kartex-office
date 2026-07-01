import { randomUUID } from "node:crypto";

import { NextResponse } from "next/server";

import { createAdminClient } from "@/lib/supabase/admin";
import { PRODUCT_IMAGES_BUCKET } from "@/lib/website/constants";
import { compressProductImage } from "@/lib/website/compress-product-image";
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

type RouteContext = { params: Promise<{ masterId: string }> };

export async function POST(request: Request, context: RouteContext) {
  const access = await requireWebsiteAdmin();
  if (isNextResponse(access)) return access;

  const { masterId } = await context.params;
  const formData = await request.formData();
  const file = formData.get("file");

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Missing file." }, { status: 400 });
  }

  if (!file.type.startsWith("image/")) {
    return NextResponse.json({ error: "File must be an image." }, { status: 400 });
  }

  const admin = createAdminClient();

  const { data: master, error: masterError } = await admin
    .from("product_masters")
    .select("id, clean_name")
    .eq("id", masterId)
    .maybeSingle();

  if (masterError) {
    return NextResponse.json({ error: masterError.message }, { status: 500 });
  }

  if (!master) {
    return NextResponse.json({ error: "Master not found." }, { status: 404 });
  }

  const { count, error: countError } = await admin
    .from("product_master_images")
    .select("id", { count: "exact", head: true })
    .eq("master_id", masterId);

  if (countError) {
    return NextResponse.json({ error: countError.message }, { status: 500 });
  }

  const sortOrder = count ?? 0;
  const imageId = randomUUID();
  const storagePath = `masters/${masterId}/${imageId}.jpg`;

  let compressed: Buffer;
  try {
    const buffer = Buffer.from(await file.arrayBuffer());
    compressed = await compressProductImage(buffer);
  } catch {
    return NextResponse.json({ error: "Image processing failed." }, { status: 400 });
  }

  const { error: uploadError } = await admin.storage
    .from(PRODUCT_IMAGES_BUCKET)
    .upload(storagePath, compressed, {
      contentType: "image/jpeg",
      upsert: false,
    });

  if (uploadError) {
    return NextResponse.json({ error: uploadError.message }, { status: 500 });
  }

  const {
    data: { publicUrl },
  } = admin.storage.from(PRODUCT_IMAGES_BUCKET).getPublicUrl(storagePath);

  const { data: imageRow, error: insertError } = await admin
    .from("product_master_images")
    .insert({
      id: imageId,
      master_id: masterId,
      url: publicUrl,
      sort_order: sortOrder,
      alt_text: master.clean_name,
    })
    .select("id, master_id, url, sort_order, alt_text, created_at")
    .single();

  if (insertError) {
    await admin.storage.from(PRODUCT_IMAGES_BUCKET).remove([storagePath]);
    return NextResponse.json({ error: insertError.message }, { status: 500 });
  }

  const { data: refreshed, error: refreshError } = await admin
    .from("product_masters")
    .select(WEBSITE_PRODUCT_MASTER_DETAIL_SELECT)
    .eq("id", masterId)
    .single();

  if (refreshError) {
    return NextResponse.json(
      {
        image: mapProductMasterImageRow(imageRow),
        warning: refreshError.message,
      },
      { status: 201 },
    );
  }

  return NextResponse.json(
    {
      image: mapProductMasterImageRow(imageRow),
      master: mapWebsiteProductMasterRow(
        refreshed as Parameters<typeof mapWebsiteProductMasterRow>[0],
      ),
    },
    { status: 201 },
  );
}

export async function GET(_request: Request, context: RouteContext) {
  const access = await requireWebsiteAdmin();
  if (isNextResponse(access)) return access;

  const { masterId } = await context.params;
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("product_master_images")
    .select("id, master_id, url, sort_order, alt_text, created_at")
    .eq("master_id", masterId)
    .order("sort_order")
    .order("created_at");

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    images: sortImages((data ?? []).map((row) => mapProductMasterImageRow(row))),
  });
}
