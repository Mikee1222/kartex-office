"use client";

import {
  Barcode,
  Box,
  ChevronDown,
  ChevronRight,
  Pencil,
  Search,
} from "lucide-react";
import { useRouter } from "next/navigation";
import * as React from "react";
import { toast } from "sonner";

import { DataError } from "@/components/dashboard/data-error";
import { EmptyState } from "@/components/dashboard/empty-state";
import { CategoryBadge, getCategoryIconClass } from "@/components/products/category-badge";
import { ProductDeleteButton } from "@/components/products/product-delete-button";
import { ProductRowActions } from "@/components/products/product-row-actions";
import { StockStatusBadge } from "@/components/products/stock-status-badge";
import {
  getStockStatus,
  type Product,
  type ProductFilterTab,
  type StockStatus,
} from "@/components/products/types";
import { Button } from "@/components/ui/button";
import { usePermissionsOptional } from "@/lib/auth/permissions-context";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { ColorCircle, ColorCirclesRow } from "@/components/ui/color-picker";
import { fetchVariantsForProducts } from "@/lib/products/color-variants";
import { printProductBarcode, printProductBarcodes } from "@/lib/products/barcode-print";
import { formatDimensionsLabel } from "@/lib/products/form-utils";
import type { ProductColorVariant } from "@/lib/products/types";
import { calcMargin } from "@/lib/reports/compute-analytics";
import { fetchSuppliers } from "@/lib/settings/suppliers";
import { createClient } from "@/lib/supabase/client";
import {
  formatCurrencyEl,
  formatDateEl,
  mapProductRow,
  type ProductRow,
} from "@/types/database";
import { PageHeader } from "@/components/ui/page-header";
import { PaginationControls } from "@/components/ui/pagination-controls";
import {
  premiumFilterTabActiveCategory,
  premiumFilterTabInactive,
  premiumGoldButton,
  premiumInputFocus,
  premiumTableHeadSticky,
  premiumTableRow,
  premiumTableWrap,
} from "@/lib/ui/premium-styles";
import { cn } from "@/lib/utils";

const ITEMS_PER_PAGE = 25;

function escapeIlike(value: string) {
  return value.replace(/[%_\\,]/g, "\\$&");
}

function formatDimensionsOnly(product: Product): string | null {
  return formatDimensionsLabel({
    widthCm: product.widthCm,
    heightCm: product.heightCm,
    weightKg: product.weightKg,
    unit: product.unit,
  });
}

function productHasExpandableDetails(
  product: Product,
  variants: ProductColorVariant[],
): boolean {
  const activeVariants = variants.filter(
    (variant) => variant.isActive && variant.color,
  );
  return (
    formatDimensionsOnly(product) != null ||
    Boolean(product.description?.trim()) ||
    Boolean(product.supplier?.trim()) ||
    Boolean(product.supplierId) ||
    Boolean(product.material?.trim()) ||
    Boolean(product.qualityGrade?.trim()) ||
    activeVariants.length > 0
  );
}

const stockTextColor: Record<StockStatus, string> = {
  adequate: "text-emerald-700",
  low: "text-amber-700",
  critical: "text-red-700",
};

const stockBarColor: Record<StockStatus, string> = {
  adequate: "bg-emerald-500",
  low: "bg-amber-500",
  critical: "bg-red-500",
};

function marginBadgeClass(marginPct: number): string {
  if (marginPct > 30) return "bg-emerald-100 text-emerald-800";
  if (marginPct > 15) return "bg-amber-100 text-amber-900";
  return "bg-red-100 text-red-800";
}

type ProductExpandedPanelProps = {
  product: Product;
  variants: ProductColorVariant[];
  supplierPhone?: string | null;
  onChanged: () => void;
};

function ProductExpandedPanel({
  product,
  variants,
  supplierPhone,
  onChanged,
}: ProductExpandedPanelProps) {
  const router = useRouter();

  const dimensionsLabel = formatDimensionsOnly(product);
  const activeVariants = variants.filter(
    (variant) => variant.isActive && variant.color,
  );
  const maxVariantStock = Math.max(
    ...activeVariants.map((variant) => variant.stock),
    1,
  );
  const marginPct = calcMargin(product.purchasePrice, product.salePrice);
  const profitPerUnit = product.salePrice - product.purchasePrice;
  const supplierName = product.supplier?.trim() || "—";
  const phone = supplierPhone?.trim();

  function handlePrintBarcode() {
    const result = printProductBarcode({
      name: product.name,
      sku: product.sku,
      barcode: product.barcode,
    });
    if (!result.ok && result.error) {
      toast.error(result.error);
    }
  }

  return (
    <div
      className="rounded-xl border border-border/60 bg-gradient-to-br from-muted/30 to-background p-4"
      onClick={(event) => event.stopPropagation()}
    >
      <div className="mb-4 flex items-center gap-3">
        <span
          className={cn(
            "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border transition-colors duration-200",
            getCategoryIconClass(product.category),
          )}
        >
          <Box className="size-5" aria-hidden />
        </span>
        <div className="min-w-0">
          <p className="font-semibold text-kartex-navy">{product.cleanName || product.name}</p>
          <CategoryBadge category={product.category} className="mt-1" />
        </div>
      </div>
      <div className="grid gap-4 lg:grid-cols-3">
        <section className="rounded-xl border border-border/60 bg-white p-4 shadow-sm">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
            Περιγραφή
          </p>
          {product.description?.trim() ? (
            <p className="mt-2 text-sm leading-relaxed text-kartex-navy/80">
              {product.description.trim()}
            </p>
          ) : (
            <p className="mt-2 text-sm text-muted-foreground">—</p>
          )}
          {dimensionsLabel ? (
            <p className="mt-3 text-xs text-muted-foreground">
              <span className="font-medium text-kartex-navy">Διαστάσεις: </span>
              {dimensionsLabel}
            </p>
          ) : null}
          <div className="mt-3 flex flex-wrap gap-2">
            {product.gsm ? (
              <span className="inline-flex rounded-full bg-kartex-gold/10 px-2.5 py-1 text-xs font-semibold text-kartex-navy">
                {product.gsm} gsm
              </span>
            ) : null}
            {product.threadCount ? (
              <span className="inline-flex rounded-full bg-kartex-gold/10 px-2.5 py-1 text-xs font-semibold text-kartex-navy">
                T{product.threadCount}
              </span>
            ) : null}
            {product.color ? (
              <span className="inline-flex rounded-full bg-kartex-navy/5 px-2.5 py-1 text-xs font-medium text-kartex-navy">
                {product.color}
              </span>
            ) : null}
            {product.subcategory ? (
              <span className="inline-flex rounded-full border border-kartex-gold/30 px-2.5 py-1 text-xs font-medium text-kartex-gold">
                {product.subcategory}
              </span>
            ) : null}
          </div>
          {(product.material || product.qualityGrade) && (
            <div className="mt-3 flex flex-wrap gap-2">
              {product.material ? (
                <span className="inline-flex rounded-full bg-kartex-navy/5 px-2.5 py-1 text-xs font-medium text-kartex-navy">
                  {product.material}
                </span>
              ) : null}
              {product.qualityGrade ? (
                <span className="inline-flex rounded-full bg-kartex-gold/15 px-2.5 py-1 text-xs font-medium text-kartex-navy">
                  {product.qualityGrade}
                </span>
              ) : null}
            </div>
          )}
          {product.supplier?.trim() || product.supplierId || phone ? (
            <div className="mt-3 border-t border-border/50 pt-3">
              <p className="text-xs font-medium text-muted-foreground">Προμηθευτής</p>
              <p className="mt-0.5 text-sm text-kartex-navy">
                {product.supplier?.trim() || supplierName}
              </p>
              {phone ? (
                <a
                  href={`tel:${phone.replace(/\s/g, "")}`}
                  className="mt-0.5 inline-block text-sm text-kartex-gold hover:underline"
                >
                  {phone}
                </a>
              ) : null}
            </div>
          ) : null}
        </section>

        <section className="rounded-xl border border-border/60 bg-white p-4 shadow-sm">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
            Χρώματα
          </p>
          {activeVariants.length === 0 ? (
            <p className="mt-2 text-sm text-muted-foreground">
              Δεν έχουν οριστεί ενεργά χρώματα.
            </p>
          ) : (
            <ul className="mt-3 space-y-3">
              {activeVariants.map((variant) => {
                const color = variant.color!;
                const status = getStockStatus(variant.stock, product.minStock);
                const barPercent =
                  product.stock > 0
                    ? Math.round((variant.stock / product.stock) * 100)
                    : Math.round((variant.stock / maxVariantStock) * 100);

                return (
                  <li key={variant.id} className="space-y-1.5">
                    <div className="flex items-center gap-3">
                      <ColorCircle
                        color={{ name: color.name, hexCode: color.hexCode }}
                        size={32}
                        className="ring-1 ring-border"
                      />
                      <span className="min-w-0 flex-1 truncate text-sm font-medium text-kartex-navy">
                        {color.name}
                      </span>
                      <StockStatusBadge stock={variant.stock} minStock={product.minStock} />
                      <span
                        className={cn(
                          "tabular-nums text-sm font-semibold",
                          stockTextColor[status],
                        )}
                      >
                        {variant.stock}
                      </span>
                    </div>
                    <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                      <div
                        className={cn(
                          "h-full rounded-full transition-all duration-200",
                          stockBarColor[status],
                        )}
                        style={{ width: `${Math.min(barPercent, 100)}%` }}
                      />
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        <section className="rounded-xl border border-border/60 bg-white p-4 shadow-sm">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
            Οικονομικά
          </p>
          <dl className="mt-3 space-y-2.5 text-sm">
            <div className="flex justify-between gap-4">
              <dt className="text-muted-foreground">Κόστος</dt>
              <dd className="tabular-nums font-medium text-kartex-navy">
                {formatCurrencyEl(product.purchasePrice)}
              </dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-muted-foreground">Πώληση</dt>
              <dd className="tabular-nums font-medium text-kartex-navy">
                {formatCurrencyEl(product.salePrice)}
              </dd>
            </div>
            <div className="flex items-center justify-between gap-4">
              <dt className="text-muted-foreground">Περιθώριο %</dt>
              <dd>
                <span
                  className={cn(
                    "inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold tabular-nums",
                    marginBadgeClass(marginPct),
                  )}
                >
                  {marginPct.toFixed(1)}%
                </span>
              </dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-muted-foreground">Κέρδος/τεμ</dt>
              <dd className="tabular-nums font-medium text-kartex-navy">
                {formatCurrencyEl(profitPerUnit)}
              </dd>
            </div>
          </dl>
        </section>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-3 border-t border-border/60 pt-4">
        <span className="rounded-md bg-background px-2.5 py-1 font-mono text-xs text-kartex-navy ring-1 ring-border">
          SKU {product.sku}
        </span>
        <span className="rounded-md bg-background px-2.5 py-1 font-mono text-xs text-muted-foreground ring-1 ring-border">
          {product.barcode}
        </span>
        {product.createdAt ? (
          <span className="text-xs text-muted-foreground">
            Δημιουργία: {formatDateEl(product.createdAt)}
          </span>
        ) : null}
        <div className="ml-auto flex flex-wrap items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-8 border-kartex-gold/30 text-kartex-navy hover:bg-kartex-gold/10"
            onClick={() => router.push(`/products/${product.id}/edit`)}
          >
            <Pencil className="size-3.5" />
            Επεξεργασία
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-8"
            onClick={handlePrintBarcode}
          >
            <Barcode className="size-3.5" />
            Εκτύπωση Barcode
          </Button>
          <ProductDeleteButton
            product={product}
            variant="outline"
            onChanged={onChanged}
          />
        </div>
      </div>
    </div>
  );
}

function ProductsTableSkeleton() {
  return (
    <div className={cn(premiumTableWrap, "space-y-3 p-4 sm:p-6")}>
      {Array.from({ length: 6 }).map((_, index) => (
        <Skeleton key={index} className="h-12 w-full" />
      ))}
    </div>
  );
}

export function ProductsList() {
  const router = useRouter();
  const permissions = usePermissionsOptional();
  const canManageProducts = permissions?.can("canDeleteProducts") ?? false;
  const [search, setSearch] = React.useState("");
  const [activeTab, setActiveTab] = React.useState<ProductFilterTab>("all");
  const [showInactive, setShowInactive] = React.useState(false);
  const [currentPage, setCurrentPage] = React.useState(1);
  const [totalCount, setTotalCount] = React.useState(0);
  const [products, setProducts] = React.useState<Product[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [fetchKey, setFetchKey] = React.useState(0);
  const [variantsByProduct, setVariantsByProduct] = React.useState<
    Map<string, ProductColorVariant[]>
  >(new Map());
  const [supplierPhonesById, setSupplierPhonesById] = React.useState<
    Map<string, string | null>
  >(new Map());
  const [expandedProductId, setExpandedProductId] = React.useState<string | null>(
    null,
  );
  const [selectedIds, setSelectedIds] = React.useState<Set<string>>(() => new Set());
  const [categories, setCategories] = React.useState<string[]>([]);

  const filterTabs = React.useMemo(() => {
    const tabs: { id: ProductFilterTab; label: string }[] = [
      { id: "all", label: "Όλα" },
      ...categories.map((category) => ({ id: category, label: category })),
      { id: "low_stock", label: "Χαμηλό Απόθεμα" },
    ];
    return tabs;
  }, [categories]);

  const totalPages = Math.max(1, Math.ceil(totalCount / ITEMS_PER_PAGE));
  const hasActiveFilters =
    search.trim().length > 0 || activeTab !== "all" || showInactive;

  const selectedOnPage = React.useMemo(
    () => products.filter((product) => selectedIds.has(product.id)),
    [products, selectedIds],
  );

  const allPageSelected =
    products.length > 0 && selectedOnPage.length === products.length;
  const somePageSelected =
    selectedOnPage.length > 0 && selectedOnPage.length < products.length;

  React.useEffect(() => {
    setCurrentPage(1);
  }, [search, activeTab, showInactive]);

  const headerCheckboxRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    if (headerCheckboxRef.current) {
      headerCheckboxRef.current.indeterminate = somePageSelected;
    }
  }, [somePageSelected]);

  function toggleProductSelection(productId: string, checked: boolean) {
    setSelectedIds((current) => {
      const next = new Set(current);
      if (checked) {
        next.add(productId);
      } else {
        next.delete(productId);
      }
      return next;
    });
  }

  function toggleAllOnPage(checked: boolean) {
    setSelectedIds((current) => {
      const next = new Set(current);
      for (const product of products) {
        if (checked) {
          next.add(product.id);
        } else {
          next.delete(product.id);
        }
      }
      return next;
    });
  }

  function handleBulkPrintBarcodes() {
    void (async () => {
      const supabase = createClient();
      const { data, error: fetchError } = await supabase
        .from("products")
        .select("name, sku, barcode")
        .in("id", Array.from(selectedIds));

      if (fetchError) {
        toast.error(fetchError.message || "Αποτυχία φόρτωσης επιλεγμένων προϊόντων.");
        return;
      }

      const result = printProductBarcodes(
        (data ?? []).map((product) => ({
          name: product.name,
          sku: product.sku,
          barcode: product.barcode,
        })),
      );

      if (!result.ok && result.error) {
        toast.error(result.error);
        return;
      }

      if (result.skipped?.length) {
        toast.success(
          `Εκτυπώθηκαν ${result.printedCount} barcode(s). Παραλείφθηκαν: ${result.skipped.join(", ")}`,
        );
      }
    })();
  }

  React.useEffect(() => {
    let cancelled = false;

    async function loadCategories() {
      const supabase = createClient();
      const { data, error: catError } = await supabase
        .from("products")
        .select("category")
        .order("category", { ascending: true });

      if (cancelled || catError) return;

      const unique = [
        ...new Set(
          (data ?? [])
            .map((row) => row.category as string)
            .filter((category) => category?.trim()),
        ),
      ].sort((a, b) => a.localeCompare(b, "el"));
      setCategories(unique);
    }

    void loadCategories();
    return () => {
      cancelled = true;
    };
  }, [fetchKey]);

  React.useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);
      const supabase = createClient();
      const from = (currentPage - 1) * ITEMS_PER_PAGE;
      const to = from + ITEMS_PER_PAGE - 1;

      let query = supabase
        .from("products")
        .select("*", { count: "exact" })
        .order("name", { ascending: true });
      if (!showInactive) {
        query = query.eq("is_active", true);
      }
      if (activeTab !== "all" && activeTab !== "low_stock") {
        query = query.eq("category", activeTab);
      }
      if (activeTab === "low_stock") {
        query = query.filter("stock", "lt", "min_stock");
      }
      const trimmedSearch = search.trim();
      if (trimmedSearch) {
        const pattern = `%${escapeIlike(trimmedSearch)}%`;
        query = query.or(
          `name.ilike.${pattern},sku.ilike.${pattern},barcode.ilike.${pattern}`,
        );
      }
      const { data, error: fetchError, count } = await query.range(from, to);

      if (cancelled) return;

      if (fetchError) {
        setError(
          fetchError.message ||
            "Αποτυχία φόρτωσης προϊόντων. Ελέγξτε τη σύνδεση και τα δικαιώματα πρόσβασης.",
        );
        setProducts([]);
        setTotalCount(0);
        setLoading(false);
        return;
      }

      const mapped = (data as ProductRow[]).map(mapProductRow);
      setProducts(mapped);
      setTotalCount(count ?? 0);

      const [variantMap, suppliersResult] = await Promise.all([
        fetchVariantsForProducts(
          supabase,
          mapped.map((product) => product.id),
        ),
        fetchSuppliers(supabase),
      ]);
      if (!cancelled) {
        setVariantsByProduct(variantMap);
        setSupplierPhonesById(
          new Map(
            suppliersResult.items.map((supplier) => [supplier.id, supplier.phone]),
          ),
        );
      }
      setLoading(false);
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [fetchKey, showInactive, search, activeTab, currentPage]);

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <PageHeader
        title="Προϊόντα"
        subtitle="Διαχείριση καταλόγου και επιπέδων αποθέματος."
        action={
          <Button
            type="button"
            className={premiumGoldButton}
            onClick={() => router.push("/products/new")}
          >
            Νέο Προϊόν
          </Button>
        }
      />

      <div className="flex flex-col gap-4">
        <div className="relative max-w-md">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden
          />
          <Input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Αναζήτηση ονόματος, SKU, barcode…"
            className={cn("pl-9", premiumInputFocus)}
            aria-label="Αναζήτηση προϊόντων"
            disabled={loading}
          />
        </div>

        {canManageProducts ? (
          <label className="flex w-fit cursor-pointer items-center gap-2 text-sm text-muted-foreground">
            <input
              type="checkbox"
              checked={showInactive}
              onChange={(event) => setShowInactive(event.target.checked)}
              className="size-4 rounded border-border text-kartex-gold focus:ring-kartex-gold/40"
            />
            Εμφάνιση ανενεργών προϊόντων
          </label>
        ) : null}

        <div
          className="flex flex-wrap gap-2"
          role="tablist"
          aria-label="Φίλτρο κατηγορίας"
        >
          {filterTabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={isActive}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  isActive ? premiumFilterTabActiveCategory : premiumFilterTabInactive,
                )}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        {selectedIds.size > 0 ? (
          <div className="flex flex-wrap items-center gap-3 rounded-lg border border-kartex-gold/30 bg-kartex-gold/5 px-4 py-3">
            <span className="text-sm font-medium text-kartex-navy">
              {selectedIds.size} επιλεγμένα
            </span>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="border-kartex-gold/40 text-kartex-navy hover:bg-kartex-gold/10"
              onClick={handleBulkPrintBarcodes}
            >
              <Barcode className="size-4" />
              Εκτύπωση Barcodes
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="text-muted-foreground"
              onClick={() => setSelectedIds(new Set())}
            >
              Αποεπιλογή
            </Button>
          </div>
        ) : null}
      </div>

      {error ? (
        <DataError message={error} onRetry={() => setFetchKey((k) => k + 1)} />
      ) : null}

      {loading ? <ProductsTableSkeleton /> : null}

      {!loading && !error ? (
        <Card className={premiumTableWrap}>
          <CardContent className="max-h-[70vh] overflow-x-auto overflow-y-auto p-0">
            <table className="w-full min-w-[1100px] text-sm">
              <thead className="sticky top-0 z-10">
                <tr className={premiumTableHeadSticky}>
                  <th className="w-10 px-2 py-3">
                    <input
                      ref={headerCheckboxRef}
                      type="checkbox"
                      checked={allPageSelected}
                      onChange={(event) => toggleAllOnPage(event.target.checked)}
                      className="size-4 rounded border-border text-kartex-gold focus:ring-kartex-gold/40"
                      aria-label="Επιλογή όλων στη σελίδα"
                      disabled={products.length === 0 || loading}
                    />
                  </th>
                  <th className="w-10 px-2 py-3" aria-label="Λεπτομέρειες" />
                  <th className="px-4 py-3 sm:px-6">Προϊόν</th>
                  <th className="px-4 py-3">Χρώματα</th>
                  <th className="px-4 py-3">Κατηγορία</th>
                  <th className="px-4 py-3">Συνολικό</th>
                  <th className="px-4 py-3">Κατάσταση</th>
                  <th className="px-4 py-3">Δεσμευμένο</th>
                  <th className="px-4 py-3">Διαθέσιμο</th>
                  <th className="px-4 py-3">Τιμή Αγοράς (€)</th>
                  <th className="px-4 py-3">Τιμή Πώλησης (€)</th>
                  <th className="px-4 py-3">Barcode</th>
                  <th className="px-4 py-3 text-right sm:pr-6">Ενέργειες</th>
                </tr>
              </thead>
              <tbody>
                {products.length === 0 ? (
                  <tr>
                    <td colSpan={13} className="p-0">
                      <EmptyState
                        icon={Box}
                        title={
                          totalCount === 0 && !hasActiveFilters
                            ? "Δεν υπάρχουν προϊόντα"
                            : "Δεν βρέθηκαν αποτελέσματα"
                        }
                        description={
                          totalCount === 0 && !hasActiveFilters
                            ? "Προσθέστε το πρώτο προϊόν στον κατάλογό σας."
                            : "Δοκιμάστε άλλο φίλτρο ή όρο αναζήτησης."
                        }
                        actionLabel={
                          totalCount === 0 && !hasActiveFilters ? "Νέο Προϊόν" : undefined
                        }
                        actionHref="/products/new"
                        className="py-8"
                      />
                    </td>
                  </tr>
                ) : (
                  products.map((product) => {
                    const variants = variantsByProduct.get(product.id) ?? [];
                    const colorSummaries = variants
                      .filter((variant) => variant.color)
                      .map((variant) => ({
                        id: variant.colorId,
                        name: variant.color!.name,
                        hexCode: variant.color!.hexCode,
                        isPrimary: variant.isPrimary,
                      }))
                      .sort((a, b) => {
                        if (a.isPrimary) return -1;
                        if (b.isPrimary) return 1;
                        return 0;
                      });
                    const canExpand = productHasExpandableDetails(product, variants);
                    const isExpanded = expandedProductId === product.id;
                    const isInactive = product.isActive === false;
                    const supplierPhone = product.supplierId
                      ? supplierPhonesById.get(product.supplierId)
                      : null;

                    return (
                      <React.Fragment key={product.id}>
                        <tr
                          className={cn(
                            premiumTableRow,
                            "cursor-pointer transition-all duration-200 hover:shadow-sm",
                            isInactive && "bg-muted/30 text-muted-foreground",
                          )}
                          onClick={() => router.push(`/products/${product.id}`)}
                        >
                          <td
                            className="px-2 py-3"
                            onClick={(event) => event.stopPropagation()}
                          >
                            <input
                              type="checkbox"
                              checked={selectedIds.has(product.id)}
                              onChange={(event) =>
                                toggleProductSelection(product.id, event.target.checked)
                              }
                              className="size-4 rounded border-border text-kartex-gold focus:ring-kartex-gold/40"
                              aria-label={`Επιλογή ${product.name}`}
                            />
                          </td>
                          <td
                            className="px-2 py-3"
                            onClick={(event) => event.stopPropagation()}
                          >
                            {canExpand ? (
                              <button
                                type="button"
                                className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-kartex-navy"
                                aria-expanded={isExpanded}
                                aria-label={
                                  isExpanded
                                    ? "Απόκρυψη λεπτομερειών"
                                    : "Εμφάνιση λεπτομερειών"
                                }
                                onClick={() =>
                                  setExpandedProductId((current) =>
                                    current === product.id ? null : product.id,
                                  )
                                }
                              >
                                {isExpanded ? (
                                  <ChevronDown className="size-4" />
                                ) : (
                                  <ChevronRight className="size-4" />
                                )}
                              </button>
                            ) : null}
                          </td>
                          <td className="px-4 py-3 sm:px-6">
                            <div className="flex items-center gap-3">
                              <span
                                className={cn(
                                  "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border transition-colors duration-200",
                                  getCategoryIconClass(product.category),
                                )}
                              >
                                <Box className="size-5" aria-hidden />
                              </span>
                          <div>
                            <p
                              className={cn(
                                "font-medium",
                                isInactive ? "text-muted-foreground" : "text-kartex-navy",
                              )}
                            >
                              {product.cleanName || product.name}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {product.sku}
                            </p>
                          </div>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <ColorCirclesRow colors={colorSummaries} />
                          </td>
                          <td className="px-4 py-3">
                            <CategoryBadge category={product.category} />
                          </td>
                          <td className="px-4 py-3 tabular-nums font-semibold">
                            <span className={isInactive ? "text-muted-foreground" : "text-kartex-navy"}>
                              {product.stock}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <StockStatusBadge
                              stock={product.stock}
                              minStock={product.minStock}
                            />
                          </td>
                          <td className="px-4 py-3">
                            <span className="inline-flex rounded-full bg-orange-50 px-2.5 py-1 text-xs font-semibold text-orange-700">
                              {product.reservedStock}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <span className="inline-flex rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                              {product.availableStock}
                            </span>
                          </td>
                          <td className="px-4 py-3 tabular-nums">
                            {formatCurrencyEl(product.purchasePrice)}
                          </td>
                          <td className="px-4 py-3 font-medium tabular-nums">
                            {formatCurrencyEl(product.salePrice)}
                          </td>
                          <td className="px-4 py-3 font-mono text-xs text-muted-foreground">
                            {product.barcode}
                          </td>
                          <td
                            className="px-4 py-3 sm:pr-6"
                            onClick={(event) => event.stopPropagation()}
                          >
                            <ProductRowActions
                              product={product}
                              onChanged={() => setFetchKey((k) => k + 1)}
                            />
                          </td>
                        </tr>
                        {canExpand ? (
                          <tr className="border-b border-border/60">
                            <td colSpan={13} className="p-0">
                              <div
                                className={cn(
                                  "grid transition-[grid-template-rows,opacity] duration-200 ease-in-out",
                                  isExpanded
                                    ? "grid-rows-[1fr] opacity-100"
                                    : "grid-rows-[0fr] opacity-0",
                                )}
                              >
                                <div className="overflow-hidden">
                                  <div className="px-4 pb-4 pt-1 sm:px-6">
                                    <ProductExpandedPanel
                                      product={product}
                                      variants={variants}
                                      supplierPhone={supplierPhone}
                                      onChanged={() => setFetchKey((k) => k + 1)}
                                    />
                                  </div>
                                </div>
                              </div>
                            </td>
                          </tr>
                        ) : null}
                      </React.Fragment>
                    );
                  })
                )}
              </tbody>
            </table>
            {!loading && totalCount > 0 ? (
              <PaginationControls
                currentPage={currentPage}
                totalPages={totalPages}
                totalItems={totalCount}
                itemsPerPage={ITEMS_PER_PAGE}
                onPageChange={setCurrentPage}
                itemLabel="προϊόντα"
              />
            ) : null}
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
