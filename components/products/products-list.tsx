"use client";

import {
  AlertCircle,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Layers,
  Package,
  Palette,
  Pencil,
  Plus,
  Ruler,
  Search,
  TriangleAlert,
  Weight,
} from "lucide-react";
import { useRouter } from "next/navigation";
import * as React from "react";
import { toast } from "sonner";

import { DataError } from "@/components/dashboard/data-error";
import { EmptyState } from "@/components/dashboard/empty-state";
import { CategoryBadge } from "@/components/products/category-badge";
import { StockStatusIcon } from "@/components/products/stock-status-icon";
import { getStockStatus } from "@/components/products/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PageHeader } from "@/components/ui/page-header";
import { PaginationControls } from "@/components/ui/pagination-controls";
import {
  buildMasterGroups,
  countMasterGroupStats,
  resolveMasterGroupKey,
  stockBarColorClass,
  type MasterGroup,
} from "@/lib/products/master-groups";
import {
  premiumFilterTabActiveCategory,
  premiumFilterTabInactive,
  premiumGoldButton,
  premiumInputFocus,
} from "@/lib/ui/premium-styles";
import { createClient } from "@/lib/supabase/client";
import { mapProductRow, type ProductRow } from "@/types/database";
import { cn } from "@/lib/utils";

const ITEMS_PER_PAGE = 20;

export function ProductsList() {
  const router = useRouter();
  const [products, setProducts] = React.useState<ProductRow[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [search, setSearch] = React.useState("");
  const [activeCategory, setActiveCategory] = React.useState("all");
  const [expandedMasters, setExpandedMasters] = React.useState<Set<string>>(
    () => new Set(),
  );
  const [currentPage, setCurrentPage] = React.useState(1);
  const [fetchKey, setFetchKey] = React.useState(0);

  React.useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);
      const supabase = createClient();
      const { data, error: fetchError } = await supabase
        .from("products")
        .select("*")
        .eq("is_active", true)
        .order("clean_name", { ascending: true });

      if (cancelled) return;

      if (fetchError) {
        setError(
          fetchError.message ||
            "Αποτυχία φόρτωσης προϊόντων. Ελέγξτε τη σύνδεση και τα δικαιώματα πρόσβασης.",
        );
        setProducts([]);
        setLoading(false);
        return;
      }

      setProducts((data ?? []) as ProductRow[]);
      setLoading(false);
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [fetchKey]);

  const masterGroups = React.useMemo(() => {
    const mapped = products.map(mapProductRow);
    return buildMasterGroups(mapped);
  }, [products]);

  const categories = React.useMemo(
    () => [...new Set(masterGroups.map((group) => group.category))].sort((a, b) =>
      a.localeCompare(b, "el"),
    ),
    [masterGroups],
  );

  const filtered = React.useMemo(() => {
    const trimmedSearch = search.trim().toLowerCase();
    return masterGroups.filter((group) => {
      if (activeCategory !== "all" && group.category !== activeCategory) {
        return false;
      }
      if (!trimmedSearch) return true;
      return (
        group.cleanName.toLowerCase().includes(trimmedSearch) ||
        group.variants.some(
          (variant) =>
            variant.sku.toLowerCase().includes(trimmedSearch) ||
            variant.name.toLowerCase().includes(trimmedSearch),
        )
      );
    });
  }, [masterGroups, activeCategory, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));
  const paginated = filtered.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE,
  );

  const { criticalCount, lowCount, okCount } = React.useMemo(
    () => countMasterGroupStats(masterGroups),
    [masterGroups],
  );

  const hasActiveFilters = search.trim().length > 0 || activeCategory !== "all";

  React.useEffect(() => {
    setCurrentPage(1);
  }, [search, activeCategory]);

  function toggleMaster(key: string) {
    setExpandedMasters((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <PageHeader
        title="Προϊόντα"
        subtitle="Διαχείριση καταλόγου και αποθέματος"
        action={
          <Button
            type="button"
            className={premiumGoldButton}
            onClick={() => router.push("/products/new")}
          >
            <Plus size={16} />
            Νέο Προϊόν
          </Button>
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="flex items-center gap-3 rounded-2xl border border-red-200 bg-red-50 p-4">
          <AlertCircle size={24} className="shrink-0 text-red-500" aria-hidden />
          <div>
            <div className="text-2xl font-bold text-red-700">{criticalCount}</div>
            <div className="text-xs font-medium uppercase tracking-wide text-red-500">
              Κρίσιμα
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4">
          <TriangleAlert size={24} className="shrink-0 text-amber-500" aria-hidden />
          <div>
            <div className="text-2xl font-bold text-amber-700">{lowCount}</div>
            <div className="text-xs font-medium uppercase tracking-wide text-amber-500">
              Χαμηλά
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
          <CheckCircle2 size={24} className="shrink-0 text-emerald-500" aria-hidden />
          <div>
            <div className="text-2xl font-bold text-emerald-700">{okCount}</div>
            <div className="text-xs font-medium uppercase tracking-wide text-emerald-500">
              Επαρκή
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-3">
        <div className="relative max-w-md">
          <Search
            size={16}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
            aria-hidden
          />
          <Input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Αναζήτηση προϊόντος, SKU..."
            className={cn("pl-9", premiumInputFocus)}
            aria-label="Αναζήτηση προϊόντων"
            disabled={loading}
          />
        </div>

        <div
          className="flex flex-wrap gap-2"
          role="tablist"
          aria-label="Φίλτρο κατηγορίας"
        >
          <button
            type="button"
            role="tab"
            aria-selected={activeCategory === "all"}
            onClick={() => setActiveCategory("all")}
            className={cn(
              activeCategory === "all"
                ? premiumFilterTabActiveCategory
                : premiumFilterTabInactive,
            )}
          >
            Όλα ({masterGroups.length})
          </button>
          {categories.map((category) => (
            <button
              key={category}
              type="button"
              role="tab"
              aria-selected={activeCategory === category}
              onClick={() => setActiveCategory(category)}
              className={cn(
                activeCategory === category
                  ? premiumFilterTabActiveCategory
                  : premiumFilterTabInactive,
              )}
            >
              {category} ({masterGroups.filter((group) => group.category === category).length})
            </button>
          ))}
        </div>
      </div>

      {error ? (
        <DataError message={error} onRetry={() => setFetchKey((key) => key + 1)} />
      ) : null}

      <div className="space-y-2">
        {loading
          ? Array.from({ length: 6 }).map((_, index) => (
              <div
                key={index}
                className="h-16 animate-pulse rounded-2xl bg-muted"
              />
            ))
          : null}

        {!loading && !error && paginated.length === 0 ? (
          <EmptyState
            icon={Package}
            title={
              masterGroups.length === 0 && !hasActiveFilters
                ? "Δεν υπάρχουν προϊόντα"
                : "Δεν βρέθηκαν αποτελέσματα"
            }
            description={
              masterGroups.length === 0 && !hasActiveFilters
                ? "Προσθέστε το πρώτο προϊόν στον κατάλογό σας."
                : "Δοκιμάστε άλλο φίλτρο ή όρο αναζήτησης."
            }
            actionLabel={
              masterGroups.length === 0 && !hasActiveFilters ? "Νέο Προϊόν" : undefined
            }
            actionHref="/products/new"
            className="rounded-2xl border border-border bg-card py-12"
          />
        ) : null}

        {!loading && !error
          ? paginated.map((group) => (
              <MasterGroupCard
                key={resolveMasterGroupKey(group)}
                group={group}
                isExpanded={expandedMasters.has(resolveMasterGroupKey(group))}
                onToggle={() => toggleMaster(resolveMasterGroupKey(group))}
                onVariantClick={(variantId) => router.push(`/products/${variantId}`)}
                onVariantEdit={(variantId, event) => {
                  event.stopPropagation();
                  router.push(`/products/${variantId}/edit`);
                }}
              />
            ))
          : null}
      </div>

      {!loading && !error && filtered.length > 0 ? (
        <PaginationControls
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={filtered.length}
          itemsPerPage={ITEMS_PER_PAGE}
          onPageChange={setCurrentPage}
          itemLabel="ομάδες προϊόντων"
        />
      ) : null}
    </div>
  );
}

type MasterGroupCardProps = {
  group: MasterGroup;
  isExpanded: boolean;
  onToggle: () => void;
  onVariantClick: (variantId: string) => void;
  onVariantEdit: (variantId: string, event: React.MouseEvent) => void;
};

function MasterGroupCard({
  group,
  isExpanded,
  onToggle,
  onVariantClick,
  onVariantEdit,
}: MasterGroupCardProps) {
  const maxStock = Math.max(...group.variants.map((variant) => variant.stock), 1);

  return (
    <div
      className={cn(
        "overflow-hidden rounded-2xl border bg-card transition-all duration-200",
        group.hasCriticalStock
          ? "border-red-200"
          : group.hasLowStock
            ? "border-amber-200"
            : "border-border",
      )}
    >
      <button
        type="button"
        className="flex w-full items-center gap-4 px-5 py-4 text-left transition-colors hover:bg-muted/30"
        onClick={onToggle}
      >
        {isExpanded ? (
          <ChevronDown size={18} className="shrink-0 text-muted-foreground" aria-hidden />
        ) : (
          <ChevronRight size={18} className="shrink-0 text-muted-foreground" aria-hidden />
        )}

        <div
          className={cn(
            "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl",
            group.hasCriticalStock
              ? "bg-red-100"
              : group.hasLowStock
                ? "bg-amber-100"
                : "bg-kartex-gold/10",
          )}
        >
          <Package
            size={20}
            className={
              group.hasCriticalStock
                ? "text-red-500"
                : group.hasLowStock
                  ? "text-amber-500"
                  : "text-kartex-gold"
            }
            aria-hidden
          />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-semibold text-kartex-navy">{group.cleanName}</span>
            {group.qualityGrade ? (
              <span className="rounded-full bg-kartex-gold/15 px-2 py-0.5 text-xs font-medium text-kartex-navy">
                {group.qualityGrade}
              </span>
            ) : null}
            <CategoryBadge category={group.category} />
          </div>
          <div className="mt-1 flex items-center gap-3">
            <span className="text-xs text-muted-foreground">
              {group.variants.length}{" "}
              {group.variants.length === 1 ? "παραλλαγή" : "παραλλαγές"}
            </span>
            {group.material ? (
              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                <Layers size={11} aria-hidden />
                {group.material}
              </span>
            ) : null}
          </div>
        </div>

        <div className="shrink-0 text-right">
          <div className="flex items-center justify-end gap-2">
            <StockStatusIcon
              stock={group.totalStock}
              minStock={group.minStock * group.variants.length}
            />
            <span
              className={cn(
                "text-xl font-bold tabular-nums",
                group.hasCriticalStock
                  ? "text-red-600"
                  : group.hasLowStock
                    ? "text-amber-600"
                    : "text-kartex-navy",
              )}
            >
              {group.totalStock}
            </span>
          </div>
          <div className="text-xs text-muted-foreground">τεμ. συνολικά</div>
        </div>
      </button>

      {isExpanded ? (
        <div className="border-t border-border/50 bg-muted/20">
          {group.variants.map((variant, index) => {
            const barPct = Math.round((variant.stock / maxStock) * 100);
            const status = getStockStatus(variant.stock, variant.minStock);
            const isCrit = status === "critical";
            const isLow = status === "low";

            return (
              <div
                key={variant.id}
                role="button"
                tabIndex={0}
                className={cn(
                  "flex cursor-pointer items-center gap-4 px-6 py-3 transition-colors hover:bg-muted/40",
                  index < group.variants.length - 1 && "border-b border-border/30",
                )}
                onClick={() => onVariantClick(variant.id)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    onVariantClick(variant.id);
                  }
                }}
              >
                <div className="flex h-full w-4 shrink-0 items-center justify-center">
                  <div className="h-4 w-px bg-border" />
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    {variant.widthCm && variant.heightCm ? (
                      <span className="flex items-center gap-1 rounded-lg bg-kartex-navy/5 px-2 py-1 text-xs font-semibold text-kartex-navy">
                        <Ruler size={11} aria-hidden />
                        {variant.widthCm}×{variant.heightCm}cm
                      </span>
                    ) : null}
                    {variant.gsm ? (
                      <span className="flex items-center gap-1 rounded-lg bg-kartex-navy/5 px-2 py-1 text-xs font-semibold text-kartex-navy">
                        <Weight size={11} aria-hidden />
                        {variant.gsm}gsm
                      </span>
                    ) : null}
                    {variant.threadCount ? (
                      <span className="rounded-lg bg-kartex-navy/5 px-2 py-1 text-xs font-semibold text-kartex-navy">
                        T{variant.threadCount}
                      </span>
                    ) : null}
                    {variant.color ? (
                      <span className="flex items-center gap-1 rounded-lg border border-border bg-background px-2 py-1 text-xs font-medium text-muted-foreground">
                        <Palette size={11} aria-hidden />
                        {variant.color}
                      </span>
                    ) : null}
                  </div>
                  <div className="mt-2 flex items-center gap-2">
                    <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
                      <div
                        className={cn(
                          "h-full rounded-full transition-all",
                          stockBarColorClass(variant.stock, variant.minStock),
                        )}
                        style={{ width: `${Math.min(barPct, 100)}%` }}
                      />
                    </div>
                    <span className="w-16 text-right font-mono text-xs text-muted-foreground">
                      SKU {variant.sku}
                    </span>
                  </div>
                </div>

                <div className="min-w-[80px] shrink-0 text-right">
                  <div className="flex items-center justify-end gap-1.5">
                    <StockStatusIcon stock={variant.stock} minStock={variant.minStock} />
                    <span
                      className={cn(
                        "text-lg font-bold tabular-nums",
                        isCrit
                          ? "text-red-600"
                          : isLow
                            ? "text-amber-600"
                            : "text-emerald-700",
                      )}
                    >
                      {variant.stock}
                    </span>
                  </div>
                  {variant.reservedStock > 0 ? (
                    <div className="text-xs text-muted-foreground">
                      {variant.reservedStock} δεσμ.
                    </div>
                  ) : null}
                </div>

                <button
                  type="button"
                  onClick={(event) => onVariantEdit(variant.id, event)}
                  className="shrink-0 rounded-lg p-2 text-muted-foreground transition-colors hover:bg-kartex-gold/10 hover:text-kartex-gold"
                  aria-label="Επεξεργασία παραλλαγής"
                >
                  <Pencil size={14} />
                </button>
              </div>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}

