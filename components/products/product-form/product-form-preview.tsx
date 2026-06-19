"use client";

import { CategoryBadge } from "@/components/products/category-badge";
import { ColorCirclesRow } from "@/components/ui/color-picker";
import { formatCurrencyEl } from "@/types/database";
import { premiumCard } from "@/lib/ui/premium-styles";
import { cn } from "@/lib/utils";

type PreviewColor = {
  id: string;
  name: string;
  hexCode: string;
};

type ProductFormPreviewProps = {
  name: string;
  sku: string;
  category: string;
  purchasePrice: string;
  salePrice: string;
  totalStock: number;
  unit: string;
  colors: PreviewColor[];
  className?: string;
};

export function ProductFormPreview({
  name,
  sku,
  category,
  purchasePrice,
  salePrice,
  totalStock,
  unit,
  colors,
  className,
}: ProductFormPreviewProps) {
  const purchase = Number.parseFloat(purchasePrice) || 0;
  const sale = Number.parseFloat(salePrice) || 0;
  const displayName = name.trim() || "Όνομα προϊόντος";
  const displaySku = sku.trim() || "SKU";

  return (
    <aside
      className={cn(
        premiumCard,
        "sticky top-8 self-start space-y-5 p-6",
        className,
      )}
    >
      <p className="text-[11px] font-semibold uppercase tracking-widest text-gray-400">
        Προεπισκόπηση
      </p>

      <div className="space-y-2 border-b border-gray-100 pb-4">
        <h3 className="text-base font-semibold leading-snug text-navy-900">
          {displayName}
        </h3>
        <p className="font-mono text-xs text-gray-500">{displaySku}</p>
        {category.trim() ? (
          <CategoryBadge category={category.trim()} />
        ) : (
          <span className="inline-block rounded-full bg-gray-100 px-2.5 py-0.5 text-xs text-gray-400">
            Κατηγορία
          </span>
        )}
      </div>

      <div className="space-y-2">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-400">
          Χρώματα
        </p>
        {colors.length > 0 ? (
          <ColorCirclesRow colors={colors} maxVisible={6} size={22} />
        ) : (
          <p className="text-xs text-gray-400">Δεν έχουν επιλεγεί χρώματα</p>
        )}
      </div>

      <div className="space-y-3 border-t border-gray-100 pt-4">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-400">
            Απόθεμα
          </p>
          <p className="mt-1 text-2xl font-semibold tabular-nums text-navy-900">
            {totalStock}
            <span className="ml-1 text-sm font-normal text-gray-500">{unit}</span>
          </p>
        </div>
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-400">
              Πώληση
            </p>
            <p className="mt-1 font-semibold text-navy-900">{formatCurrencyEl(sale)}</p>
          </div>
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-400">
              Αγορά
            </p>
            <p className="mt-1 font-medium text-gray-600">{formatCurrencyEl(purchase)}</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
