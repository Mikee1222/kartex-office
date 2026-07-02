import { randomUUID } from "node:crypto";

import { NextResponse } from "next/server";

import { createAdminClient } from "@/lib/supabase/admin";
import {
  resolveImageUploadBuffer,
  uploadCompressedCatalogImageFromBuffer,
} from "@/lib/website/catalog-image-storage";
import { UPLOAD_GENERIC_ERROR_EL, PRODUCT_IMAGES_BUCKET } from "@/lib/website/constants";
import {
  mapProductMasterImageRow,
  primaryImageUrl,
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

export async function POST(request: Request, context: RouteContext) {
  const access = await requireWebsiteAdmin();
  if (isNextResponse(access)) return access;

  const { masterId } = await context.params;
  const admin = createAdminClient();

  const bufferResult = await resolveImageUploadBuffer(request, admin);
  if ("error" in bufferResult) {
    return NextResponse.json(
      { error: bufferResult.error },
      { status: bufferResult.status },
    );
  }

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

  const publicUrl = uploadResult.publicUrl;

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
