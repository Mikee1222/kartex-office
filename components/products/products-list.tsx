"use client";

import { Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import * as React from "react";

import { DataError } from "@/components/dashboard/data-error";
import { EmptyState } from "@/components/dashboard/empty-state";
import {
  MasterGroupGridSkeleton,
  MasterGroupStatsRow,
  MasterGroupStatsSkeleton,
  MASTER_GROUP_PAGE_SIZE,
  masterGroupGridClass,
  ProductMasterGroupCard,
} from "@/components/products/master-group-ui";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PageHeader } from "@/components/ui/page-header";
import { PaginationControls } from "@/components/ui/pagination-controls";
import {
  buildMasterGroups,
  countMasterGroupStats,
  resolveMasterGroupKey,
} from "@/lib/products/master-groups";
import { fetchVariantsForProducts } from "@/lib/products/color-variants";
import { isLegacyColorId } from "@/lib/products/master-variant/legacy-color-options";
import type { CreatedMasterVariantRow } from "@/lib/products/master-variant/types";
import type { ProductColorVariant } from "@/lib/products/types";
import { createClient } from "@/lib/supabase/client";
import {
  premiumFilterTabActiveCategory,
  premiumFilterTabInactive,
  premiumGoldButton,
  premiumInputFocus,
} from "@/lib/ui/premium-styles";
import { mapProductRow, type ProductRow } from "@/types/database";
import { cn } from "@/lib/utils";
import { Package, Search } from "lucide-react";

export function ProductsList() {
  const router = useRouter();
  const [products, setProducts] = React.useState<ProductRow[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [search, setSearch] = React.useState("");
  const [activeCategory, setActiveCategory] = React.useState("all");
  const [expandedKey, setExpandedKey] = React.useState<string | null>(null);
  const [currentPage, setCurrentPage] = React.useState(1);
  const [fetchKey, setFetchKey] = React.useState(0);
  const [variantsByProduct, setVariantsByProduct] = React.useState<
    Map<string, ProductColorVariant[]>
  >(new Map());

  React.useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);
      const supabase = createClient();
      const { data, error: fetchError } = await supabase
        .from("products")
        .select("*, product_masters(clean_name, category)")
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

      const mapped = (data ?? []).map((row) => mapProductRow(row as ProductRow));
      const variantMap = await fetchVariantsForProducts(
        supabase,
        mapped.map((product) => product.id),
      );
      if (!cancelled) {
        setVariantsByProduct(variantMap);
      }

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
    () =>
      [...new Set(masterGroups.map((group) => group.category))].sort((a, b) =>
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

  const totalPages = Math.max(1, Math.ceil(filtered.length / MASTER_GROUP_PAGE_SIZE));
  const paginated = filtered.slice(
    (currentPage - 1) * MASTER_GROUP_PAGE_SIZE,
    currentPage * MASTER_GROUP_PAGE_SIZE,
  );

  const { criticalCount, lowCount, okCount } = React.useMemo(
    () => countMasterGroupStats(masterGroups),
    [masterGroups],
  );

  const hasActiveFilters = search.trim().length > 0 || activeCategory !== "all";

  React.useEffect(() => {
    setCurrentPage(1);
  }, [search, activeCategory]);

  async function handleVariantCreated(
    group: ReturnType<typeof buildMasterGroups>[number],
    variant: CreatedMasterVariantRow,
  ) {
    const now = new Date().toISOString();
    const newRow: ProductRow = {
      id: variant.id,
      name: `${group.cleanName} ${variant.widthCm}×${variant.heightCm}`,
      clean_name: group.cleanName,
      sku: variant.sku,
      barcode: null,
      category: group.category,
      subcategory: variant.subcategory,
      master_id: group.masterId,
      product_masters: {
        clean_name: group.cleanName,
        category: group.category,
      },
      purchase_price: 0,
      sale_price: 0,
      internal_price_eur: variant.internalPriceEur,
      stock: variant.stock,
      reserved_stock: 0,
      min_stock: 0,
      supplier: null,
      description: null,
      notes: null,
      width_cm: variant.widthCm,
      height_cm: variant.heightCm,
      gsm: variant.gsm,
      thread_count: variant.threadCount,
      color: isLegacyColorId(variant.colorId) ? variant.color : null,
      unit: "τεμ",
      material: group.material ?? null,
      quality_grade: group.qualityGrade ?? null,
      is_active: true,
      created_at: now,
    };

    setProducts((current) => [...current, newRow]);

    const supabase = createClient();
    const variantMap = await fetchVariantsForProducts(supabase, [variant.id]);
    setVariantsByProduct((current) => {
      const next = new Map(current);
      for (const [productId, rows] of variantMap) {
        next.set(productId, rows);
      }
      return next;
    });
  }

  return (
    <div className="mx-auto max-w-7xl space-y-8">
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

      {loading ? (
        <MasterGroupStatsSkeleton />
      ) : (
        <MasterGroupStatsRow
          criticalCount={criticalCount}
          lowCount={lowCount}
          okCount={okCount}
        />
      )}

      <div className="flex flex-col gap-3">
        <div className="relative max-w-sm">
          <Search
            size={15}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
            aria-hidden
          />
          <Input
            type="search"
            value={search}
            onChange={(event) => {
              setSearch(event.target.value);
              setCurrentPage(1);
            }}
            placeholder="Αναζήτηση..."
            className={cn("h-9 pl-9", premiumInputFocus)}
            aria-label="Αναζήτηση προϊόντων"
            disabled={loading}
          />
        </div>

        <div
          className="flex flex-wrap gap-2"
          role="tablist"
          aria-label="Φίλτρο κατηγορίας"
        >
          {["all", ...categories].map((category) => {
            const isActive = activeCategory === category;
            const count =
              category === "all"
                ? masterGroups.length
                : masterGroups.filter((group) => group.category === category).length;

            return (
              <button
                key={category}
                type="button"
                role="tab"
                aria-selected={isActive}
                onClick={() => {
                  setActiveCategory(category);
                  setCurrentPage(1);
                }}
                className={cn(
                  isActive
                    ? premiumFilterTabActiveCategory
                    : premiumFilterTabInactive,
                )}
              >
                {category === "all" ? `Όλα (${count})` : `${category} (${count})`}
              </button>
            );
          })}
        </div>
      </div>

      {error ? (
        <DataError message={error} onRetry={() => setFetchKey((key) => key + 1)} />
      ) : null}

      {loading ? (
        <MasterGroupGridSkeleton />
      ) : !error ? (
        <>
          {paginated.length === 0 ? (
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
                masterGroups.length === 0 && !hasActiveFilters
                  ? "Νέο Προϊόν"
                  : undefined
              }
              actionHref="/products/new"
              className="rounded-2xl border border-border bg-card py-12"
            />
          ) : (
            <div className={masterGroupGridClass}>
              {paginated.map((group) => {
                const key = resolveMasterGroupKey(group);
                return (
                  <ProductMasterGroupCard
                    key={key}
                    group={group}
                    isExpanded={expandedKey === key}
                    variantsByProduct={variantsByProduct}
                    onToggle={() =>
                      setExpandedKey(expandedKey === key ? null : key)
                    }
                    onVariantClick={(variantId) =>
                      router.push(`/products/${variantId}`)
                    }
                    onVariantEdit={(variantId, event) => {
                      event.stopPropagation();
                      router.push(`/products/${variantId}/edit`);
                    }}
                    onVariantCreated={(variant) =>
                      void handleVariantCreated(group, variant)
                    }
                  />
                );
              })}
            </div>
          )}

          {filtered.length > 0 ? (
            <PaginationControls
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={filtered.length}
              itemsPerPage={MASTER_GROUP_PAGE_SIZE}
              onPageChange={setCurrentPage}
              itemLabel="προϊόντα"
            />
          ) : null}
        </>
      ) : null}
    </div>
  );
}
