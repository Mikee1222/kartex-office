import {
  UPLOAD_GENERIC_ERROR_EL,
  UPLOAD_MIME_ERROR_EL,
  UPLOAD_SIZE_ERROR_EL,
} from "@/lib/website/constants";

const ALLOWED_MIME_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/heic",
  "image/heif",
]);

const ALLOWED_EXTENSIONS = new Set([
  "jpg",
  "jpeg",
  "png",
  "webp",
  "heic",
  "heif",
]);

export function isAllowedProductImageFile(file: File): boolean {
  const mime = file.type.toLowerCase();
  if (mime.startsWith("image/")) {
    if (mime === "image/jpeg" || ALLOWED_MIME_TYPES.has(mime)) {
      return true;
    }
  }

  const extension = file.name.split(".").pop()?.toLowerCase();
  return extension ? ALLOWED_EXTENSIONS.has(extension) : false;
}

export function mapUploadStatusToGreekError(status: number, message?: string): string {
  if (status === 413) {
    return UPLOAD_SIZE_ERROR_EL;
  }

  if (status === 415) {
    return UPLOAD_MIME_ERROR_EL;
  }

  const normalized = message?.toLowerCase() ?? "";
  if (
    normalized.includes("too large") ||
    normalized.includes("file size") ||
    normalized.includes("payload too large") ||
    normalized.includes("exceeded the maximum")
  ) {
    return UPLOAD_SIZE_ERROR_EL;
  }

  if (
    normalized.includes("mime") ||
    normalized.includes("content type") ||
    normalized.includes("not supported")
  ) {
    return UPLOAD_MIME_ERROR_EL;
  }

  return UPLOAD_GENERIC_ERROR_EL;
}

export async function readUploadJsonResponse<T>(response: Response): Promise<T> {
  const contentType = response.headers.get("content-type") ?? "";
  if (!contentType.includes("application/json")) {
    throw new Error(mapUploadStatusToGreekError(response.status));
  }

  try {
    return (await response.json()) as T;
  } catch {
    throw new Error(mapUploadStatusToGreekError(response.status));
  }
}
