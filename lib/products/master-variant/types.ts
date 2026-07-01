export type MasterVariantSibling = {
  subcategory?: string | null;
};

/** Minimal master shape required to create a warehouse variant. */
export type MasterForVariantCreation = {
  id: string;
  cleanName: string;
  category: string;
  subcategory?: string | null;
  qualityGrade?: string | null;
  material?: string | null;
  variants: MasterVariantSibling[];
};

export type CreatedMasterVariantRow = {
  id: string;
  widthCm: number | null;
  heightCm: number | null;
  gsm: number | null;
  threadCount: number | null;
  color: string;
  colorId: string;
  sku: string;
  stock: number;
  subcategory: string | null;
  internalPriceEur: number | null;
  isActive: boolean;
};
