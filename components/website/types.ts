import type { WebContentKey, WebContentLocale } from "@/lib/website/constants";

export type WebContentRow = {
  id?: string;
  key: string;
  locale: string;
  title?: string | null;
  body?: string | null;
  metadata?: Record<string, unknown> | null;
};

export type WebContentDraft = Record<
  WebContentKey,
  Record<WebContentLocale, { title: string; body: string }>
>;

export type WebsiteProductRow = {
  id: string;
  name: string;
  sku: string;
  category: string | null;
  image_url: string | null;
  is_active: boolean;
};

export type SettingRow = {
  key: string;
  value: unknown;
};
