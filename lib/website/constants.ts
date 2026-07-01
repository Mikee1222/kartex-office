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

/** Supabase bucket file_size_limit — also enforced after server compression. */
export const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;

/** Reject raw uploads larger than this before the round-trip (server compresses first). */
export const MAX_RAW_UPLOAD_BYTES = 50 * 1024 * 1024;

export const UPLOAD_SIZE_ERROR_EL =
  "Η εικόνα είναι πολύ μεγάλη (μέγιστο 10MB). Δοκιμάστε να τη συμπιέσετε πρώτα.";

export const UPLOAD_MIME_ERROR_EL = "Μη υποστηριζόμενος τύπος αρχείου.";

export const UPLOAD_GENERIC_ERROR_EL =
  "Η μεταφόρτωση απέτυχε. Δοκιμάστε ξανά.";
