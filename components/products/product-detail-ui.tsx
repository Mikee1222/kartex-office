"use client";

import { ArrowLeft, Box, Layers, Palette, TrendingUp, Wallet } from "lucide-react";
import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

import { CategoryBadge, getCategoryIconClass } from "@/components/products/category-badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  premiumCard,
  premiumGoldButton,
  premiumLabel,
  premiumStatCard,
} from "@/lib/ui/premium-styles";
import { formatCurrencyEl } from "@/types/database";
import { cn } from "@/lib/utils";

export function marginBadgeClass(marginPct: number): string {
  if (marginPct > 30) return "bg-emerald-100 text-emerald-800";
  if (marginPct > 15) return "bg-amber-100 text-amber-900";
  return "bg-red-100 text-red-800";
}

export function DetailField({
  label,
  value,
  className,
}: {
  label: string;
  value: string;
  className?: string;
}) {
  return (
    <div className={className}>
      <p className={premiumLabel}>{label}</p>
      <p className="mt-1 text-sm font-medium text-navy-900">{value}</p>
    </div>
  );
}

type ProductDetailBackLinkProps = {
  href: string;
  label: string;
};

export function ProductDetailBackLink({ href, label }: ProductDetailBackLinkProps) {
  return (
    <Link
      href={href}
      className="inline-flex items-center gap-1.5 text-sm font-medium text-gray-400 transition-colors hover:text-navy-900"
    >
      <ArrowLeft className="size-4" aria-hidden />
      {label}
    </Link>
  );
}

type ProductDetailHeroProps = {
  title: string;
  category?: string;
  isActive?: boolean;
  onToggleActive?: () => void;
  toggleBusy?: boolean;
  badges?: ReactNode;
  editAction?: ReactNode;
  action?: ReactNode;
  icon?: ReactNode;
  iconContainerClassName?: string;
};

export function ProductDetailHero({
  title,
  category,
  isActive,
  onToggleActive,
  toggleBusy = false,
  badges,
  editAction,
  action,
  icon,
  iconContainerClassName,
}: ProductDetailHeroProps) {
  const heroAction = action ?? editAction;
  const showBuiltInBadges = category != null;

  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-navy-900 via-navy-800 to-navy-700 p-6 shadow-card sm:p-8">
      <div
        className="pointer-events-none absolute -right-16 -top-16 size-64 rounded-full bg-gold-500/10 blur-3xl"
        aria-hidden
      />
      <div className="relative flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex gap-4">
          <span
            className={cn(
              "flex h-14 w-14 shrink-0 items-center justify-center rounded-xl border border-white/20 bg-white/10 text-white backdrop-blur-sm",
              iconContainerClassName ?? getCategoryIconClass(category ?? ""),
            )}
          >
            {icon ?? <Box className="size-7" aria-hidden />}
          </span>
          <div className="min-w-0 space-y-3">
            <h1 className="text-2xl font-semibold tracking-tight text-white sm:text-3xl">
              {title}
            </h1>
            <div className="flex flex-wrap items-center gap-2">
              {showBuiltInBadges ? (
                <>
                  <CategoryBadge category={category} />
                  {onToggleActive ? (
                    <button
                      type="button"
                      disabled={toggleBusy}
                      onClick={onToggleActive}
                      className={cn(
                        "rounded-full px-2.5 py-1 text-xs font-semibold transition-colors",
                        isActive
                          ? "bg-success/20 text-emerald-200"
                          : "bg-white/10 text-white/60",
                      )}
                    >
                      {isActive ? "Ενεργό" : "Ανενεργό"}
                    </button>
                  ) : (
                    <span
                      className={cn(
                        "rounded-full px-2.5 py-1 text-xs font-semibold",
                        isActive
                          ? "bg-success/20 text-emerald-200"
                          : "bg-white/10 text-white/60",
                      )}
                    >
                      {isActive ? "Ενεργό" : "Ανενεργό"}
                    </span>
                  )}
                </>
              ) : null}
              {badges}
            </div>
          </div>
        </div>
        {heroAction ? <div className="shrink-0">{heroAction}</div> : null}
      </div>
    </div>
  );
}

type ProductDetailStatCardProps = {
  icon: LucideIcon;
  label: string;
  value: ReactNode;
  hint?: ReactNode;
  valueClassName?: string;
};

export function ProductDetailStatCard({
  icon: Icon,
  label,
  value,
  hint,
  valueClassName,
}: ProductDetailStatCardProps) {
  return (
    <article className={cn(premiumStatCard, "p-5")}>
      <div className="flex items-center gap-2 text-gray-400">
        <Icon className="size-4" aria-hidden />
        <p className="text-xs font-medium uppercase tracking-wide">{label}</p>
      </div>
      <p
        className={cn(
          "mt-2 text-[28px] font-semibold leading-none tabular-nums text-navy-900",
          valueClassName,
        )}
      >
        {value}
      </p>
      {hint ? <p className="mt-1 text-sm text-gray-400">{hint}</p> : null}
    </article>
  );
}

type ProductQualityMaterialCardProps = {
  qualityGrade?: string | null;
  materialName?: string | null;
  materialSpec?: string | null;
  subcategory?: string | null;
  category?: string | null;
  description?: string | null;
  onEdit?: () => void;
};

export function ProductQualityMaterialCard({
  qualityGrade,
  materialName,
  materialSpec,
  subcategory,
  category,
  description,
  onEdit,
}: ProductQualityMaterialCardProps) {
  const editControl = onEdit ? (
    <button
      type="button"
      onClick={onEdit}
      className="text-xs font-medium text-gold-600 transition-colors hover:text-gold-500 hover:underline"
    >
      Επεξεργασία
    </button>
  ) : null;

  return (
    <div className={cn(premiumCard, "p-5")}>
      <div className="mb-4 flex items-center justify-between">
        <h3 className="flex items-center gap-2 text-sm font-bold text-navy-900">
          <Layers size={16} className="text-gold-500" aria-hidden />
          Ποιότητα & Υλικό
        </h3>
        {editControl}
      </div>
      <div className="space-y-3">
        {qualityGrade ? (
          <div>
            <div className="mb-1.5 text-xs text-gray-400">Σειρά / Ποιότητα</div>
            <div className="inline-flex items-center gap-2 rounded-xl border border-gold-500/20 bg-gold-500/10 px-3 py-2">
              <span className="text-sm font-bold text-navy-900">{qualityGrade}</span>
            </div>
          </div>
        ) : null}
        {materialName ? (
          <div>
            <div className="mb-1.5 text-xs text-gray-400">Υλικό</div>
            <div className="inline-flex items-center gap-2 rounded-xl border border-gold-500/20 bg-gold-500/10 px-3 py-2">
              <span className="text-sm font-bold text-navy-900">{materialName}</span>
            </div>
            {materialSpec?.trim() ? (
              <p className="mt-2 text-sm leading-relaxed text-gray-600">{materialSpec.trim()}</p>
            ) : null}
          </div>
        ) : materialSpec?.trim() ? (
          <div>
            <div className="mb-1.5 text-xs text-gray-400">Υλικό</div>
            <div className="rounded-xl bg-navy-900/5 px-3 py-2 text-sm font-medium text-navy-900">
              {materialSpec.trim()}
            </div>
          </div>
        ) : null}
        {subcategory ? (
          <div>
            <div className="mb-1.5 text-xs text-gray-400">Υποκατηγορία</div>
            <div className="rounded-xl bg-navy-900/5 px-3 py-2 text-sm font-medium text-navy-900">
              {subcategory}
            </div>
          </div>
        ) : null}
        {category ? (
          <div>
            <div className="mb-1.5 text-xs text-gray-400">Κατηγορία</div>
            <CategoryBadge category={category} />
          </div>
        ) : null}
        {description?.trim() ? (
          <div>
            <div className="mb-1.5 text-xs text-gray-400">Περιγραφή</div>
            <p className="text-sm leading-relaxed text-gray-600">{description.trim()}</p>
          </div>
        ) : null}
        {!qualityGrade && !materialName && !materialSpec?.trim() && !subcategory && !description?.trim() ? (
          <p className="text-sm text-gray-400">Δεν έχουν οριστεί στοιχεία ποιότητας</p>
        ) : null}
      </div>
    </div>
  );
}

export type MasterColorSummaryRow = {
  id: string;
  name: string;
  hexCode: string;
  stock: number;
};

type ProductColorsSummaryCardProps = {
  colors: MasterColorSummaryRow[];
};

export function ProductColorsSummaryCard({ colors }: ProductColorsSummaryCardProps) {
  return (
    <div className={cn(premiumCard, "p-5")}>
      <div className="mb-4 flex items-center justify-between">
        <h3 className="flex items-center gap-2 text-sm font-bold text-navy-900">
          <Palette size={16} className="text-gold-500" aria-hidden />
          Χρώματα
        </h3>
      </div>
      {colors.length === 0 ? (
        <p className="text-sm text-gray-400">Δεν έχουν οριστεί χρώματα</p>
      ) : (
        <div className="space-y-2">
          {colors.map((color) => (
            <div key={color.id} className="flex items-center gap-3">
              <span
                className="size-5 shrink-0 rounded-full border border-black/10"
                style={{ backgroundColor: color.hexCode }}
                aria-hidden
              />
              <span className="flex-1 truncate text-sm font-medium text-navy-900">
                {color.name}
              </span>
              <span
                className={cn(
                  "text-sm font-bold tabular-nums",
                  color.stock <= 0 ? "text-red-600" : "text-emerald-700",
                )}
              >
                {color.stock}
              </span>
              <span className="text-xs text-gray-400">τεμ.</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

type ProductImagesCardProps = {
  children: ReactNode;
};

export function ProductImagesCard({ children }: ProductImagesCardProps) {
  return (
    <div className={cn(premiumCard, "p-5")}>
      <div className="mb-4 flex items-center justify-between">
        <h3 className="flex items-center gap-2 text-sm font-bold text-navy-900">
          <Box size={16} className="text-gold-500" aria-hidden />
          Εικόνες
        </h3>
      </div>
      {children}
    </div>
  );
}

type ProductFinancialsCardProps = {
  items: Array<{
    label: string;
    value: ReactNode;
    highlight?: boolean;
  }>;
};

export function ProductFinancialsCard({ items }: ProductFinancialsCardProps) {
  return (
    <Card className={premiumCard}>
      <CardHeader>
        <CardTitle className="text-lg text-navy-900">Οικονομικά</CardTitle>
      </CardHeader>
      <CardContent>
        <dl className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {items.map((item) => (
            <div
              key={item.label}
              className={cn(
                "rounded-xl border p-4",
                item.highlight
                  ? "border-gold-500/20 bg-gold-500/5 sm:col-span-2 lg:col-span-1"
                  : "border-gray-100 bg-gray-50/50",
              )}
            >
              <dt className={premiumLabel}>{item.label}</dt>
              <dd className="mt-1 text-lg font-semibold tabular-nums text-navy-900">
                {item.value}
              </dd>
            </div>
          ))}
        </dl>
      </CardContent>
    </Card>
  );
}

export function formatFinancialCurrency(value: number | null | undefined): string {
  if (value == null || !Number.isFinite(value)) return "—";
  return formatCurrencyEl(value);
}

export function ProductDetailSkeleton() {
  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <Skeleton className="h-5 w-24" />
      <Skeleton className="h-40 w-full rounded-2xl" />
      <div className="grid gap-4 md:grid-cols-3">
        {Array.from({ length: 3 }).map((_, index) => (
          <Skeleton key={index} className="h-48 rounded-2xl" />
        ))}
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <Skeleton key={index} className="h-24 rounded-2xl" />
        ))}
      </div>
      <Skeleton className="h-64 w-full rounded-2xl" />
    </div>
  );
}

type ProductOverviewCardProps = {
  title: string;
  icon: LucideIcon;
  action?: ReactNode;
  children: ReactNode;
};

export function ProductOverviewCard({
  title,
  icon: Icon,
  action,
  children,
}: ProductOverviewCardProps) {
  return (
    <div className={cn(premiumCard, "p-5")}>
      <div className="mb-4 flex items-center justify-between">
        <h3 className="flex items-center gap-2 text-sm font-bold text-navy-900">
          <Icon size={16} className="text-gold-500" aria-hidden />
          {title}
        </h3>
        {action}
      </div>
      {children}
    </div>
  );
}

type ProductStatCardProps = {
  icon: LucideIcon;
  label: string;
  value: ReactNode;
  subtitle?: ReactNode;
  hint?: ReactNode;
  valueClassName?: string;
};

export function ProductStatCard({
  icon,
  label,
  value,
  subtitle,
  hint,
  valueClassName,
}: ProductStatCardProps) {
  return (
    <ProductDetailStatCard
      icon={icon}
      label={label}
      value={value}
      hint={subtitle ?? hint}
      valueClassName={valueClassName}
    />
  );
}

export const ProductFinancialCard = ProductFinancialsCard;

export { Layers, Palette, premiumGoldButton, TrendingUp, Wallet };
