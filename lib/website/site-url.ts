const DEFAULT_WEBSITE_URL = "https://www.kartex.gr";

export function getWebsiteUrl(): string {
  const configured = process.env.NEXT_PUBLIC_WEBSITE_URL?.trim();
  if (configured) {
    return configured.replace(/\/$/, "");
  }
  return DEFAULT_WEBSITE_URL;
}
