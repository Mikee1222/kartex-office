import type { ProductColor } from "@/lib/products/types";

export const LEGACY_COLOR_ID_PREFIX = "legacy:";

export function toLegacyColorId(name: string): string {
  return `${LEGACY_COLOR_ID_PREFIX}${encodeURIComponent(name.trim())}`;
}

export function isLegacyColorId(id: string): boolean {
  return id.startsWith(LEGACY_COLOR_ID_PREFIX);
}

export function legacyColorNameFromId(id: string): string | null {
  if (!isLegacyColorId(id)) return null;
  try {
    return decodeURIComponent(id.slice(LEGACY_COLOR_ID_PREFIX.length));
  } catch {
    return null;
  }
}

export function resolveVariantColorSelectValue(
  colorId: string | null,
  colorName: string | null,
): string {
  if (colorId) return colorId;
  const name = colorName?.trim();
  return name ? toLegacyColorId(name) : "";
}

export function mergeWarehouseColorOptions(
  options: ProductColor[],
  currentColorId: string | null,
  currentColorName: string | null,
): ProductColor[] {
  const merged = [...options];
  const name = currentColorName?.trim();

  if (!name) {
    return merged;
  }

  const hasCurrent =
    (currentColorId && merged.some((color) => color.id === currentColorId)) ||
    merged.some((color) => color.name === name);

  if (!hasCurrent) {
    merged.push({
      id: currentColorId ?? toLegacyColorId(name),
      name,
      hexCode: "",
      isActive: true,
    });
  }

  return merged.sort((a, b) => a.name.localeCompare(b.name, "el"));
}
