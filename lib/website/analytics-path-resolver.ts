import { createAdminClient } from "@/lib/supabase/admin";

const PRODUCT_PATH_RE = /^\/(el|en)\/products\/([0-9a-f-]{36})(?:\/|$)/i;

export function extractProductIdFromPath(path: string): string | null {
  const match = path.match(PRODUCT_PATH_RE);
  return match?.[2]?.toLowerCase() ?? null;
}

export async function resolveAnalyticsPaths(paths: string[]): Promise<Map<string, string>> {
  const productIds = new Set<string>();
  for (const path of paths) {
    const id = extractProductIdFromPath(path);
    if (id) productIds.add(id);
  }

  const resolved = new Map<string, string>();
  if (productIds.size === 0) return resolved;

  const supabase = createAdminClient();
  const { data } = await supabase
    .from("product_masters")
    .select("id, clean_name")
    .in("id", [...productIds]);

  const nameById = new Map<string, string>();
  for (const row of data ?? []) {
    const cleanName = (row as { id: string; clean_name: string }).clean_name?.trim();
    if (cleanName) {
      nameById.set((row as { id: string }).id.toLowerCase(), cleanName);
    }
  }

  for (const path of paths) {
    const productId = extractProductIdFromPath(path);
    if (!productId) continue;
    const cleanName = nameById.get(productId);
    if (cleanName) {
      const locale = path.match(PRODUCT_PATH_RE)?.[1] ?? "el";
      resolved.set(path, `/${locale}/products/${cleanName}`);
    }
  }

  return resolved;
}

export function formatAnalyticsPath(path: string, resolved: Map<string, string>): string {
  return resolved.get(path) ?? path;
}
