import { getWebsiteUrl } from "@/lib/website/site-url";

const SOCIAL_DOMAIN_LABELS: Record<string, string> = {
  "facebook.com": "Facebook",
  "fb.com": "Facebook",
  "instagram.com": "Instagram",
  "twitter.com": "Twitter",
  "x.com": "X",
  "tiktok.com": "TikTok",
  "linkedin.com": "LinkedIn",
  "youtube.com": "YouTube",
  "t.co": "X",
  "pinterest.com": "Pinterest",
};

/** Hardcoded own domains — internal navigation should bucket as Direct. */
const STATIC_OWN_DOMAINS = [
  "kartex.gr",
  "localhost",
  "127.0.0.1",
  "0.0.0.0",
];

function hostnameFromUrl(url: string): string | null {
  try {
    const normalized = url.startsWith("http") ? url : `https://${url}`;
    return new URL(normalized).hostname.replace(/^www\./, "").toLowerCase();
  } catch {
    return null;
  }
}

function collectOwnDomains(): string[] {
  const domains = new Set<string>(STATIC_OWN_DOMAINS);

  const configured = getWebsiteUrl();
  const configuredHost = hostnameFromUrl(configured);
  if (configuredHost) domains.add(configuredHost);

  const extra = process.env.ANALYTICS_OWN_DOMAINS?.split(",") ?? [];
  for (const entry of extra) {
    const trimmed = entry.trim().toLowerCase();
    if (trimmed) domains.add(trimmed.replace(/^www\./, ""));
  }

  return [...domains];
}

function extractHostname(referrer: string | null | undefined): string | null {
  if (!referrer?.trim()) return null;
  return hostnameFromUrl(referrer.trim());
}

function isOwnDomain(hostname: string): boolean {
  const ownDomains = collectOwnDomains();

  if (ownDomains.some((domain) => hostname === domain || hostname.endsWith(`.${domain}`))) {
    return true;
  }

  // Vercel preview deployments for the marketing site.
  if (/^kartex(-website)?[-a-z0-9]*\.vercel\.app$/i.test(hostname)) {
    return true;
  }

  return false;
}

function matchSocialLabel(hostname: string): string | null {
  for (const [domain, label] of Object.entries(SOCIAL_DOMAIN_LABELS)) {
    if (hostname === domain || hostname.endsWith(`.${domain}`)) {
      return label;
    }
  }
  return null;
}

export type ReferrerBucket = "direct" | "google" | "facebook" | "instagram" | "other";

export function bucketReferrer(referrer: string | null | undefined): {
  bucket: ReferrerBucket;
  label: string;
} {
  const hostname = extractHostname(referrer);

  if (!hostname || isOwnDomain(hostname)) {
    return { bucket: "direct", label: "Απευθείας" };
  }

  if (hostname.includes("google.")) {
    return { bucket: "google", label: "Google" };
  }

  const socialLabel = matchSocialLabel(hostname);
  if (socialLabel === "Facebook") {
    return { bucket: "facebook", label: "Facebook" };
  }
  if (socialLabel === "Instagram") {
    return { bucket: "instagram", label: "Instagram" };
  }

  return { bucket: "other", label: "Άλλο" };
}
