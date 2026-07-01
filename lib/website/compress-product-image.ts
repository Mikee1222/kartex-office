import sharp from "sharp";

/** Same compression profile as scripts/scrape-and-upload-images.mjs */
export async function compressProductImage(buffer: Buffer): Promise<Buffer> {
  return sharp(buffer)
    .rotate()
    .jpeg({ quality: 85, mozjpeg: true })
    .resize(1200, 1200, { fit: "inside", withoutEnlargement: true })
    .toBuffer();
}
