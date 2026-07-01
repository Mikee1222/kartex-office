import { randomUUID } from "node:crypto";

import { NextResponse } from "next/server";

import { createAdminClient } from "@/lib/supabase/admin";
import {
  MAX_UPLOAD_BYTES,
  PRODUCT_IMAGES_BUCKET,
  UPLOAD_GENERIC_ERROR_EL,
  UPLOAD_MIME_ERROR_EL,
  UPLOAD_SIZE_ERROR_EL,
} from "@/lib/website/constants";
import {
  compressProductImage,
  isCompressedWithinLimit,
} from "@/lib/website/compress-product-image";
import {
  mapProductMasterImageRow,
  primaryImageUrl,
  sortImages,
} from "@/lib/website/product-master-images";
import { isAllowedProductImageFile } from "@/lib/website/product-image-upload";
import {
  mapWebsiteProductMasterRow,
  WEBSITE_PRODUCT_MASTER_DETAIL_SELECT,
} from "@/lib/website/product-masters";
import {
  isNextResponse,
  requireWebsiteAdmin,
} from "@/lib/website/require-website-admin";

type RouteContext = { params: Promise<{ masterId: string }> };

type GalleryMasterPayload = {
  images: ReturnType<typeof mapProductMasterImageRow>[];
  imageUrl: string | null;
};

async function loadGalleryMaster(
  admin: ReturnType<typeof createAdminClient>,
  masterId: string,
): Promise<GalleryMasterPayload | null> {
  const { data: imageRows, error: imagesError } = await admin
    .from("product_master_images")
    .select("id, master_id, url, sort_order, alt_text, created_at")
    .eq("master_id", masterId)
    .order("sort_order")
    .order("created_at");

  if (imagesError) {
    return null;
  }

  const images = sortImages(
    (imageRows ?? []).map((row) => mapProductMasterImageRow(row)),
  );

  const { data: masterRow } = await admin
    .from("product_masters")
    .select("image_url")
    .eq("id", masterId)
    .maybeSingle();

  return {
    images,
    imageUrl: primaryImageUrl(images, masterRow?.image_url?.trim() || null),
  };
}

function mapStorageUploadError(message: string): { status: number; error: string } {
  const normalized = message.toLowerCase();
  if (
    normalized.includes("too large") ||
    normalized.includes("file size") ||
    normalized.includes("payload too large") ||
    normalized.includes("exceeded")
  ) {
    return { status: 413, error: UPLOAD_SIZE_ERROR_EL };
  }

  if (normalized.includes("mime") || normalized.includes("content type")) {
    return { status: 415, error: UPLOAD_MIME_ERROR_EL };
  }

  return { status: 500, error: UPLOAD_GENERIC_ERROR_EL };
}

export async function POST(request: Request, context: RouteContext) {
  const access = await requireWebsiteAdmin();
  if (isNextResponse(access)) return access;

  const { masterId } = await context.params;

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json({ error: UPLOAD_GENERIC_ERROR_EL }, { status: 400 });
  }

  const file = formData.get("file");

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Missing file." }, { status: 400 });
  }

  if (!isAllowedProductImageFile(file)) {
    return NextResponse.json({ error: UPLOAD_MIME_ERROR_EL }, { status: 415 });
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
    if (buffer.length === 0) {
      return NextResponse.json({ error: UPLOAD_GENERIC_ERROR_EL }, { status: 400 });
    }

    compressed = await compressProductImage(buffer);
  } catch {
    return NextResponse.json({ error: UPLOAD_GENERIC_ERROR_EL }, { status: 400 });
  }

  if (!isCompressedWithinLimit(compressed)) {
    return NextResponse.json({ error: UPLOAD_SIZE_ERROR_EL }, { status: 413 });
  }

  const { error: uploadError } = await admin.storage
    .from(PRODUCT_IMAGES_BUCKET)
    .upload(storagePath, compressed, {
      contentType: "image/jpeg",
      upsert: false,
    });

  if (uploadError) {
    const mapped = mapStorageUploadError(uploadError.message);
    return NextResponse.json({ error: mapped.error }, { status: mapped.status });
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

  const mappedImage = mapProductMasterImageRow(imageRow);

  const { data: refreshed, error: refreshError } = await admin
    .from("product_masters")
    .select(WEBSITE_PRODUCT_MASTER_DETAIL_SELECT)
    .eq("id", masterId)
    .single();

  if (!refreshError && refreshed) {
    return NextResponse.json(
      {
        image: mappedImage,
        master: mapWebsiteProductMasterRow(
          refreshed as Parameters<typeof mapWebsiteProductMasterRow>[0],
        ),
      },
      { status: 201 },
    );
  }

  const galleryMaster = await loadGalleryMaster(admin, masterId);
  if (!galleryMaster) {
    return NextResponse.json(
      {
        image: mappedImage,
        error: refreshError?.message ?? UPLOAD_GENERIC_ERROR_EL,
      },
      { status: 500 },
    );
  }

  return NextResponse.json(
    {
      image: mappedImage,
      master: galleryMaster,
      warning: refreshError?.message,
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
