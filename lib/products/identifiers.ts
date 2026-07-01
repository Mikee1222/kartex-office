import { createClient } from "@/lib/supabase/client";

const GREEK_TO_LATIN: Record<string, string> = {
  α: "a",
  ά: "a",
  β: "v",
  γ: "g",
  δ: "d",
  ε: "e",
  έ: "e",
  ζ: "z",
  η: "i",
  ή: "i",
  θ: "th",
  ι: "i",
  ί: "i",
  ϊ: "i",
  ΐ: "i",
  κ: "k",
  λ: "l",
  μ: "m",
  ν: "n",
  ξ: "x",
  ο: "o",
  ό: "o",
  π: "p",
  ρ: "r",
  σ: "s",
  ς: "s",
  τ: "t",
  υ: "y",
  ύ: "y",
  ϋ: "y",
  ΰ: "y",
  φ: "f",
  χ: "ch",
  ψ: "ps",
  ω: "o",
  ώ: "o",
};

/** Transliterate Greek text to Latin for SKU-safe prefixes. */
export function transliterateForSku(text: string): string {
  return text
    .trim()
    .split("")
    .map((char) => {
      const lower = char.toLowerCase();
      if (GREEK_TO_LATIN[lower] != null) {
        return GREEK_TO_LATIN[lower];
      }
      return char;
    })
    .join("");
}

function skuPartPrefix(text: string, fallback = ""): string {
  const latin = transliterateForSku(text)
    .replace(/[^A-Za-z0-9]/g, "")
    .toUpperCase();
  return latin.slice(0, 3) || fallback;
}

function formatDimensionForSku(value: string): string {
  if (!value.trim()) return "";
  const n = Number.parseFloat(value);
  if (!Number.isFinite(n) || n <= 0) return "";
  if (Number.isInteger(n)) return String(n);
  return String(n)
    .replace(/(\.\d*?[1-9])0+$/, "$1")
    .replace(/\.0+$/, "");
}

export type SkuGenerationInput = {
  category: string;
  material: string;
  widthCm: string;
  heightCm: string;
  /** Use a fixed suffix (e.g. 001) for suggestions; omit for random. */
  sequence?: string;
};

export function buildSkuParts({
  category,
  material,
  widthCm,
  heightCm,
  sequence,
}: SkuGenerationInput) {
  const catPrefix = skuPartPrefix(category, "PRD");
  const matPrefix = skuPartPrefix(material, "");
  const width = formatDimensionForSku(widthCm);
  const height = formatDimensionForSku(heightCm);
  const dims = width && height ? `${width}x${height}` : "";
  const num =
    sequence ??
    String(Math.floor(Math.random() * 999) + 1).padStart(3, "0");

  return [catPrefix, matPrefix, dims, num].filter(Boolean);
}

export function generateSku(input: SkuGenerationInput): string {
  return buildSkuParts(input).join("-");
}

export function suggestSku(input: Omit<SkuGenerationInput, "sequence">): string {
  return buildSkuParts({ ...input, sequence: "001" }).join("-");
}

export function calculateEAN13CheckDigit(code12: string): string {
  let sum = 0;
  for (let i = 0; i < 12; i++) {
    sum += Number.parseInt(code12[i]!, 10) * (i % 2 === 0 ? 1 : 3);
  }
  return String((10 - (sum % 10)) % 10);
}

const KARTEX_EAN_PREFIX = "5201234";

export function generateBarcode(): string {
  const productNum = String(Math.floor(Math.random() * 99999) + 1).padStart(5, "0");
  const partial = KARTEX_EAN_PREFIX + productNum;
  return partial + calculateEAN13CheckDigit(partial);
}

export function isValidEan13(code: string): boolean {
  if (!/^\d{13}$/.test(code)) return false;
  return code[12] === calculateEAN13CheckDigit(code.slice(0, 12));
}

export type ProductIdentifierField = "sku" | "barcode";

export async function checkProductFieldUnique(
  field: ProductIdentifierField,
  value: string,
  currentProductId?: string,
): Promise<boolean> {
  const trimmed = value.trim();
  if (!trimmed) return true;

  const supabase = createClient();
  let query = supabase.from("products").select("id").eq(field, trimmed).limit(1);

  if (currentProductId) {
    query = query.neq("id", currentProductId);
  }

  const { data, error } = await query.maybeSingle();
  if (error) {
    console.error(`checkProductFieldUnique(${field}):`, error);
    return true;
  }

  return !data;
}

/** EAN-13 left-hand encoding patterns (7 modules per digit). */
const L_CODES: Record<string, string> = {
  "0": "0001101",
  "1": "0011001",
  "2": "0010011",
  "3": "0111101",
  "4": "0100011",
  "5": "0110001",
  "6": "0101111",
  "7": "0111011",
  "8": "0110111",
  "9": "0001011",
};

const G_CODES: Record<string, string> = {
  "0": "0100111",
  "1": "0110011",
  "2": "0011011",
  "3": "0100001",
  "4": "0011101",
  "5": "0111001",
  "6": "0000101",
  "7": "0010001",
  "8": "0001001",
  "9": "0010111",
};

const R_CODES: Record<string, string> = {
  "0": "1110010",
  "1": "1100110",
  "2": "1101100",
  "3": "1000010",
  "4": "1011100",
  "5": "1001110",
  "6": "1010000",
  "7": "1000100",
  "8": "1001000",
  "9": "1110100",
};

const PARITY: Record<string, string> = {
  "0": "LLLLLL",
  "1": "LLGLGG",
  "2": "LLGGLG",
  "3": "LLGGGL",
  "4": "LGLLGG",
  "5": "LGGLLG",
  "6": "LGGGLL",
  "7": "LGLGLG",
  "8": "LGLGGL",
  "9": "LGGLGL",
};

const GUARD = "101";
const CENTER = "01010";

/** Encode EAN-13 into a module string (1 = bar, 0 = space). */
export function encodeEan13Modules(code: string): string | null {
  if (!isValidEan13(code)) return null;

  const first = code[0]!;
  const parity = PARITY[first];
  if (!parity) return null;

  let modules = GUARD;

  for (let i = 0; i < 6; i++) {
    const digit = code[i + 1]!;
    const pattern = parity[i] === "L" ? L_CODES[digit] : G_CODES[digit];
    if (!pattern) return null;
    modules += pattern;
  }

  modules += CENTER;

  for (let i = 0; i < 6; i++) {
    const digit = code[i + 7]!;
    const pattern = R_CODES[digit];
    if (!pattern) return null;
    modules += pattern;
  }

  modules += GUARD;
  return modules;
}
