import type { ProductMasterImageRow } from "@/lib/website/types";

export type RawProductMasterImage = {
  id: string;
  master_id: string;
  url: string;
  sort_order: number;
  alt_text?: string | null;
  created_at?: string;
};

export function mapProductMasterImageRow(
  row: RawProductMasterImage,
): ProductMasterImageRow {
  return {
    id: row.id,
    masterId: row.master_id,
    url: row.url,
    sortOrder: row.sort_order,
    altText: row.alt_text?.trim() || null,
    createdAt: row.created_at ?? null,
  };
}

export function sortImages(
  images: ProductMasterImageRow[],
): ProductMasterImageRow[] {
  return [...images].sort((a, b) => {
    if (a.sortOrder !== b.sortOrder) return a.sortOrder - b.sortOrder;
    return (a.createdAt ?? "").localeCompare(b.createdAt ?? "");
  });
}

export function primaryImageUrl(
  images: ProductMasterImageRow[],
  fallbackUrl: string | null,
): string | null {
  const sorted = sortImages(images);
  return sorted[0]?.url ?? fallbackUrl;
}
