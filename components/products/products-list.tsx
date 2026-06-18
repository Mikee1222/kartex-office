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
import { CategoryBadge } from "@/components/products/category-badge";
import { ProductDeleteButton } from "@/components/products/product-delete-button";
import { ProductRowActions } from "@/components/products/product-row-actions";
import {
  PRODUCT_FILTER_TABS,
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
import {
  premiumFilterTabActive,
  premiumFilterTabInactive,
  premiumGoldButton,
  premiumInputFocus,
  premiumTableHead,
  premiumTableRow,
  premiumTableWrap,
} from "@/lib/ui/premium-styles";
import { cn } from "@/lib/utils";

function matchesSearch(product: Product, query: string) {
  const normalized = query.trim().toLowerCase();
  if (!normalized) return true;
  return (
    product.name.toLowerCase().includes(normalized) ||
    product.sku.toLowerCase().includes(normalized) ||
    product.barcode.toLowerCase().includes(normalized)
  );
}

function matchesTab(product: Product, tab: ProductFilterTab) {
  if (tab === "all") return true;
  if (tab === "low_stock") return product.stock < product.minStock;
  return product.category === tab;
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
  const inventoryValue = product.stock * product.purchasePrice;
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
      className="rounded-xl bg-muted/20 p-4"
      onClick={(event) => event.stopPropagation()}
    >
      <div className="grid gap-6 lg:grid-cols-3">
        <section className="space-y-3">
          {dimensionsLabel ? (
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Διαστάσεις
              </p>
              <p className="mt-1 text-sm text-kartex-navy">{dimensionsLabel}</p>
            </div>
          ) : null}
          {product.material || product.qualityGrade ? (
            <div className="flex flex-wrap gap-2">
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
          ) : null}
          {product.supplier?.trim() || product.supplierId || phone ? (
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Προμηθευτής
              </p>
              <p className="mt-1 text-sm text-kartex-navy">
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
          {product.description?.trim() ? (
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Περιγραφή
              </p>
              <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                {product.description.trim()}
              </p>
            </div>
          ) : null}
        </section>

        <section className="space-y-3">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Χρώματα
          </p>
          {activeVariants.length === 0 ? (
            <p className="text-sm text-muted-foreground">Δεν έχουν οριστεί ενεργά χρώματα.</p>
          ) : (
            <ul className="space-y-3">
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

        <section className="space-y-2.5">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Οικονομικά
          </p>
          <dl className="space-y-2 text-sm">
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
              <dt className="text-muted-foreground">Περιθώριο</dt>
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
            <div className="flex justify-between gap-4 border-t border-border/60 pt-2">
              <dt className="font-medium text-kartex-navy">Συνολική Αξία Αποθέματος</dt>
              <dd className="tabular-nums font-semibold text-kartex-navy">
                {formatCurrencyEl(inventoryValue)}
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

  const filtered = React.useMemo(() => {
    return products.filter(
      (product) => matchesTab(product, activeTab) && matchesSearch(product, search),
    );
  }, [products, search, activeTab]);

  const selectedInFiltered = React.useMemo(
    () => filtered.filter((product) => selectedIds.has(product.id)),
    [filtered, selectedIds],
  );

  const allFilteredSelected =
    filtered.length > 0 && selectedInFiltered.length === filtered.length;
  const someFilteredSelected =
    selectedInFiltered.length > 0 && selectedInFiltered.length < filtered.length;

  const headerCheckboxRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    if (headerCheckboxRef.current) {
      headerCheckboxRef.current.indeterminate = someFilteredSelected;
    }
  }, [someFilteredSelected]);

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

  function toggleAllFiltered(checked: boolean) {
    setSelectedIds((current) => {
      const next = new Set(current);
      for (const product of filtered) {
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
    const result = printProductBarcodes(
      selectedInFiltered.map((product) => ({
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
  }

  React.useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);
      const supabase = createClient();
      let query = supabase.from("products").select("*").order("name", { ascending: true });
      if (!showInactive) {
        query = query.eq("is_active", true);
      }
      const { data, error: fetchError } = await query;

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

      const mapped = (data as ProductRow[]).map(mapProductRow);
      setProducts(mapped);

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
  }, [fetchKey, showInactive]);

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
          {PRODUCT_FILTER_TABS.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={isActive}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  isActive ? premiumFilterTabActive : premiumFilterTabInactive,
                )}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        {selectedInFiltered.length > 0 ? (
          <div className="flex flex-wrap items-center gap-3 rounded-lg border border-kartex-gold/30 bg-kartex-gold/5 px-4 py-3">
            <span className="text-sm font-medium text-kartex-navy">
              {selectedInFiltered.length} επιλεγμένα
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
          <CardContent className="overflow-x-auto p-0">
            <table className="w-full min-w-[1040px] text-sm">
              <thead>
                <tr className={premiumTableHead}>
                  <th className="w-10 px-2 py-3">
                    <input
                      ref={headerCheckboxRef}
                      type="checkbox"
                      checked={allFilteredSelected}
                      onChange={(event) => toggleAllFiltered(event.target.checked)}
                      className="size-4 rounded border-border text-kartex-gold focus:ring-kartex-gold/40"
                      aria-label="Επιλογή όλων"
                      disabled={filtered.length === 0}
                    />
                  </th>
                  <th className="w-10 px-2 py-3" aria-label="Λεπτομέρειες" />
                  <th className="px-4 py-3 sm:px-6">Προϊόν</th>
                  <th className="px-4 py-3">Χρώματα</th>
                  <th className="px-4 py-3">Κατηγορία</th>
                  <th className="px-4 py-3">Συνολικό</th>
                  <th className="px-4 py-3">Δεσμευμένο</th>
                  <th className="px-4 py-3">Διαθέσιμο</th>
                  <th className="px-4 py-3">Τιμή Αγοράς (€)</th>
                  <th className="px-4 py-3">Τιμή Πώλησης (€)</th>
                  <th className="px-4 py-3">Barcode</th>
                  <th className="px-4 py-3 text-right sm:pr-6">Ενέργειες</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={12} className="p-0">
                      <EmptyState
                        icon={Box}
                        title={
                          products.length === 0
                            ? "Δεν υπάρχουν προϊόντα"
                            : "Δεν βρέθηκαν αποτελέσματα"
                        }
                        description={
                          products.length === 0
                            ? "Προσθέστε το πρώτο προϊόν στον κατάλογό σας."
                            : "Δοκιμάστε άλλο φίλτρο ή όρο αναζήτησης."
                        }
                        actionLabel={products.length === 0 ? "Νέο Προϊόν" : undefined}
                        actionHref="/products/new"
                        className="py-8"
                      />
                    </td>
                  </tr>
                ) : (
                  filtered.map((product) => {
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
                            "cursor-pointer",
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
                          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md border border-border bg-kartex-navy/5 text-kartex-gold">
                            <Box className="size-5" aria-hidden />
                          </span>
                          <div>
                            <p
                              className={cn(
                                "font-medium",
                                isInactive ? "text-muted-foreground" : "text-kartex-navy",
                              )}
                            >
                              {product.name}
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
                          <td className="px-4 py-3 tabular-nums font-medium">
                            <span className={isInactive ? "text-muted-foreground" : "text-kartex-navy"}>
                              {product.stock}
                            </span>
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
                            <td colSpan={12} className="p-0">
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
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
