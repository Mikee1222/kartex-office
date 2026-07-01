"use client";

import * as React from "react";

import { VariantDimensionBadges } from "@/components/products/master-group-ui";
import { Input } from "@/components/ui/input";
import type { WebsiteProductMasterVariantRow } from "@/lib/website/types";
import { premiumTableHead, premiumTableRow } from "@/lib/ui/premium-styles";
import { cn } from "@/lib/utils";

type InternalPriceCellProps = {
  variantId: string;
  value: number | null;
  disabled?: boolean;
  onSave: (variantId: string, value: number | null) => Promise<boolean>;
};

function InternalPriceCell({
  variantId,
  value,
  disabled,
  onSave,
}: InternalPriceCellProps) {
  const [local, setLocal] = React.useState(value?.toString() ?? "");
  const [saving, setSaving] = React.useState(false);

  React.useEffect(() => {
    setLocal(value?.toString() ?? "");
  }, [value]);

  async function handleBlur() {
    const trimmed = local.trim();
    const parsed =
      trimmed === "" ? null : Number.parseFloat(trimmed.replace(",", "."));

    if (trimmed !== "" && !Number.isFinite(parsed)) {
      setLocal(value?.toString() ?? "");
      return;
    }

    if (parsed === value || (parsed == null && value == null)) {
      return;
    }

    setSaving(true);
    const ok = await onSave(variantId, parsed);
    setSaving(false);
    if (!ok) {
      setLocal(value?.toString() ?? "");
    }
  }

  return (
    <Input
      type="text"
      inputMode="decimal"
      value={local}
      disabled={disabled || saving}
      onChange={(event) => setLocal(event.target.value)}
      onBlur={() => void handleBlur()}
      onKeyDown={(event) => {
        if (event.key === "Enter") {
          event.currentTarget.blur();
        }
      }}
      className="h-8 w-24 text-right text-sm tabular-nums"
      aria-label="Εσωτερική τιμή EUR"
    />
  );
}

type WebsiteMasterVariantsTableProps = {
  variants: WebsiteProductMasterVariantRow[];
  isBusy: boolean;
  onInternalPriceSave: (
    variantId: string,
    value: number | null,
  ) => Promise<boolean>;
};

export function WebsiteMasterVariantsTable({
  variants,
  isBusy,
  onInternalPriceSave,
}: WebsiteMasterVariantsTableProps) {
  if (variants.length === 0) {
    return (
      <p className="text-sm text-gray-500">
        Δεν υπάρχουν παραλλαγές για αυτό το master.
      </p>
    );
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-gray-200/80 bg-white">
      <table className="w-full min-w-[640px] text-sm">
        <thead>
          <tr className={cn(premiumTableHead, "text-xs")}>
            <th className="px-3 py-2 text-left">Διαστάσεις</th>
            <th className="px-3 py-2 text-left">Χρώμα</th>
            <th className="px-3 py-2 text-left">SKU</th>
            <th className="px-3 py-2 text-right">Απόθεμα</th>
            <th className="px-3 py-2 text-left">Υποκατηγορία</th>
            <th className="px-3 py-2 text-right">Εσωτ. τιμή (€)</th>
          </tr>
        </thead>
        <tbody>
          {variants.map((variant) => (
            <tr key={variant.id} className={cn(premiumTableRow, "border-t border-gray-100")}>
              <td className="px-3 py-2">
                <VariantDimensionBadges
                  variant={{
                    id: variant.id,
                    name: variant.sku,
                    sku: variant.sku,
                    widthCm: variant.widthCm,
                    heightCm: variant.heightCm,
                    gsm: variant.gsm,
                    threadCount: variant.threadCount,
                    stock: variant.stock,
                    reservedStock: 0,
                    availableStock: variant.stock,
                    minStock: 0,
                    purchasePrice: 0,
                    salePrice: 0,
                  }}
                />
              </td>
              <td className="px-3 py-2 text-gray-600">{variant.color ?? "—"}</td>
              <td className="px-3 py-2 font-mono text-xs text-gray-500">
                {variant.sku || "—"}
              </td>
              <td className="px-3 py-2 text-right tabular-nums text-navy-900">
                {variant.stock}
              </td>
              <td className="px-3 py-2 text-gray-600">
                {variant.subcategory ?? "—"}
              </td>
              <td className="px-3 py-2 text-right">
                <InternalPriceCell
                  variantId={variant.id}
                  value={variant.internalPriceEur}
                  disabled={isBusy}
                  onSave={onInternalPriceSave}
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
