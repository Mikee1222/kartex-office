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
};

export type WebsiteProductRow = {
  id: string;
  name: string;
  sku: string;
  category: string | null;
  image_url: string | null;
  is_active: boolean;
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
