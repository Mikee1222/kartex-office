export const WEBSITE_PREVIEW_URL =
  process.env.NEXT_PUBLIC_WEBSITE_URL?.replace(/\/$/, "") ?? "https://www.kartex.gr";

export const WEB_CONTENT_KEYS = [
  { key: "hero_title", label: "Τίτλος Hero" },
  { key: "hero_subtitle", label: "Υπότιτλος Hero" },
  { key: "about_title", label: "Τίτλος Σχετικά" },
  { key: "about_body", label: "Κείμενο Σχετικά" },
  { key: "contact_info", label: "Στοιχεία Επικοινωνίας" },
] as const;

export const WEB_CONTENT_LOCALES = ["el", "en"] as const;

export type WebContentKey = (typeof WEB_CONTENT_KEYS)[number]["key"];
export type WebContentLocale = (typeof WEB_CONTENT_LOCALES)[number];

export const PRODUCT_IMAGES_BUCKET = "product-images";
