import type { ProductColor } from "@/lib/products/types";

export type ProductColorFormEntry = {
  selected: boolean;
  stock: string;
  isPrimary: boolean;
};

export type ProductColorsFormState = Record<string, ProductColorFormEntry>;

export type ColorSelectionInput = {
  colorId: string;
  stock: number;
  isPrimary?: boolean;
};

export function buildInitialColorsFormState(
  colors: ProductColor[],
  existing: ColorSelectionInput[] = [],
): ProductColorsFormState {
  const existingMap = new Map(
    existing.map((item) => [item.colorId, item]),
  );
  const explicitPrimary = existing.find((item) => item.isPrimary)?.colorId;

  const state: ProductColorsFormState = {};
  for (const color of colors) {
    const row = existingMap.get(color.id);
    const selected = row != null;
    state[color.id] = {
      selected,
      stock: row != null ? String(row.stock) : "0",
      isPrimary: false,
    };
  }

  if (explicitPrimary && state[explicitPrimary]?.selected) {
    for (const id of Object.keys(state)) {
      state[id]!.isPrimary = id === explicitPrimary;
    }
  } else {
    const firstSelected = colors.find((color) => state[color.id]?.selected);
    if (firstSelected) {
      state[firstSelected.id]!.isPrimary = true;
    }
  }

  return state;
}

export function totalStockFromFormState(state: ProductColorsFormState): number {
  return Object.values(state)
    .filter((entry) => entry.selected)
    .reduce((sum, entry) => sum + Math.max(0, Number.parseInt(entry.stock, 10) || 0), 0);
}

export function selectionsFromFormState(
  state: ProductColorsFormState,
): ColorSelectionInput[] {
  const selected = Object.entries(state)
    .filter(([, entry]) => entry.selected)
    .map(([colorId, entry]) => ({
      colorId,
      stock: Math.max(0, Math.round(Number.parseInt(entry.stock, 10) || 0)),
      isPrimary: entry.isPrimary,
    }));

  if (selected.length === 0) return [];

  const hasPrimary = selected.some((item) => item.isPrimary);
  if (!hasPrimary) {
    selected[0]!.isPrimary = true;
  }

  return selected;
}

export function previewColorsFromFormState(
  state: ProductColorsFormState,
  palette: ProductColor[],
): { id: string; name: string; hexCode: string; isPrimary: boolean }[] {
  return palette
    .filter((color) => state[color.id]?.selected)
    .map((color) => ({
      id: color.id,
      name: color.name,
      hexCode: color.hexCode,
      isPrimary: Boolean(state[color.id]?.isPrimary),
    }))
    .sort((a, b) => {
      if (a.isPrimary) return -1;
      if (b.isPrimary) return 1;
      return a.name.localeCompare(b.name, "el");
    });
}
