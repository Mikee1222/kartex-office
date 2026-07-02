import type { SupabaseClient } from "@supabase/supabase-js";

import {
  MAX_UPLOAD_BYTES,
  PRODUCT_IMAGES_BUCKET,
  TEMP_UPLOAD_PREFIX,
  UPLOAD_GENERIC_ERROR_EL,
  UPLOAD_MIME_ERROR_EL,
  UPLOAD_SIZE_ERROR_EL,
} from "@/lib/website/constants";
import {
  compressProductImage,
  isCompressedWithinLimit,
} from "@/lib/website/compress-product-image";
import { isAllowedProductImageFile } from "@/lib/website/product-image-upload";

export function extractProductImageStoragePath(publicUrl: string): string | null {
  const marker = `/${PRODUCT_IMAGES_BUCKET}/`;
  const storageIndex = publicUrl.indexOf(marker);
  if (storageIndex < 0) return null;
  return publicUrl.slice(storageIndex + marker.length);
}

export function isValidTempStoragePath(path: string): boolean {
  return new RegExp(
    `^${TEMP_UPLOAD_PREFIX.replace(/\//g, "\\/")}/[0-9a-f-]{36}$`,
  ).test(path);
}

export function mapStorageUploadError(message: string): { status: number; error: string } {
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

async function uploadCompressedBuffer(
  admin: SupabaseClient,
  storagePath: string,
  buffer: Buffer,
): Promise<{ publicUrl: string } | { error: string; status: number }> {
  let compressed: Buffer;
  try {
    compressed = await compressProductImage(buffer);
  } catch {
    return { error: UPLOAD_GENERIC_ERROR_EL, status: 400 };
  }

  if (!isCompressedWithinLimit(compressed)) {
    return { error: UPLOAD_SIZE_ERROR_EL, status: 413 };
  }

  const { error: uploadError } = await admin.storage
    .from(PRODUCT_IMAGES_BUCKET)
    .upload(storagePath, compressed, {
      contentType: "image/jpeg",
      upsert: true,
    });

  if (uploadError) {
    const mapped = mapStorageUploadError(uploadError.message);
    return { error: mapped.error, status: mapped.status };
  }

  const {
    data: { publicUrl },
  } = admin.storage.from(PRODUCT_IMAGES_BUCKET).getPublicUrl(storagePath);

  return { publicUrl };
}

export async function downloadTempUploadBuffer(
  admin: SupabaseClient,
  tempPath: string,
): Promise<{ buffer: Buffer } | { error: string; status: number }> {
  if (!isValidTempStoragePath(tempPath)) {
    return { error: UPLOAD_GENERIC_ERROR_EL, status: 400 };
  }

  const { data, error } = await admin.storage
    .from(PRODUCT_IMAGES_BUCKET)
    .download(tempPath);

  if (error || !data) {
    return { error: UPLOAD_GENERIC_ERROR_EL, status: 400 };
  }

  const buffer = Buffer.from(await data.arrayBuffer());
  await admin.storage.from(PRODUCT_IMAGES_BUCKET).remove([tempPath]);

  if (buffer.length === 0) {
    return { error: UPLOAD_GENERIC_ERROR_EL, status: 400 };
  }

  return { buffer };
}

export async function resolveImageUploadBuffer(
  request: Request,
  admin: SupabaseClient,
): Promise<{ buffer: Buffer } | { error: string; status: number }> {
  const contentType = request.headers.get("content-type") ?? "";

  if (contentType.includes("application/json")) {
    let body: { tempPath?: string };
    try {
      body = (await request.json()) as { tempPath?: string };
    } catch {
      return { error: UPLOAD_GENERIC_ERROR_EL, status: 400 };
    }

    if (!body.tempPath) {
      return { error: UPLOAD_GENERIC_ERROR_EL, status: 400 };
    }

    return downloadTempUploadBuffer(admin, body.tempPath);
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return { error: UPLOAD_GENERIC_ERROR_EL, status: 400 };
  }

  const file = formData.get("file");
  if (!(file instanceof File)) {
    return { error: "Missing file.", status: 400 };
  }

  if (!isAllowedProductImageFile(file)) {
    return { error: UPLOAD_MIME_ERROR_EL, status: 415 };
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  if (buffer.length === 0) {
    return { error: UPLOAD_GENERIC_ERROR_EL, status: 400 };
  }

  return { buffer };
}

export async function uploadCompressedCatalogImage(
  admin: SupabaseClient,
  storagePath: string,
  file: File,
): Promise<{ publicUrl: string } | { error: string; status: number }> {
  const buffer = Buffer.from(await file.arrayBuffer());
  if (buffer.length === 0) {
    return { error: UPLOAD_GENERIC_ERROR_EL, status: 400 };
  }

  return uploadCompressedBuffer(admin, storagePath, buffer);
}

export async function uploadCompressedCatalogImageFromBuffer(
  admin: SupabaseClient,
  storagePath: string,
  buffer: Buffer,
): Promise<{ publicUrl: string } | { error: string; status: number }> {
  return uploadCompressedBuffer(admin, storagePath, buffer);
}

export async function removeCatalogImageByUrl(
  admin: SupabaseClient,
  imageUrl: string | null | undefined,
): Promise<void> {
  if (!imageUrl?.trim()) return;

  const storagePath = extractProductImageStoragePath(imageUrl);
  if (!storagePath) return;

  await admin.storage.from(PRODUCT_IMAGES_BUCKET).remove([storagePath]);
}
