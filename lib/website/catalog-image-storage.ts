import type { SupabaseClient } from "@supabase/supabase-js";

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

export function extractProductImageStoragePath(publicUrl: string): string | null {
  const marker = `/${PRODUCT_IMAGES_BUCKET}/`;
  const storageIndex = publicUrl.indexOf(marker);
  if (storageIndex < 0) return null;
  return publicUrl.slice(storageIndex + marker.length);
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

export async function uploadCompressedCatalogImage(
  admin: SupabaseClient,
  storagePath: string,
  file: File,
): Promise<{ publicUrl: string } | { error: string; status: number }> {
  let compressed: Buffer;
  try {
    const buffer = Buffer.from(await file.arrayBuffer());
    if (buffer.length === 0) {
      return { error: UPLOAD_GENERIC_ERROR_EL, status: 400 };
    }

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

export async function removeCatalogImageByUrl(
  admin: SupabaseClient,
  imageUrl: string | null | undefined,
): Promise<void> {
  if (!imageUrl?.trim()) return;

  const storagePath = extractProductImageStoragePath(imageUrl);
  if (!storagePath) return;

  await admin.storage.from(PRODUCT_IMAGES_BUCKET).remove([storagePath]);
}
