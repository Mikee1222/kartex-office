"use client";

import {
  AlertCircle,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Layers,
  Package,
  Palette,
  Pencil,
  Ruler,
  TriangleAlert,
  Weight,
} from "lucide-react";
import * as React from "react";

import { CategoryBadge } from "@/components/products/category-badge";
import { StockBar } from "@/components/products/stock-bar";
import { StockStatusIcon } from "@/components/products/stock-status-icon";
import { getStockStatus } from "@/components/products/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  stockBarColorClass,
  type MasterGroup,
  type ProductVariant,
} from "@/lib/products/master-groups";
import { premiumCard, premiumLabel, premiumStatCard } from "@/lib/ui/premium-styles";
import { cn } from "@/lib/utils";

export const MASTER_GROUP_PAGE_SIZE = 24;

export const masterGroupGridClass =
  "grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-4";

type MasterGroupStatsRowProps = {
  criticalCount: number;
  lowCount: number;
  okCount: number;
};

export function MasterGroupStatsRow({
  criticalCount,
  lowCount,
  okCount,
}: MasterGroupStatsRowProps) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
      <div className={cn(premiumStatCard, "flex items-center gap-3 p-4")}>
        <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-red-50">
          <AlertCircle size={20} className="text-red-500" aria-hidden />
        </div>
        <div>
          <p className="text-2xl font-bold tabular-nums text-red-700">{criticalCount}</p>
          <p className={premiumLabel}>Κρίσιμα</p>
        </div>
      </div>
      <div className={cn(premiumStatCard, "flex items-center gap-3 p-4")}>
        <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-amber-50">
          <TriangleAlert size={20} className="text-amber-500" aria-hidden />
        </div>
        <div>
          <p className="text-2xl font-bold tabular-nums text-amber-700">{lowCount}</p>
          <p className={premiumLabel}>Χαμηλά</p>
        </div>
      </div>
      <div className={cn(premiumStatCard, "flex items-center gap-3 p-4")}>
        <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50">
          <CheckCircle2 size={20} className="text-emerald-500" aria-hidden />
        </div>
        <div>
          <p className="text-2xl font-bold tabular-nums text-emerald-700">{okCount}</p>
          <p className={premiumLabel}>Επαρκή</p>
        </div>
      </div>
    </div>
  );
}

export function MasterGroupStatsSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
      {Array.from({ length: 3 }).map((_, index) => (
        <div
          key={index}
          className={cn(premiumStatCard, "h-[72px] animate-pulse bg-gray-50")}
        />
      ))}
    </div>
  );
}

export function MasterGroupGridSkeleton() {
  return (
    <div className={masterGroupGridClass}>
      {Array.from({ length: 8 }).map((_, index) => (
        <div
          key={index}
          className={cn(premiumCard, "h-44 animate-pulse bg-gray-50")}
        />
      ))}
    </div>
  );
}

function groupAccentBorder(group: MasterGroup) {
  if (group.hasCriticalStock) return "border-l-[3px] border-l-red-400";
  if (group.hasLowStock) return "border-l-[3px] border-l-amber-400";
  return "border-l-[3px] border-l-gold-500/40";
}

function groupIconBg(group: MasterGroup) {
  if (group.hasCriticalStock) return "bg-red-50 text-red-500";
  if (group.hasLowStock) return "bg-amber-50 text-amber-500";
  return "bg-gold-500/10 text-gold-500";
}

function VariantBadges({ variant }: { variant: ProductVariant }) {
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {variant.widthCm && variant.heightCm ? (
        <span className="inline-flex items-center gap-1 rounded-md bg-navy-900/5 px-2 py-0.5 text-[11px] font-semibold text-navy-900">
          <Ruler size={10} aria-hidden />
          {variant.widthCm}×{variant.heightCm}
        </span>
      ) : null}
      {variant.gsm ? (
        <span className="inline-flex items-center gap-1 rounded-md bg-navy-900/5 px-2 py-0.5 text-[11px] font-semibold text-navy-900">
          <Weight size={10} aria-hidden />
          {variant.gsm}gsm
        </span>
      ) : null}
      {variant.threadCount ? (
        <span className="rounded-md bg-navy-900/5 px-2 py-0.5 text-[11px] font-semibold text-navy-900">
          T{variant.threadCount}
        </span>
      ) : null}
      {variant.color ? (
        <span className="inline-flex items-center gap-1 rounded-md border border-gray-200 bg-white px-2 py-0.5 text-[11px] font-medium text-gray-500">
          <Palette size={10} aria-hidden />
          {variant.color}
        </span>
      ) : null}
    </div>
  );
}

type ProductMasterGroupCardProps = {
  group: MasterGroup;
  isExpanded: boolean;
  onToggle: () => void;
  onVariantClick: (variantId: string) => void;
  onVariantEdit: (variantId: string, event: React.MouseEvent) => void;
};

export function ProductMasterGroupCard({
  group,
  isExpanded,
  onToggle,
  onVariantClick,
  onVariantEdit,
}: ProductMasterGroupCardProps) {
  const maxStock = Math.max(...group.variants.map((variant) => variant.stock), 1);
  const groupStockBarPct = Math.min(
    Math.round((group.totalStock / (maxStock * group.variants.length || 1)) * 100),
    100,
  );

  return (
    <article
      className={cn(
        premiumCard,
        groupAccentBorder(group),
        "flex flex-col overflow-hidden",
      )}
    >
      <button
        type="button"
        className="flex flex-1 flex-col gap-3 p-4 text-left transition-colors hover:bg-gray-50/60"
        onClick={onToggle}
        aria-expanded={isExpanded}
      >
        <div className="flex items-start justify-between gap-2">
          <div
            className={cn(
              "flex size-9 shrink-0 items-center justify-center rounded-xl",
              groupIconBg(group),
            )}
          >
            <Package size={18} aria-hidden />
          </div>
          {isExpanded ? (
            <ChevronUp size={16} className="shrink-0 text-gray-400" aria-hidden />
          ) : (
            <ChevronDown size={16} className="shrink-0 text-gray-400" aria-hidden />
          )}
        </div>

        <div className="min-w-0 space-y-1.5">
          <h3 className="line-clamp-2 text-sm font-semibold leading-snug text-navy-900">
            {group.cleanName}
          </h3>
          <div className="flex flex-wrap items-center gap-1.5">
            {group.qualityGrade ? (
              <span className="rounded-full bg-gold-500/15 px-2 py-0.5 text-[10px] font-semibold text-navy-900">
                {group.qualityGrade}
              </span>
            ) : null}
            <CategoryBadge category={group.category} />
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-end justify-between gap-2">
            <div>
              <p className={premiumLabel}>Συνολικό απόθεμα</p>
              <p
                className={cn(
                  "text-xl font-bold tabular-nums",
                  group.hasCriticalStock
                    ? "text-red-600"
                    : group.hasLowStock
                      ? "text-amber-600"
                      : "text-navy-900",
                )}
              >
                {group.totalStock}
              </p>
            </div>
            <div className="text-right">
              <p className={premiumLabel}>Παραλλαγές</p>
              <p className="text-sm font-semibold tabular-nums text-navy-900">
                {group.variants.length}
              </p>
            </div>
          </div>
          <div className="h-1 overflow-hidden rounded-full bg-gray-100">
            <div
              className={cn(
                "h-full rounded-full transition-all",
                group.hasCriticalStock
                  ? "bg-red-500"
                  : group.hasLowStock
                    ? "bg-amber-500"
                    : "bg-emerald-500",
              )}
              style={{ width: `${groupStockBarPct}%` }}
            />
          </div>
          {group.material ? (
            <p className="flex items-center gap-1 text-[11px] text-gray-400">
              <Layers size={10} aria-hidden />
              {group.material}
            </p>
          ) : null}
        </div>
      </button>

      {isExpanded ? (
        <div className="border-t border-gray-100 bg-gray-50/50">
          {group.variants.map((variant, index) => {
            const barPct = Math.round((variant.stock / maxStock) * 100);
            const status = getStockStatus(variant.stock, variant.minStock);

            return (
              <div
                key={variant.id}
                role="button"
                tabIndex={0}
                className={cn(
                  "flex cursor-pointer items-center gap-3 px-4 py-3 transition-colors hover:bg-white/80",
                  index < group.variants.length - 1 && "border-b border-gray-100/80",
                )}
                onClick={() => onVariantClick(variant.id)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    onVariantClick(variant.id);
                  }
                }}
              >
                <div className="min-w-0 flex-1 space-y-1.5">
                  <VariantBadges variant={variant} />
                  <div className="flex items-center gap-2">
                    <div className="h-1 flex-1 overflow-hidden rounded-full bg-gray-100">
                      <div
                        className={cn(
                          "h-full rounded-full",
                          stockBarColorClass(variant.stock, variant.minStock),
                        )}
                        style={{ width: `${Math.min(barPct, 100)}%` }}
                      />
                    </div>
                    <span className="shrink-0 font-mono text-[10px] text-gray-400">
                      {variant.sku}
                    </span>
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-1.5">
                  <StockStatusIcon stock={variant.stock} minStock={variant.minStock} />
                  <span
                    className={cn(
                      "text-base font-bold tabular-nums",
                      status === "critical"
                        ? "text-red-600"
                        : status === "low"
                          ? "text-amber-600"
                          : "text-emerald-700",
                    )}
                  >
                    {variant.stock}
                  </span>
                  <button
                    type="button"
                    onClick={(event) => onVariantEdit(variant.id, event)}
                    className="rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-gold-500/10 hover:text-gold-500"
                    aria-label="Επεξεργασία παραλλαγής"
                  >
                    <Pencil size={13} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : null}
    </article>
  );
}

type InventoryMasterGroupCardProps = {
  group: MasterGroup;
  isExpanded: boolean;
  onToggle: () => void;
  productAdjustId: string | null;
  productAdjustQty: string;
  productAdjustSaving: boolean;
  onStartAdjust: (variant: ProductVariant) => void;
  onCancelAdjust: () => void;
  onAdjustQtyChange: (value: string) => void;
  onSaveAdjust: (variant: ProductVariant) => void;
};

export function InventoryMasterGroupCard({
  group,
  isExpanded,
  onToggle,
  productAdjustId,
  productAdjustQty,
  productAdjustSaving,
  onStartAdjust,
  onCancelAdjust,
  onAdjustQtyChange,
  onSaveAdjust,
}: InventoryMasterGroupCardProps) {
  const maxStock = Math.max(...group.variants.map((variant) => variant.stock), 1);
  const groupStockBarPct = Math.min(
    Math.round((group.totalStock / (maxStock * group.variants.length || 1)) * 100),
    100,
  );

  return (
    <article
      className={cn(
        premiumCard,
        groupAccentBorder(group),
        "flex flex-col overflow-hidden",
      )}
    >
      <button
        type="button"
        className="flex flex-1 flex-col gap-3 p-4 text-left transition-colors hover:bg-gray-50/60"
        onClick={onToggle}
        aria-expanded={isExpanded}
      >
        <div className="flex items-start justify-between gap-2">
          <div
            className={cn(
              "flex size-9 shrink-0 items-center justify-center rounded-xl",
              groupIconBg(group),
            )}
          >
            <Package size={18} aria-hidden />
          </div>
          {isExpanded ? (
            <ChevronUp size={16} className="shrink-0 text-gray-400" aria-hidden />
          ) : (
            <ChevronDown size={16} className="shrink-0 text-gray-400" aria-hidden />
          )}
        </div>

        <div className="min-w-0 space-y-1.5">
          <h3 className="line-clamp-2 text-sm font-semibold leading-snug text-navy-900">
            {group.cleanName}
          </h3>
          <CategoryBadge category={group.category} />
        </div>

        <div className="space-y-2">
          <div className="flex items-end justify-between gap-2">
            <div>
              <p className={premiumLabel}>Συνολικό απόθεμα</p>
              <div className="flex items-center gap-1.5">
                <StockStatusIcon
                  stock={group.totalStock}
                  minStock={group.minStock * group.variants.length}
                />
                <p
                  className={cn(
                    "text-xl font-bold tabular-nums",
                    group.hasCriticalStock
                      ? "text-red-600"
                      : group.hasLowStock
                        ? "text-amber-600"
                        : "text-navy-900",
                  )}
                >
                  {group.totalStock}
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className={premiumLabel}>Παραλλαγές</p>
              <p className="text-sm font-semibold tabular-nums text-navy-900">
                {group.variants.length}
              </p>
            </div>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-gray-100">
            <div
              className={cn(
                "h-full rounded-full transition-all",
                group.hasCriticalStock
                  ? "bg-red-500"
                  : group.hasLowStock
                    ? "bg-amber-500"
                    : "bg-emerald-500",
              )}
              style={{ width: `${groupStockBarPct}%` }}
            />
          </div>
        </div>
      </button>

      {isExpanded ? (
        <div className="border-t border-gray-100 bg-gray-50/50">
          {group.variants.map((variant, index) => {
            const status = getStockStatus(variant.stock, variant.minStock);
            const isAdjusting = productAdjustId === variant.id;

            return (
              <div
                key={variant.id}
                className={cn(
                  "space-y-2 px-4 py-3",
                  index < group.variants.length - 1 && "border-b border-gray-100/80",
                )}
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0 flex-1 space-y-1.5">
                    <VariantBadges variant={variant} />
                    <StockBar
                      stock={variant.stock}
                      maxStock={maxStock}
                      minStock={variant.minStock}
                      showLabel={false}
                      thin
                    />
                    <p className="font-mono text-[10px] text-gray-400">SKU {variant.sku}</p>
                  </div>
                  <div className="shrink-0 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <StockStatusIcon stock={variant.stock} minStock={variant.minStock} />
                      <span
                        className={cn(
                          "text-base font-bold tabular-nums",
                          status === "critical"
                            ? "text-red-600"
                            : status === "low"
                              ? "text-amber-600"
                              : "text-emerald-700",
                        )}
                      >
                        {variant.stock}
                      </span>
                    </div>
                    <div className="mt-1 flex flex-wrap justify-end gap-1 text-[10px]">
                      <span className="rounded-full bg-orange-50 px-2 py-0.5 font-semibold text-orange-700">
                        {variant.reservedStock} δεσμ.
                      </span>
                      <span className="rounded-full bg-emerald-50 px-2 py-0.5 font-semibold text-emerald-700">
                        {variant.availableStock} διαθ.
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex flex-wrap items-center justify-end gap-2 pt-1">
                  {isAdjusting ? (
                    <>
                      <Input
                        type="number"
                        min={0}
                        value={productAdjustQty}
                        onChange={(event) => onAdjustQtyChange(event.target.value)}
                        className="h-8 w-24 text-sm"
                        aria-label="Νέο απόθεμα"
                      />
                      <Button
                        type="button"
                        size="sm"
                        disabled={productAdjustSaving}
                        onClick={() => onSaveAdjust(variant)}
                      >
                        OK
                      </Button>
                      <Button type="button" size="sm" variant="ghost" onClick={onCancelAdjust}>
                        Άκυρο
                      </Button>
                    </>
                  ) : (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="h-8 border-gold-500/40 text-xs font-semibold text-navy-900 hover:bg-gold-500/10"
                      onClick={() => onStartAdjust(variant)}
                    >
                      Προσαρμογή
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : null}
    </article>
  );
}