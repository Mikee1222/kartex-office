import { encodeEan13Modules, isValidEan13 } from "@/lib/products/identifiers";

export type BarcodePrintProduct = {
  name: string;
  sku: string;
  barcode: string;
};

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/** Returns SVG markup string for a valid EAN-13 barcode. */
export function generateEan13Svg(barcode: string): string | null {
  const modules = encodeEan13Modules(barcode.trim());
  if (!modules) return null;

  const barHeight = 50;
  const moduleWidth = 1.2;
  const width = modules.length * moduleWidth;
  const bars = modules
    .split("")
    .map((bit, index) =>
      bit === "1"
        ? `<rect x="${(index * moduleWidth).toFixed(2)}" y="0" width="${moduleWidth}" height="${barHeight}" fill="#111827"/>`
        : "",
    )
    .join("");

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${barHeight}" width="100%" height="auto" role="img" aria-label="Barcode">${bars}</svg>`;
}

function barcodeCardHtml(product: BarcodePrintProduct, svg: string): string {
  const name = escapeHtml(product.name);
  const sku = escapeHtml(product.sku);
  const barcode = escapeHtml(product.barcode.trim());

  return `
    <div class="barcode-card">
      <div class="product-name">${name}</div>
      <div class="product-sku">SKU: ${sku}</div>
      ${svg}
      <div class="barcode-number">${barcode}</div>
      <div class="kartex-logo">KARTEX</div>
    </div>
  `;
}

const PRINT_STYLES = `
  body {
    margin: 0;
    padding: 20px;
    font-family: Arial, sans-serif;
    display: flex;
    flex-direction: column;
    align-items: center;
  }
  .barcode-grid {
    display: grid;
    grid-template-columns: repeat(2, 280px);
    gap: 16px;
    justify-content: center;
    width: 100%;
  }
  .barcode-card {
    border: 1px solid #E2E8F0;
    border-radius: 8px;
    padding: 20px;
    text-align: center;
    width: 280px;
    box-sizing: border-box;
    break-inside: avoid;
    page-break-inside: avoid;
  }
  .product-name {
    font-size: 14px;
    font-weight: bold;
    color: #0A1628;
    margin-bottom: 4px;
  }
  .product-sku {
    font-size: 11px;
    color: #64748B;
    font-family: monospace;
    margin-bottom: 12px;
  }
  svg { width: 100%; }
  .barcode-number {
    font-size: 12px;
    font-family: monospace;
    margin-top: 4px;
    color: #1F2937;
  }
  .kartex-logo {
    font-size: 10px;
    color: #D4AF37;
    font-weight: bold;
    margin-top: 8px;
    letter-spacing: 2px;
  }
  @media print {
    body { padding: 0; }
    .no-print { display: none !important; }
  }
`;

function openPrintDocument(title: string, bodyContent: string, autoPrint = true) {
  const printWindow = window.open("", "_blank");
  if (!printWindow) {
    return { ok: false as const, error: "Ο browser μπλόκαρε το παράθυρο εκτύπωσης." };
  }

  printWindow.document.write(`<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>${escapeHtml(title)}</title>
  <style>${PRINT_STYLES}</style>
</head>
<body>
  ${bodyContent}
  <br />
  <button class="no-print" type="button" onclick="window.print()" style="padding:8px 24px;background:#D4AF37;border:none;border-radius:6px;font-weight:bold;cursor:pointer;margin-top:10px">
    Εκτύπωση
  </button>
  ${autoPrint ? "<script>window.onload = () => window.print();</script>" : ""}
</body>
</html>`);
  printWindow.document.close();

  return { ok: true as const };
}

function validateBarcodeProduct(product: BarcodePrintProduct): string | null {
  const barcode = product.barcode?.trim() ?? "";
  if (!barcode) {
    return `Το προϊόν «${product.name}» δεν έχει barcode.`;
  }
  if (!isValidEan13(barcode)) {
    return `Το barcode «${barcode}» δεν είναι έγκυρο EAN-13.`;
  }
  const svg = generateEan13Svg(barcode);
  if (!svg) {
    return `Αποτυχία δημιουργίας barcode για «${product.name}».`;
  }
  return null;
}

export function printProductBarcode(product: BarcodePrintProduct): {
  ok: boolean;
  error?: string;
} {
  const validationError = validateBarcodeProduct(product);
  if (validationError) {
    return { ok: false, error: validationError };
  }

  const svg = generateEan13Svg(product.barcode.trim())!;
  const body = barcodeCardHtml(product, svg);
  return openPrintDocument(`Barcode - ${product.name}`, body);
}

export function printProductBarcodes(products: BarcodePrintProduct[]): {
  ok: boolean;
  error?: string;
  printedCount?: number;
  skipped?: string[];
} {
  if (products.length === 0) {
    return { ok: false, error: "Δεν επιλέχθηκαν προϊόντα." };
  }

  const skipped: string[] = [];
  const cards: string[] = [];

  for (const product of products) {
    const validationError = validateBarcodeProduct(product);
    if (validationError) {
      skipped.push(validationError);
      continue;
    }
    const svg = generateEan13Svg(product.barcode.trim())!;
    cards.push(barcodeCardHtml(product, svg));
  }

  if (cards.length === 0) {
    return {
      ok: false,
      error: skipped[0] ?? "Κανένα έγκυρο barcode για εκτύπωση.",
      skipped,
    };
  }

  const grid =
    cards.length === 1
      ? cards[0]!
      : `<div class="barcode-grid">${cards.join("")}</div>`;

  const result = openPrintDocument(
    cards.length === 1 ? `Barcode - ${products[0]!.name}` : `Barcodes (${cards.length})`,
    grid,
  );

  if (!result.ok) {
    return result;
  }

  return { ok: true, printedCount: cards.length, skipped };
}
