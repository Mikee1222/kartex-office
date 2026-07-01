/**
 * Heuristic classification of legacy product_masters.material free text
 * into canonical materials catalog names.
 */

export const CANONICAL_MATERIALS = [
  "Βαμβάκι",
  "Πολυεστέρας",
  "Μικτό Βαμβάκι-Πολυεστέρας",
  "Spandex",
  "Άλλο/Άγνωστο",
] as const;

export type CanonicalMaterial = (typeof CANONICAL_MATERIALS)[number];

export type MasterMaterialRow = {
  id: string;
  clean_name: string;
  material: string | null;
  description: string | null;
  is_active: boolean;
};

export type ClassifiedMasterMaterial = {
  masterId: string;
  cleanName: string;
  originalMaterial: string | null;
  classifiedPrimary: CanonicalMaterial;
  descriptionBefore: string | null;
  descriptionAfter: string | null;
};

function normalize(text: string): string {
  return text.trim().toLowerCase();
}

function isWeightOnly(material: string): boolean {
  const trimmed = material.trim();
  if (/^\d+\s*gsm$/i.test(trimmed)) return true;
  if (/^chloe\s+\d+\s*gsm/i.test(trimmed)) return true;
  return false;
}

function isCottonOnly(material: string): boolean {
  const n = normalize(material);
  if (n.includes("polyester") || n.includes("poly") && !n.includes("cotton")) return false;
  if (/\bp\/c\b/.test(n) || n.includes("cvc")) return false;
  if (/\d+%\s*cotton\s*-\s*\d+%\s*polyester/.test(n)) return false;
  if (/\d+%\s*polyester\s*-\s*\d+%\s*cotton/.test(n)) return false;
  if (n.includes("polyester/cotton") || n.includes("cotton/polyester")) return false;
  if (n.includes("100% cotton") || n.includes("100% βαμβάκι")) return true;
  if (n.includes("jersey 100% cotton")) return true;
  if (n.includes("πικέ 100% cotton") || n.includes("πικε 100% cotton")) return true;
  return false;
}

function isBlend(material: string): boolean {
  const n = normalize(material);
  if (/\bp\/c\b/.test(n)) return true;
  if (n.includes("cvc")) return true;
  if (n.includes("polyester/cotton") || n.includes("cotton/polyester")) return true;
  if (/\d+%\s*cotton\s*-\s*\d+%\s*polyester/.test(n)) return true;
  if (/\d+%\s*polyester\s*-\s*\d+%\s*cotton/.test(n)) return true;
  if (n.includes("καπιτονέ p/c")) return true;
  return false;
}

function isSpandex(material: string): boolean {
  return normalize(material).includes("spandex");
}

function isPolyester(material: string): boolean {
  const n = normalize(material);
  if (isSpandex(material)) return false;
  if (n.includes("100% polyester")) return true;
  if (n.includes("microfiber") && !n.includes("cotton")) return true;
  return false;
}

export function classifyMasterMaterial(material: string | null): CanonicalMaterial {
  if (material == null || material.trim() === "") {
    return "Άλλο/Άγνωστο";
  }

  const trimmed = material.trim();

  if (isWeightOnly(trimmed)) {
    return "Άλλο/Άγνωστο";
  }

  const n = normalize(trimmed);
  if (/^filling\s/.test(n)) {
    return "Άλλο/Άγνωστο";
  }
  if (n === "satin stripe") {
    return "Άλλο/Άγνωστο";
  }
  if (n.includes("πετσετέ") && n.includes("pu coated")) {
    return "Άλλο/Άγνωστο";
  }

  if (isSpandex(trimmed)) {
    return "Spandex";
  }

  if (isBlend(trimmed)) {
    return "Μικτό Βαμβάκι-Πολυεστέρας";
  }

  if (isCottonOnly(trimmed)) {
    return "Βαμβάκι";
  }

  if (isPolyester(trimmed)) {
    return "Πολυεστέρας";
  }

  // Ambiguous weave/finish/coating labels without fiber breakdown
  return "Άλλο/Άγνωστο";
}

export function appendCompositionToDescription(
  description: string | null,
  originalMaterial: string | null,
): string | null {
  if (originalMaterial == null || originalMaterial.trim() === "") {
    return description?.trim() || null;
  }

  const line = `Σύνθεση: ${originalMaterial.trim()}`;
  const base = description?.trim() ?? "";

  if (base.includes(line)) {
    return base || null;
  }

  if (!base) {
    return line;
  }

  return `${base}\n${line}`;
}

export function classifyMasterRows(rows: MasterMaterialRow[]): ClassifiedMasterMaterial[] {
  return rows
    .filter((row) => row.is_active)
    .sort((a, b) => a.clean_name.localeCompare(b.clean_name, "el"))
    .map((row) => ({
      masterId: row.id,
      cleanName: row.clean_name,
      originalMaterial: row.material,
      classifiedPrimary: classifyMasterMaterial(row.material),
      descriptionBefore: row.description,
      descriptionAfter: appendCompositionToDescription(row.description, row.material),
    }));
}
