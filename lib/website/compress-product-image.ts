import sharp from "sharp";

import { MAX_UPLOAD_BYTES } from "@/lib/website/constants";

const MAX_DIMENSION = 2400;
const INITIAL_QUALITY = 82;

/** Same compression profile as scripts/scrape-and-upload-images.mjs (updated for gallery uploads). */
export async function compressProductImage(buffer: Buffer): Promise<Buffer> {
  const pipeline = () =>
    sharp(buffer, { failOn: "none" })
      .rotate()
      .resize(MAX_DIMENSION, MAX_DIMENSION, {
        fit: "inside",
        withoutEnlargement: true,
      });

  let quality = INITIAL_QUALITY;
  let compressed = await pipeline()
    .jpeg({ quality, mozjpeg: true })
    .toBuffer();

  while (compressed.length > MAX_UPLOAD_BYTES && quality > 55) {
    quality -= 8;
    compressed = await pipeline()
      .jpeg({ quality, mozjpeg: true })
      .toBuffer();
  }

  if (compressed.length > MAX_UPLOAD_BYTES) {
    compressed = await pipeline()
      .resize(1600, 1600, { fit: "inside", withoutEnlargement: true })
      .jpeg({ quality: 72, mozjpeg: true })
      .toBuffer();
  }

  return compressed;
}

export function isCompressedWithinLimit(buffer: Buffer): boolean {
  return buffer.length <= MAX_UPLOAD_BYTES;
}
