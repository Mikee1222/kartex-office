"use client";

import {
  ChevronDown,
  ChevronUp,
  ImageIcon,
  Pencil,
  TriangleAlert,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import * as React from "react";

import { WebsiteMasterVariantsTable } from "@/components/website/website-master-variants-table";
import { AddMasterVariantDialog } from "@/components/website/add-master-variant-dialog";
import { ActiveToggle } from "@/components/website/active-toggle";
import type {
  WebsiteProductMasterRow,
  WebsiteProductMasterVariantRow,
} from "@/lib/website/types";
import { premiumGoldButton, premiumSecondaryButton, premiumTableRow } from "@/lib/ui/premium-styles";
import { cn } from "@/lib/utils";

type WebsiteMasterGroupTableRowProps = {
  master: WebsiteProductMasterRow;
  isExpanded: boolean;
  isSelected: boolean;
  isBusy: boolean;
  hasUnknownCategory: boolean;
  onToggleExpand: () => void;
  onToggleSelect: (checked: boolean) => void;
  onToggleActive: () => void;
  onInternalPriceSave: (
    variantId: string,
    value: number | null,
  ) => Promise<boolean>;
  onDimensionsSave: (
    variantId: string,
    widthCm: number,
    heightCm: number,
  ) => Promise<boolean>;
  onColorSave: (
    variantId: string,
    colorId: string,
    colorName: string,
    stock: number,
  ) => Promise<boolean>;
  onStockSave: (variantId: string, value: number) => Promise<boolean>;
  onSubcategorySave: (
    variantId: string,
    value: string | null,
  ) => Promise<boolean>;
  onVariantCreated: (variant: WebsiteProductMasterVariantRow) => void;
};

export function WebsiteMasterGroupTableRow({
  master,
  isExpanded,
  isSelected,
  isBusy,
  hasUnknownCategory,
  onToggleExpand,
  onToggleSelect,
  onToggleActive,
  onInternalPriceSave,
  onDimensionsSave,
  onColorSave,
  onStockSave,
  onSubcategorySave,
  onVariantCreated,
}: WebsiteMasterGroupTableRowProps) {
  const [addVariantOpen, setAddVariantOpen] = React.useState(false);
  const imageCount = master.images.length;
  const primaryUrl = master.imageUrl;

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
          {primaryUrl ? (
            <div className="relative size-12 overflow-hidden rounded-lg border border-gray-200 bg-gray-50">
              <Image
                src={primaryUrl}
                alt={master.cleanName}
                fill
                className="object-cover"
                sizes="48px"
                unoptimized
              />
              {imageCount > 1 ? (
                <span className="absolute bottom-0.5 right-0.5 flex size-5 items-center justify-center rounded-full bg-navy-900/85 text-[10px] font-bold text-white">
                  {imageCount}
                </span>
              ) : null}
            </div>
          ) : (
            <div className="relative flex size-12 items-center justify-center rounded-lg border border-dashed border-gray-200 bg-gray-50 text-gray-300">
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
          <p className="mt-0.5 text-xs text-gray-400">
            {[master.category, master.subcategory].filter(Boolean).join(" · ")}
            {master.material ? ` · ${master.material}` : ""}
          </p>
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
          <Link
            href={`/website/products/${master.id}`}
            className={cn(
              premiumGoldButton,
              "inline-flex h-9 items-center gap-1.5 px-3 text-xs no-underline",
            )}
          >
            <Pencil className="size-3.5" />
            Άνοιγμα
          </Link>
        </td>
      </tr>
      {isExpanded ? (
        <tr className="bg-gray-50/80">
          <td colSpan={6} className="px-4 py-3">
            <WebsiteMasterVariantsTable
              variants={master.variants}
              isBusy={isBusy}
              onInternalPriceSave={onInternalPriceSave}
              onDimensionsSave={onDimensionsSave}
              onColorSave={onColorSave}
              onStockSave={onStockSave}
              onSubcategorySave={onSubcategorySave}
            />
            <div className="mt-3 flex justify-end">
              <button
                type="button"
                onClick={() => setAddVariantOpen(true)}
                disabled={isBusy}
                className={cn(
                  premiumSecondaryButton,
                  "inline-flex h-9 items-center gap-1.5 px-3 text-xs font-semibold disabled:opacity-50",
                )}
              >
                + Νέα Παραλλαγή
              </button>
            </div>
            <AddMasterVariantDialog
              master={master}
              open={addVariantOpen}
              onOpenChange={setAddVariantOpen}
              onCreated={onVariantCreated}
            />
          </td>
        </tr>
      ) : null}
    </>
  );
}
