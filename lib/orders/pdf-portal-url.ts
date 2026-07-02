import { getWebsiteUrl } from "@/lib/website/site-url";

const DEFAULT_PORTAL_LOCALE = "el";

/** Full customer-portal URL for an order (Dolphin's Hub order detail). */
export function buildPortalOrderTrackingUrl(orderId: string, locale = DEFAULT_PORTAL_LOCALE): string {
  return `${getWebsiteUrl()}/${locale}/portal/orders/${orderId}`;
}
