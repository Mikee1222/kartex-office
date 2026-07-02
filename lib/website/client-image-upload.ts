import { createClient } from "@/lib/supabase/client";
import {
  DIRECT_UPLOAD_THRESHOLD_BYTES,
  MAX_RAW_UPLOAD_BYTES,
  MAX_UPLOAD_BYTES,
  PRODUCT_IMAGES_BUCKET,
  UPLOAD_GENERIC_ERROR_EL,
} from "@/lib/website/constants";
import {
  mapUploadStatusToGreekError,
  readUploadJsonResponse,
} from "@/lib/website/product-image-upload";

async function shrinkImageFileForStorage(file: File): Promise<File> {
  if (file.size <= MAX_UPLOAD_BYTES) {
    return file;
  }

  const bitmap = await createImageBitmap(file);
  let width = bitmap.width;
  let height = bitmap.height;
  const maxDimension = 4000;

  if (width > maxDimension || height > maxDimension) {
    const scale = maxDimension / Math.max(width, height);
    width = Math.round(width * scale);
    height = Math.round(height * scale);
  }

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d");
  if (!context) {
    bitmap.close();
    return file;
  }

  context.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();

  let quality = 0.9;
  let blob: Blob | null = null;

  while (quality >= 0.5) {
    blob = await new Promise<Blob | null>((resolve) => {
      canvas.toBlob(resolve, "image/jpeg", quality);
    });
    if (blob && blob.size <= MAX_UPLOAD_BYTES) {
      break;
    }
    quality -= 0.08;
  }

  if (!blob) {
    throw new Error(UPLOAD_GENERIC_ERROR_EL);
  }

  const baseName = file.name.replace(/\.[^.]+$/, "") || "image";
  return new File([blob], `${baseName}.jpg`, { type: "image/jpeg" });
}

async function uploadViaSignedStorage(file: File): Promise<string> {
  const prepared = await shrinkImageFileForStorage(file);

  const presignResponse = await fetch("/api/website/storage/presign", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      fileName: prepared.name,
      contentType: prepared.type || "image/jpeg",
      fileSize: prepared.size,
    }),
  });

  const presign = await readUploadJsonResponse<{
    path?: string;
    token?: string;
    error?: string;
  }>(presignResponse);

  if (!presignResponse.ok || !presign.path || !presign.token) {
    throw new Error(
      presign.error ?? mapUploadStatusToGreekError(presignResponse.status),
    );
  }

  const supabase = createClient();
  const { error: uploadError } = await supabase.storage
    .from(PRODUCT_IMAGES_BUCKET)
    .uploadToSignedUrl(presign.path, presign.token, prepared, {
      contentType: prepared.type || "image/jpeg",
    });

  if (uploadError) {
    throw new Error(mapUploadStatusToGreekError(413, uploadError.message));
  }

  return presign.path;
}

/** Upload an image to a website API route, bypassing Vercel body limits when needed. */
export async function postWebsiteImageUpload(
  file: File,
  apiPath: string,
): Promise<Response> {
  if (file.size > MAX_RAW_UPLOAD_BYTES) {
    throw new Error(mapUploadStatusToGreekError(413));
  }

  if (file.size <= DIRECT_UPLOAD_THRESHOLD_BYTES) {
    const formData = new FormData();
    formData.append("file", file);
    return fetch(apiPath, { method: "POST", body: formData });
  }

  const tempPath = await uploadViaSignedStorage(file);
  return fetch(apiPath, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ tempPath }),
  });
}
