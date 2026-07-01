const SOCIAL_DOMAINS = [
  "facebook.com",
  "fb.com",
  "instagram.com",
  "twitter.com",
  "x.com",
  "tiktok.com",
  "linkedin.com",
  "youtube.com",
  "t.co",
  "pinterest.com",
];

function extractHostname(referrer: string | null | undefined): string | null {
  if (!referrer?.trim()) return null;
  try {
    const url = referrer.startsWith("http") ? referrer : `https://${referrer}`;
    return new URL(url).hostname.replace(/^www\./, "").toLowerCase();
  } catch {
    return null;
  }
}

export type ReferrerBucket = "direct" | "google" | "social" | "other";

export function bucketReferrer(referrer: string | null | undefined): {
  bucket: ReferrerBucket;
  label: string;
} {
  const hostname = extractHostname(referrer);
  if (!hostname) {
    return { bucket: "direct", label: "Direct" };
  }

  if (hostname.includes("google.")) {
    return { bucket: "google", label: "Google" };
  }

  if (SOCIAL_DOMAINS.some((domain) => hostname === domain || hostname.endsWith(`.${domain}`))) {
    return { bucket: "social", label: "Social" };
  }

  return { bucket: "other", label: hostname };
}
