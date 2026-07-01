export const CONTENT_KEYS = [
  "hero_title",
  "hero_subtitle",
  "about_title",
  "about_body",
  "contact_info",
] as const;

export type ContentKey = (typeof CONTENT_KEYS)[number];

export const CONTENT_LOCALES = ["el", "en"] as const;

export type ContentLocale = (typeof CONTENT_LOCALES)[number];

export const CONTENT_KEY_LABELS: Record<ContentKey, string> = {
  hero_title: "Τίτλος Hero",
  hero_subtitle: "Υπότιτλος Hero",
  about_title: "Τίτλος Σχετικά",
  about_body: "Κείμενο Σχετικά",
  contact_info: "Στοιχεία Επικοινωνίας",
};

export type WebContentRow = {
  id: string;
  key: string;
  locale: string;
  title?: string | null;
  body?: string | null;
  metadata?: Record<string, unknown> | null;
};

export type SiteSettingsState = {
  showPrices: boolean;
  maintenanceMode: boolean;
  contactEmail: string;
  contactPhone: string;
  contactAddress: string;
  facebook: string;
  instagram: string;
  bankIban: string;
  bankName: string;
  bankBeneficiary: string;
};

export type WebsiteProductRow = {
  id: string;
  name: string;
  clean_name?: string | null;
  sku: string;
  category: string | null;
  subcategory?: string | null;
  image_url: string | null;
  is_active: boolean;
};

/** Variant nested under product_masters for website CMS. */
export type WebsiteProductMasterVariantRow = {
  id: string;
  widthCm: number | null;
  heightCm: number | null;
  gsm: number | null;
  threadCount: number | null;
  color: string | null;
  sku: string;
  stock: number;
  subcategory: string | null;
  internalPriceEur: number | null;
};

export type WebsiteProductMasterRow = {
  id: string;
  cleanName: string;
  category: string;
  subcategory: string | null;
  qualityGrade: string | null;
  material: string | null;
  imageUrl: string | null;
  isActive: boolean;
  variants: WebsiteProductMasterVariantRow[];
};

export type WebsiteSubcategory = {
  id: string;
  category_id: string;
  name: string;
  slug: string;
  description: string | null;
  image_url: string | null;
  sort_order: number;
  is_active: boolean;
};

export type WebsiteCategory = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  image_url: string | null;
  sort_order: number;
  is_active: boolean;
  website_subcategories: WebsiteSubcategory[];
};
