"use client";

import {
  ChevronDown,
  ChevronUp,
  ImageIcon,
  TriangleAlert,
  Upload,
} from "lucide-react";
import Image from "next/image";
import * as React from "react";

import { VariantDimensionBadges } from "@/components/products/master-group-ui";
import { ActiveToggle } from "@/components/website/active-toggle";
import { Input } from "@/components/ui/input";
import type { WebsiteProductMasterRow, WebsiteProductMasterVariantRow } from "@/lib/website/types";
import {
  premiumSecondaryButton,
  premiumTableHead,
  premiumTableRow,
} from "@/lib/ui/premium-styles";
import { cn } from "@/lib/utils";

type WebsiteCategoryWithSubs = {
  id: string;
  name: string;
  website_subcategories: { id: string; name: string }[];
};

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

type WebsiteMasterGroupTableRowProps = {
  master: WebsiteProductMasterRow;
  websiteCategories: WebsiteCategoryWithSubs[];
  isExpanded: boolean;
  isSelected: boolean;
  isBusy: boolean;
  hasUnknownCategory: boolean;
  onToggleExpand: () => void;
  onToggleSelect: (checked: boolean) => void;
  onToggleActive: () => void;
  onCategoryChange: (categoryName: string) => void;
  onSubcategoryChange: (subcategoryName: string) => void;
  onImageUpload: (file: File) => void;
  onInternalPriceSave: (
    variantId: string,
    value: number | null,
  ) => Promise<boolean>;
};

export function WebsiteMasterGroupTableRow({
  master,
  websiteCategories,
  isExpanded,
  isSelected,
  isBusy,
  hasUnknownCategory,
  onToggleExpand,
  onToggleSelect,
  onToggleActive,
  onCategoryChange,
  onSubcategoryChange,
  onImageUpload,
  onInternalPriceSave,
}: WebsiteMasterGroupTableRowProps) {
  const matchedCategory = websiteCategories.find(
    (category) => category.name === master.category,
  );
  const subcategoryOptions = matchedCategory?.website_subcategories ?? [];

  return (
    <>
      <tr
        className={cn(
          premiumTableRow,
          !master.isActive && "opacity-60",
        )}
      >
        <td className="px-4 py-3">
          <input
            type="checkbox"
            checked={isSelected}
            onChange={(event) => onToggleSelect(event.target.checked)}
            className="size-4 rounded border-gray-300"
            aria-label={`Επιλογή ${master.cleanName}`}
          />
        </td>
        <td className="px-4 py-3">
          {master.imageUrl ? (
            <div className="relative size-12 overflow-hidden rounded-lg border border-gray-200 bg-gray-50">
              <Image
                src={master.imageUrl}
                alt={master.cleanName}
                fill
                className="object-cover"
                sizes="48px"
                unoptimized
              />
            </div>
          ) : (
            <div className="flex size-12 items-center justify-center rounded-lg border border-dashed border-gray-200 bg-gray-50 text-gray-300">
              <ImageIcon className="size-5" />
            </div>
          )}
        </td>
        <td className="px-4 py-3">
          <div className="flex flex-wrap items-center gap-1.5">
            <p className="font-medium text-navy-900">{master.cleanName}</p>
            {master.qualityGrade ? (
              <span className="rounded-full bg-gold-500/15 px-2 py-0.5 text-[10px] font-semibold text-navy-900">
                {master.qualityGrade}
              </span>
            ) : null}
            {!master.isActive ? (
              <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-semibold text-gray-500">
                Ανενεργό
              </span>
            ) : null}
            {hasUnknownCategory ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-semibold text-amber-700">
                <TriangleAlert size={10} aria-hidden />
                Άγνωστη κατηγορία
              </span>
            ) : null}
          </div>
          {master.material ? (
            <p className="mt-0.5 text-xs text-gray-400">{master.material}</p>
          ) : null}
        </td>
        <td className="px-4 py-3">
          <select
            value={master.category ?? ""}
            disabled={isBusy}
            onChange={(event) => onCategoryChange(event.target.value)}
            className={cn(
              "w-full min-w-[140px] rounded-md border border-gray-200 bg-white px-2 py-1.5 text-sm text-gray-600",
              isBusy && "opacity-50",
            )}
            aria-label={`Κατηγορία ${master.cleanName}`}
          >
            <option value="">—</option>
            {websiteCategories.map((category) => (
              <option key={category.id} value={category.name}>
                {category.name}
              </option>
            ))}
          </select>
        </td>
        <td className="px-4 py-3">
          {master.category ? (
            <select
              value={master.subcategory ?? ""}
              disabled={isBusy}
              onChange={(event) => onSubcategoryChange(event.target.value)}
              className={cn(
                "w-full min-w-[140px] rounded-md border border-gray-200 bg-white px-2 py-1.5 text-sm text-gray-600",
                isBusy && "opacity-50",
              )}
              aria-label={`Υποκατηγορία ${master.cleanName}`}
            >
              <option value="">—</option>
              {subcategoryOptions.map((subcategory) => (
                <option key={subcategory.id} value={subcategory.name}>
                  {subcategory.name}
                </option>
              ))}
            </select>
          ) : (
            <span className="text-sm text-gray-400">—</span>
          )}
        </td>
        <td className="px-4 py-3">
          <button
            type="button"
            onClick={onToggleExpand}
            className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-sm font-medium text-navy-900 transition-colors hover:bg-gray-100"
            aria-expanded={isExpanded}
          >
            {master.variants.length} παραλλαγές
            {isExpanded ? (
              <ChevronUp size={14} aria-hidden />
            ) : (
              <ChevronDown size={14} aria-hidden />
            )}
          </button>
        </td>
        <td className="px-4 py-3">
          <ActiveToggle
            active={master.isActive}
            disabled={isBusy}
            onClick={onToggleActive}
            label={`Ενεργό ${master.cleanName}`}
          />
        </td>
        <td className="px-4 py-3">
          <label
            className={cn(
              premiumSecondaryButton,
              "cursor-pointer px-3 py-2 text-xs",
              isBusy && "pointer-events-none opacity-50",
            )}
          >
            <Upload className="size-3.5" />
            Εικόνα
            <input
              type="file"
              accept="image/*"
              className="sr-only"
              disabled={isBusy}
              onChange={(event) => {
                const file = event.target.files?.[0];
                event.target.value = "";
                if (file) {
                  onImageUpload(file);
                }
              }}
            />
          </label>
        </td>
      </tr>
      {isExpanded ? (
        <tr className="bg-gray-50/80">
          <td colSpan={8} className="px-4 py-3">
            <WebsiteMasterVariantsTable
              variants={master.variants}
              isBusy={isBusy}
              onInternalPriceSave={onInternalPriceSave}
            />
          </td>
        </tr>
      ) : null}
    </>
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

function WebsiteMasterVariantsTable({
  variants,
  isBusy,
  onInternalPriceSave,
}: WebsiteMasterVariantsTableProps) {
  if (variants.length === 0) {
    return (
      <p className="text-sm text-gray-500">Δεν υπάρχουν παραλλαγές για αυτό το master.</p>
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
            <tr key={variant.id} className="border-t border-gray-100">
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
