"use client";

import {
  ChevronDown,
  ChevronRight,
  Package,
  Search,
  TriangleAlert,
  Wallet,
} from "lucide-react";
import Link from "next/link";
import * as React from "react";
import { toast } from "sonner";

import { DataError } from "@/components/dashboard/data-error";
import { EmptyState } from "@/components/dashboard/empty-state";
import { ADJUSTMENT_REASONS } from "@/lib/inventory/adjustment-reasons";
import { StockBar } from "@/components/products/stock-bar";
import { StockStatusBadge } from "@/components/products/stock-status-badge";
import { getStockStatus, type Product } from "@/components/products/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { ColorCircle } from "@/components/ui/color-picker";
import { logInventoryMovement } from "@/lib/inventory/log-movement";
import {
  fetchVariantsForProducts,
  updateVariantStock,
} from "@/lib/products/color-variants";
import type { ProductColorVariant } from "@/lib/products/types";
import { createClient } from "@/lib/supabase/client";
import {
  formatCurrencyEl,
  formatDateEl,
  mapProductRow,
  type ProductRow,
} from "@/types/database";
import { premiumSelect } from "@/lib/ui/form-styles";
import {
  premiumFilterTabActive,
  premiumFilterTabActiveCategory,
  premiumFilterTabInactive,
  premiumGoldButton,
  premiumInputFocus,
  premiumLabel,
  premiumStatCard,
  premiumTableHeadSticky,
  premiumTableRow,
  premiumTableWrap,
} from "@/lib/ui/premium-styles";
import { PageHeader } from "@/components/ui/page-header";
import { PaginationControls } from "@/components/ui/pagination-controls";
import { cn } from "@/lib/utils";

type InventoryTab = "levels" | "movements" | "adjustments";

const ITEMS_PER_PAGE = 25;

function escapeIlike(value: string) {
  return value.replace(/[%_\\,]/g, "\\$&");
}

const textareaClassName =
  "flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2";

const TABS: { id: InventoryTab; label: string }[] = [
  { id: "levels", label: "Επίπεδα Αποθέματος" },
  { id: "movements", label: "Κινήσεις" },
  { id: "adjustments", label: "Προσαρμογές" },
];

const MOVEMENT_TYPE_LABELS: Record<string, string> = {
  in: "Εισαγωγή",
  out: "Εξαγωγή",
  adjustment: "Προσαρμογή",
};

type InventoryMovementRow = {
  id: string;
  type: string;
  quantity: number;
  reason: string | null;
  created_at: string;
  order_id: string | null;
  products:
    | { name: string; clean_name?: string | null }
    | { name: string; clean_name?: string | null }[]
    | null;
  orders: { order_number: string } | { order_number: string }[] | null;
};

type InventorySummary = {
  totalProducts: number;
  criticalCount: number;
  totalValue: number;
};

function pickJoinName<T extends { name?: string; order_number?: string }>(
  value: T | T[] | null | undefined,
  field: "name" | "order_number",
): string {
  if (!value) return "—";
  const row = Array.isArray(value) ? value[0] : value;
  if (!row) return "—";
  const v = row[field];
  return v?.trim() || "—";
}

function getProductDisplayName(products: InventoryMovementRow["products"]): string {
  if (!products) return "—";
  const p = Array.isArray(products) ? products[0] : products;
  return p?.clean_name || p?.name || "—";
}

function LevelsSummarySkeleton() {
  return (
    <div className="grid gap-4 sm:grid-cols-3">
      {Array.from({ length: 3 }).map((_, index) => (
        <Skeleton key={index} className="h-28 rounded-2xl" />
      ))}
    </div>
  );
}

function LevelsTableSkeleton() {
  return (
    <Card className={premiumTableWrap}>
      <CardContent className="space-y-3 p-4 sm:p-6">
        {Array.from({ length: 6 }).map((_, index) => (
          <Skeleton key={index} className="h-14 w-full rounded-lg" />
        ))}
      </CardContent>
    </Card>
  );
}

export function InventoryPage() {
  const [activeTab, setActiveTab] = React.useState<InventoryTab>("levels");
  const [products, setProducts] = React.useState<Product[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [fetchKey, setFetchKey] = React.useState(0);
  const [levelsSearch, setLevelsSearch] = React.useState("");
  const [categoryFilter, setCategoryFilter] = React.useState<string>("all");
  const [categories, setCategories] = React.useState<string[]>([]);
  const [summary, setSummary] = React.useState<InventorySummary>({
    totalProducts: 0,
    criticalCount: 0,
    totalValue: 0,
  });
  const [summaryLoading, setSummaryLoading] = React.useState(true);
  const [currentPage, setCurrentPage] = React.useState(1);
  const [totalCount, setTotalCount] = React.useState(0);
  const [adjustmentProducts, setAdjustmentProducts] = React.useState<Product[]>([]);
  const [adjustmentProductsLoading, setAdjustmentProductsLoading] = React.useState(false);
  const [movements, setMovements] = React.useState<InventoryMovementRow[]>([]);
  const [movementsLoading, setMovementsLoading] = React.useState(false);
  const [movementsError, setMovementsError] = React.useState<string | null>(null);
  const [movementsFetchKey, setMovementsFetchKey] = React.useState(0);

  const [adjustProductId, setAdjustProductId] = React.useState("");
  const [adjustQuantity, setAdjustQuantity] = React.useState("");
  const [adjustReason, setAdjustReason] = React.useState<string>(
    ADJUSTMENT_REASONS[0],
  );
  const [adjustNotes, setAdjustNotes] = React.useState("");
  const [productSearch, setProductSearch] = React.useState("");
  const [adjustSaving, setAdjustSaving] = React.useState(false);
  const [adjustMessage, setAdjustMessage] = React.useState<string | null>(
    null,
  );
  const [variantsByProduct, setVariantsByProduct] = React.useState<
    Map<string, ProductColorVariant[]>
  >(new Map());
  const [expandedProductId, setExpandedProductId] = React.useState<string | null>(
    null,
  );
  const [variantAdjustId, setVariantAdjustId] = React.useState<string | null>(
    null,
  );
  const [variantAdjustQty, setVariantAdjustQty] = React.useState("");
  const [variantSaving, setVariantSaving] = React.useState(false);

  const totalPages = Math.max(1, Math.ceil(totalCount / ITEMS_PER_PAGE));
  const maxPageStock = React.useMemo(
    () => Math.max(...products.map((product) => product.stock), 1),
    [products],
  );

  const categoryTabs = React.useMemo(
    () => [
      { id: "all", label: "Όλα" },
      ...categories.map((category) => ({ id: category, label: category })),
    ],
    [categories],
  );

  const hasActiveFilters =
    levelsSearch.trim().length > 0 || categoryFilter !== "all";

  React.useEffect(() => {
    setCurrentPage(1);
  }, [levelsSearch, categoryFilter]);

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
    if (activeTab !== "levels") return;

    let cancelled = false;

    async function loadSummary() {
      setSummaryLoading(true);
      const supabase = createClient();
      let query = supabase
        .from("products")
        .select("stock, min_stock, purchase_price", { count: "exact" });

      if (categoryFilter !== "all") {
        query = query.eq("category", categoryFilter);
      }
      const trimmedSearch = levelsSearch.trim();
      if (trimmedSearch) {
        const pattern = `%${escapeIlike(trimmedSearch)}%`;
        query = query.or(`name.ilike.${pattern},sku.ilike.${pattern}`);
      }

      const { data, count, error: summaryError } = await query;

      if (cancelled) return;

      if (summaryError || !data) {
        setSummary({ totalProducts: 0, criticalCount: 0, totalValue: 0 });
        setSummaryLoading(false);
        return;
      }

      let criticalCount = 0;
      let totalValue = 0;
      for (const row of data) {
        const stock = Number(row.stock) || 0;
        const minStock = Number(row.min_stock) || 0;
        const purchasePrice = Number(row.purchase_price) || 0;
        if (getStockStatus(stock, minStock) === "critical") {
          criticalCount += 1;
        }
        totalValue += stock * purchasePrice;
      }

      setSummary({
        totalProducts: count ?? data.length,
        criticalCount,
        totalValue,
      });
      setSummaryLoading(false);
    }

    void loadSummary();
    return () => {
      cancelled = true;
    };
  }, [activeTab, fetchKey, categoryFilter, levelsSearch]);

  React.useEffect(() => {
    if (activeTab !== "levels") return;

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

      if (categoryFilter !== "all") {
        query = query.eq("category", categoryFilter);
      }

      const trimmedLevelsSearch = levelsSearch.trim();
      if (trimmedLevelsSearch) {
        const pattern = `%${escapeIlike(trimmedLevelsSearch)}%`;
        query = query.or(`name.ilike.${pattern},sku.ilike.${pattern}`);
      }

      const { data, error: fetchError, count } = await query.range(from, to);

      if (cancelled) return;

      if (fetchError) {
        setError(
          fetchError.message ||
            "Αποτυχία φόρτωσης αποθέματος. Ελέγξτε τη σύνδεση.",
        );
        setProducts([]);
        setTotalCount(0);
        setLoading(false);
        return;
      }

      const mapped = (data as ProductRow[]).map(mapProductRow);
      setProducts(mapped);
      setTotalCount(count ?? 0);

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
  }, [activeTab, fetchKey, levelsSearch, categoryFilter, currentPage]);

  React.useEffect(() => {
    if (activeTab !== "adjustments") return;

    let cancelled = false;

    async function loadAdjustmentProducts() {
      setAdjustmentProductsLoading(true);
      const supabase = createClient();
      let query = supabase
        .from("products")
        .select("*")
        .order("name", { ascending: true })
        .limit(100);
      const trimmedProductSearch = productSearch.trim();
      if (trimmedProductSearch) {
        const pattern = `%${escapeIlike(trimmedProductSearch)}%`;
        query = query.or(`name.ilike.${pattern},sku.ilike.${pattern}`);
      }
      const { data, error: fetchError } = await query;

      if (cancelled) return;

      if (fetchError) {
        setAdjustmentProducts([]);
      } else {
        setAdjustmentProducts((data as ProductRow[]).map(mapProductRow));
      }
      setAdjustmentProductsLoading(false);
    }

    void loadAdjustmentProducts();
    return () => {
      cancelled = true;
    };
  }, [activeTab, productSearch, fetchKey]);

  async function handleSaveVariantStock(
    variant: ProductColorVariant,
    productId: string,
  ) {
    const stock = Math.max(0, Math.round(Number.parseInt(variantAdjustQty, 10) || 0));
    setVariantSaving(true);
    const supabase = createClient();
    const { error: updateError } = await updateVariantStock(
      supabase,
      variant.id,
      productId,
      stock,
    );
    setVariantSaving(false);

    if (updateError) {
      toast.error(updateError);
      return;
    }

    setVariantAdjustId(null);
    setVariantAdjustQty("");
    setFetchKey((key) => key + 1);
  }

  React.useEffect(() => {
    if (activeTab !== "movements") return;

    let cancelled = false;

    async function loadMovements() {
      setMovementsLoading(true);
      setMovementsError(null);
      const supabase = createClient();
      const { data, error: fetchError } = await supabase
        .from("inventory_movements")
        .select(
          `
          id, type, quantity, reason, created_at, order_id,
          products!inner(name, clean_name),
          orders(order_number)
        `,
        )
        .order("created_at", { ascending: false })
        .limit(100);

      if (cancelled) return;

      if (fetchError) {
        setMovementsError(fetchError.message);
        setMovements([]);
      } else {
        setMovements((data ?? []) as InventoryMovementRow[]);
      }
      setMovementsLoading(false);
    }

    void loadMovements();
    return () => {
      cancelled = true;
    };
  }, [activeTab, movementsFetchKey]);

  const filteredProducts = adjustmentProducts;

  function openAdjustmentForProduct(productId: string) {
    setAdjustProductId(productId);
    setAdjustQuantity("");
    setAdjustNotes("");
    setAdjustMessage(null);
    setActiveTab("adjustments");
  }

  async function handleSaveAdjustment(event: React.FormEvent) {
    event.preventDefault();
    setAdjustMessage(null);

    if (!adjustProductId) {
      setAdjustMessage("Επιλέξτε προϊόν.");
      return;
    }

    const delta = Number.parseInt(adjustQuantity, 10);
    if (!Number.isFinite(delta) || delta === 0) {
      setAdjustMessage("Εισάγετε έγκυρη ποσότητα (+ ή −).");
      return;
    }

    const product =
      adjustmentProducts.find((p) => p.id === adjustProductId) ??
      products.find((p) => p.id === adjustProductId);
    if (!product) {
      setAdjustMessage("Το προϊόν δεν βρέθηκε.");
      return;
    }

    const newStock = product.stock + delta;
    if (newStock < 0) {
      setAdjustMessage("Το απόθεμα δεν μπορεί να γίνει αρνητικό.");
      return;
    }

    setAdjustSaving(true);
    const supabase = createClient();
    const updatePayload = { stock: newStock };

    const { error: updateError } = await supabase
      .from("products")
      .update(updatePayload)
      .eq("id", adjustProductId)
      .select()
      .single();

    if (updateError) {
      console.error(updateError);
      setAdjustMessage(updateError.message || "Αποτυχία αποθήκευσης.");
      setAdjustSaving(false);
      return;
    }

    const reasonText = [adjustReason, adjustNotes.trim()]
      .filter(Boolean)
      .join(" — ");

    const { error: movementError } = await logInventoryMovement(supabase, {
      product_id: adjustProductId,
      type: "adjustment",
      quantity: Math.abs(delta),
      reason: reasonText || "Χειροκίνητη προσαρμογή",
    });

    if (movementError) {
      console.error("inventory_movement insert failed:", movementError);
    }

    setAdjustQuantity("");
    setAdjustNotes("");
    setAdjustMessage("Η προσαρμογή αποθηκεύτηκε επιτυχώς.");
    setMovementsFetchKey((k) => k + 1);
    setFetchKey((k) => k + 1);
    setAdjustSaving(false);
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <PageHeader
        title="Αποθήκη"
        subtitle="Επίπεδα αποθέματος, κινήσεις και χειροκίνητες προσαρμογές."
      />

      <div
        className="flex flex-wrap gap-2 border-b border-border pb-2"
        role="tablist"
        aria-label="Ενότητες αποθήκης"
      >
        {TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={activeTab === tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              activeTab === tab.id
                ? premiumFilterTabActive
                : premiumFilterTabInactive,
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {error ? (
        <DataError message={error} onRetry={() => setFetchKey((k) => k + 1)} />
      ) : null}

      {activeTab === "levels" ? (
        <>
          {summaryLoading ? (
            <LevelsSummarySkeleton />
          ) : (
            <div className="grid gap-4 sm:grid-cols-3">
              <div className={cn(premiumStatCard, "p-5")}>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Package className="size-4 text-kartex-gold" />
                  <p className={premiumLabel}>Συνολικά Προϊόντα</p>
                </div>
                <p className="mt-2 text-3xl font-bold tabular-nums text-kartex-navy">
                  {summary.totalProducts}
                </p>
              </div>
              <div className={cn(premiumStatCard, "p-5")}>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <TriangleAlert className="size-4 text-red-500" />
                  <p className={premiumLabel}>Κρίσιμο Απόθεμα</p>
                </div>
                <p className="mt-2 text-3xl font-bold tabular-nums text-red-700">
                  {summary.criticalCount}
                </p>
              </div>
              <div className={cn(premiumStatCard, "p-5")}>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Wallet className="size-4 text-kartex-gold" />
                  <p className={premiumLabel}>Συνολική Αξία</p>
                </div>
                <p className="mt-2 text-2xl font-bold tabular-nums text-kartex-navy">
                  {formatCurrencyEl(summary.totalValue)}
                </p>
              </div>
            </div>
          )}

          <div className="flex flex-col gap-4">
            <div className="relative max-w-md">
              <Search
                className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
                aria-hidden
              />
              <Input
                type="search"
                value={levelsSearch}
                onChange={(event) => setLevelsSearch(event.target.value)}
                placeholder="Αναζήτηση ονόματος ή SKU…"
                className={cn("pl-9", premiumInputFocus)}
                aria-label="Αναζήτηση αποθέματος"
                disabled={loading}
              />
            </div>

            <div
              className="flex flex-wrap gap-2"
              role="tablist"
              aria-label="Φίλτρο κατηγορίας"
            >
              {categoryTabs.map((tab) => {
                const isActive = categoryFilter === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    role="tab"
                    aria-selected={isActive}
                    onClick={() => setCategoryFilter(tab.id)}
                    className={cn(
                      isActive
                        ? premiumFilterTabActiveCategory
                        : premiumFilterTabInactive,
                    )}
                  >
                    {tab.label}
                  </button>
                );
              })}
            </div>
          </div>

          {loading ? (
            <LevelsTableSkeleton />
          ) : !error ? (
            <Card className={premiumTableWrap}>
              <CardContent className="max-h-[70vh] overflow-x-auto overflow-y-auto p-0">
                <table className="w-full min-w-[880px] text-sm">
                  <thead className="sticky top-0 z-10">
                    <tr className={premiumTableHeadSticky}>
                      <th className="w-10 px-2 py-3" aria-label="Λεπτομέρειες" />
                      <th className="px-4 py-3 sm:px-6">Προϊόν</th>
                      <th className="px-4 py-3">Απόθεμα</th>
                      <th className="hidden px-4 py-3 md:table-cell">Δεσμευμένο</th>
                      <th className="hidden px-4 py-3 lg:table-cell">Διαθέσιμο</th>
                      <th className="px-4 py-3">Κατάσταση</th>
                      <th className="px-4 py-3 text-right sm:pr-6">Ενέργειες</th>
                    </tr>
                  </thead>
                  <tbody>
                    {products.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="p-0">
                          <EmptyState
                            icon={Package}
                            title={
                              hasActiveFilters
                                ? "Δεν βρέθηκαν αποτελέσματα"
                                : "Δεν υπάρχουν προϊόντα στην αποθήκη"
                            }
                            description={
                              hasActiveFilters
                                ? "Δοκιμάστε άλλο φίλτρο ή όρο αναζήτησης."
                                : "Προσθέστε προϊόντα στον κατάλογο για να εμφανιστούν εδώ."
                            }
                            actionLabel={hasActiveFilters ? undefined : "Προϊόντα"}
                            actionHref="/products"
                            className="py-8"
                          />
                        </td>
                      </tr>
                    ) : (
                      products.map((product) => {
                        const status = getStockStatus(product.stock, product.minStock);
                        const variants = variantsByProduct.get(product.id) ?? [];
                        const hasColorBreakdown = variants.length > 0;
                        const isExpanded = expandedProductId === product.id;

                        return (
                          <React.Fragment key={product.id}>
                            <tr
                              className={cn(
                                premiumTableRow,
                                "transition-all duration-200 hover:shadow-sm",
                                status === "critical" && "border-l-4 border-l-red-500",
                                status === "low" && "border-l-4 border-l-amber-500",
                              )}
                            >
                              <td className="px-2 py-3">
                                {hasColorBreakdown ? (
                                  <button
                                    type="button"
                                    className="rounded p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-kartex-navy"
                                    aria-expanded={isExpanded}
                                    aria-label={
                                      isExpanded
                                        ? "Απόκρυψη χρωμάτων"
                                        : "Εμφάνιση χρωμάτων"
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
                                <p className="font-semibold text-kartex-navy">
                                  {product.cleanName || product.name}
                                </p>
                                <p className="mt-0.5 font-mono text-xs text-muted-foreground">
                                  {product.sku}
                                </p>
                              </td>
                              <td className="px-4 py-3">
                                <p className="text-2xl font-bold tabular-nums text-kartex-navy">
                                  {product.stock}
                                </p>
                                <StockBar
                                  stock={product.stock}
                                  maxStock={maxPageStock}
                                  minStock={product.minStock}
                                  showLabel={false}
                                  thin
                                  className="mt-2 min-w-[120px]"
                                />
                              </td>
                              <td className="hidden px-4 py-3 md:table-cell">
                                <span className="inline-flex rounded-full bg-orange-50 px-2.5 py-1 text-xs font-semibold text-orange-700">
                                  {product.reservedStock}
                                </span>
                              </td>
                              <td className="hidden px-4 py-3 lg:table-cell">
                                <span className="inline-flex rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                                  {product.availableStock}
                                </span>
                              </td>
                              <td className="px-4 py-3">
                                <StockStatusBadge
                                  stock={product.stock}
                                  minStock={product.minStock}
                                  className="px-3 py-1 text-xs font-semibold"
                                />
                              </td>
                              <td className="px-4 py-3 text-right sm:pr-6">
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  className="border-kartex-gold/40 font-semibold text-kartex-navy hover:bg-kartex-gold/10"
                                  onClick={() => openAdjustmentForProduct(product.id)}
                                >
                                  Προσαρμογή
                                </Button>
                              </td>
                            </tr>
                            {isExpanded && hasColorBreakdown ? (
                              <tr className="border-b border-border/60 bg-muted/20">
                                <td colSpan={7} className="px-4 py-4 sm:px-6">
                                  <div className="space-y-3">
                                    {variants.map((variant) => {
                                      const color = variant.color;
                                      if (!color) return null;

                                      return (
                                        <div
                                          key={variant.id}
                                          className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border/60 bg-background px-3 py-2"
                                        >
                                          <div className="flex items-center gap-3">
                                            <ColorCircle
                                              color={{
                                                name: color.name,
                                                hexCode: color.hexCode,
                                              }}
                                              size={28}
                                            />
                                            <div>
                                              <p className="text-sm font-medium text-kartex-navy">
                                                {color.name}
                                              </p>
                                              <p className="text-lg font-semibold tabular-nums">
                                                {variant.stock}
                                              </p>
                                            </div>
                                          </div>
                                          <div className="flex flex-wrap items-center gap-2">
                                            <StockStatusBadge
                                              stock={variant.stock}
                                              minStock={product.minStock}
                                            />
                                            {variantAdjustId === variant.id ? (
                                              <>
                                                <Input
                                                  type="number"
                                                  min={0}
                                                  value={variantAdjustQty}
                                                  onChange={(event) =>
                                                    setVariantAdjustQty(event.target.value)
                                                  }
                                                  className="w-24"
                                                />
                                                <Button
                                                  type="button"
                                                  size="sm"
                                                  disabled={variantSaving}
                                                  onClick={() =>
                                                    void handleSaveVariantStock(
                                                      variant,
                                                      product.id,
                                                    )
                                                  }
                                                >
                                                  OK
                                                </Button>
                                                <Button
                                                  type="button"
                                                  size="sm"
                                                  variant="ghost"
                                                  onClick={() => {
                                                    setVariantAdjustId(null);
                                                    setVariantAdjustQty("");
                                                  }}
                                                >
                                                  Άκυρο
                                                </Button>
                                              </>
                                            ) : (
                                              <Button
                                                type="button"
                                                size="sm"
                                                variant="outline"
                                                className="border-kartex-gold/30"
                                                onClick={() => {
                                                  setVariantAdjustId(variant.id);
                                                  setVariantAdjustQty(String(variant.stock));
                                                }}
                                              >
                                                Ρύθμιση
                                              </Button>
                                            )}
                                          </div>
                                        </div>
                                      );
                                    })}
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
                {totalCount > 0 ? (
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
        </>
      ) : null}

      {activeTab === "movements" ? (
        movementsLoading ? (
          <LevelsTableSkeleton />
        ) : (
          <Card className={premiumTableWrap}>
            {movementsError ? (
              <CardContent className="p-4">
                <DataError
                  message={movementsError}
                  onRetry={() => setMovementsFetchKey((k) => k + 1)}
                />
              </CardContent>
            ) : (
              <CardContent className="overflow-x-auto p-0">
                <table className="w-full min-w-[800px] text-sm">
                  <thead>
                    <tr className={premiumTableHeadSticky}>
                      <th className="px-4 py-3 sm:px-6">Ημερομηνία</th>
                      <th className="px-4 py-3">Προϊόν</th>
                      <th className="px-4 py-3">Τύπος</th>
                      <th className="px-4 py-3">Ποσότητα</th>
                      <th className="px-4 py-3">Λόγος</th>
                      <th className="px-4 py-3 sm:pr-6">Παραγγελία</th>
                    </tr>
                  </thead>
                  <tbody>
                    {movements.length === 0 ? (
                      <tr>
                        <td
                          colSpan={6}
                          className="px-4 py-12 text-center text-muted-foreground sm:px-6"
                        >
                          Δεν υπάρχουν καταγεγραμμένες κινήσεις.
                        </td>
                      </tr>
                    ) : (
                      movements.map((row) => (
                        <tr
                          key={row.id}
                          className={cn(premiumTableRow, "hover:shadow-sm")}
                        >
                          <td className="px-4 py-3 text-muted-foreground sm:px-6">
                            {formatDateEl(row.created_at)}
                          </td>
                          <td className="px-4 py-3 font-medium text-kartex-navy">
                            {getProductDisplayName(row.products)}
                          </td>
                          <td className="px-4 py-3">
                            {MOVEMENT_TYPE_LABELS[row.type] ?? row.type}
                          </td>
                          <td className="px-4 py-3 tabular-nums">{row.quantity}</td>
                          <td className="px-4 py-3 text-muted-foreground">
                            {row.reason?.trim() || "—"}
                          </td>
                          <td className="px-4 py-3 sm:pr-6">
                            {row.order_id ? (
                              <Link
                                href={`/orders/${row.order_id}`}
                                className="text-kartex-navy transition-colors hover:text-kartex-gold"
                              >
                                {pickJoinName(row.orders, "order_number")}
                              </Link>
                            ) : (
                              "—"
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </CardContent>
            )}
          </Card>
        )
      ) : null}

      {activeTab === "adjustments" ? (
        <Card className={premiumTableWrap}>
          <CardHeader>
            <CardTitle className="text-lg text-kartex-navy">
              Νέα προσαρμογή αποθέματος
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form
              onSubmit={(e) => void handleSaveAdjustment(e)}
              className="mx-auto max-w-lg space-y-4"
            >
              <div className="space-y-2">
                <Label htmlFor="adj-product-search">Προϊόν</Label>
                <Input
                  id="adj-product-search"
                  value={productSearch}
                  onChange={(e) => setProductSearch(e.target.value)}
                  placeholder="Αναζήτηση προϊόντος…"
                  disabled={adjustmentProductsLoading}
                  className={premiumInputFocus}
                />
                <select
                  id="adj-product"
                  value={adjustProductId}
                  onChange={(e) => setAdjustProductId(e.target.value)}
                  className={premiumSelect}
                  required
                  disabled={adjustmentProductsLoading}
                >
                  <option value="">Επιλέξτε προϊόν…</option>
                  {filteredProducts.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.sku}) — απόθεμα: {p.stock}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="adj-qty">
                  Ποσότητα (+ εισαγωγή / − εξαγωγή)
                </Label>
                <Input
                  id="adj-qty"
                  type="number"
                  value={adjustQuantity}
                  onChange={(e) => setAdjustQuantity(e.target.value)}
                  placeholder="π.χ. 10 ή -5"
                  required
                  className={premiumInputFocus}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="adj-reason">Λόγος</Label>
                <select
                  id="adj-reason"
                  value={adjustReason}
                  onChange={(e) => setAdjustReason(e.target.value)}
                  className={premiumSelect}
                >
                  {ADJUSTMENT_REASONS.map((reason) => (
                    <option key={reason} value={reason}>
                      {reason}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="adj-notes">Σημειώσεις</Label>
                <textarea
                  id="adj-notes"
                  value={adjustNotes}
                  onChange={(e) => setAdjustNotes(e.target.value)}
                  className={textareaClassName}
                />
              </div>
              {adjustMessage ? (
                <p
                  className={cn(
                    "text-sm",
                    adjustMessage.includes("επιτυχώς")
                      ? "text-emerald-700"
                      : "text-destructive",
                  )}
                  role="status"
                >
                  {adjustMessage}
                </p>
              ) : null}
              <div className="flex justify-end pt-2">
                <Button
                  type="submit"
                  className={premiumGoldButton}
                  disabled={adjustSaving || adjustmentProductsLoading}
                >
                  {adjustSaving ? "Αποθήκευση…" : "Αποθήκευση Προσαρμογής"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
