import type { MasterGroup } from "@/lib/products/master-groups";
import type {
  CreatedMasterVariantRow,
  MasterForVariantCreation,
} from "@/lib/products/master-variant/types";
import type {
  WebsiteProductMasterRow,
  WebsiteProductMasterVariantRow,
} from "@/lib/website/types";

export function masterGroupToVariantMaster(
  group: MasterGroup,
): MasterForVariantCreation | null {
  if (!group.masterId) return null;

  return {
    id: group.masterId,
    cleanName: group.cleanName,
    category: group.category,
    subcategory: group.subcategory ?? null,
    qualityGrade: group.qualityGrade ?? null,
    material: group.material ?? null,
    variants: group.variants.map(() => ({})),
  };
}

export function websiteMasterToVariantMaster(
  master: WebsiteProductMasterRow,
): MasterForVariantCreation {
  return {
    id: master.id,
    cleanName: master.cleanName,
    category: master.category,
    subcategory: master.subcategory,
    qualityGrade: master.qualityGrade,
    material: master.material,
    variants: master.variants.map((variant) => ({
      subcategory: variant.subcategory,
    })),
  };
}

export function createdVariantToWebsiteRow(
  variant: CreatedMasterVariantRow,
): WebsiteProductMasterVariantRow {
  return {
    id: variant.id,
    widthCm: variant.widthCm,
    heightCm: variant.heightCm,
    gsm: variant.gsm,
    threadCount: variant.threadCount,
    color: variant.color,
    colorId: variant.colorId,
    sku: variant.sku,
    stock: variant.stock,
    subcategory: variant.subcategory,
    internalPriceEur: variant.internalPriceEur,
    isActive: variant.isActive,
  };
}

export function resolveDefaultSubcategory(
  master: MasterForVariantCreation,
  fallbackOptions: string[],
): string | null {
  return (
    master.subcategory?.trim() ||
    master.variants.find((variant) => variant.subcategory?.trim())?.subcategory?.trim() ||
    fallbackOptions[0]?.trim() ||
    null
  );
}

export function sortMasterVariants<T extends { widthCm: number | null; heightCm: number | null }>(
  variants: T[],
): T[] {
  return [...variants].sort((a, b) => {
    const widthDiff = (a.widthCm ?? 0) - (b.widthCm ?? 0);
    if (widthDiff !== 0) return widthDiff;
    return (a.heightCm ?? 0) - (b.heightCm ?? 0);
  });
}
