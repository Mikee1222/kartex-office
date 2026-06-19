"use client";

import {
  AlertCircle,
  ChevronDown,
  ChevronRight,
  Layers,
  Package,
  Palette,
  Ruler,
  Search,
  TriangleAlert,
  Wallet,
  Weight,
} from "lucide-react";
import Link from "next/link";
import * as React from "react";
import { toast } from "sonner";

import { DataError } from "@/components/dashboard/data-error";
import { EmptyState } from "@/components/dashboard/empty-state";
import { CategoryBadge } from "@/components/products/category-badge";
import { StockBar } from "@/components/products/stock-bar";
import { StockStatusIcon } from "@/components/products/stock-status-icon";
import { getStockStatus, type Product } from "@/components/products/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { ADJUSTMENT_REASONS } from "@/lib/inventory/adjustment-reasons";
import { logInventoryMovement } from "@/lib/inventory/log-movement";
import {
  buildMasterGroups,
  getMasterGroupKey,
  sortMasterGroupsCriticalFirst,
  type MasterGroup,
  type ProductVariant,
} from "@/lib/products/master-groups";
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

const LEVELS_ITEMS_PER_PAGE = 20;

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

function LevelsListSkeleton() {
  return (
    <div className="space-y-2">
      {Array.from({ length: 6 }).map((_, index) => (
        <Skeleton key={index} className="h-16 rounded-2xl" />
      ))}
    </div>
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
  const [criticalFirstSort, setCriticalFirstSort] = React.useState(true);
  const [currentPage, setCurrentPage] = React.useState(1);
  const [expandedMasters, setExpandedMasters] = React.useState<Set<string>>(
    () => new Set(),
  );
  const [adjustmentProducts, setAdjustmentProducts] = React.useState<Product[]>([]);
  const [adjustmentProductsLoading, setAdjustmentProductsLoading] =
    React.useState(false);
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
  const [adjustMessage, setAdjustMessage] = React.useState<string | null>(null);

  const [productAdjustId, setProductAdjustId] = React.useState<string | null>(null);
  const [productAdjustQty, setProductAdjustQty] = React.useState("");
  const [productAdjustSaving, setProductAdjustSaving] = React.useState(false);

  const masterGroups = React.useMemo(() => buildMasterGroups(products), [products]);

  const categories = React.useMemo(
    () =>
      [...new Set(masterGroups.map((group) => group.category))].sort((a, b) =>
        a.localeCompare(b, "el"),
      ),
    [masterGroups],
  );

  const categoryTabs = React.useMemo(
    () => [
      { id: "all", label: "Όλα" },
      ...categories.map((category) => ({ id: category, label: category })),
    ],
    [categories],
  );

  const filteredGroups = React.useMemo(() => {
    const trimmedSearch = levelsSearch.trim().toLowerCase();
    let groups = masterGroups.filter((group) => {
      if (categoryFilter !== "all" && group.category !== categoryFilter) {
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

    if (criticalFirstSort) {
      groups = sortMasterGroupsCriticalFirst(groups);
    }

    return groups;
  }, [masterGroups, categoryFilter, levelsSearch, criticalFirstSort]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredGroups.length / LEVELS_ITEMS_PER_PAGE),
  );
  const paginatedGroups = filteredGroups.slice(
    (currentPage - 1) * LEVELS_ITEMS_PER_PAGE,
    currentPage * LEVELS_ITEMS_PER_PAGE,
  );

  const summary = React.useMemo(() => {
    const trimmedSearch = levelsSearch.trim().toLowerCase();
    const filteredProducts = products.filter((product) => {
      if (categoryFilter !== "all" && product.category !== categoryFilter) {
        return false;
      }
      if (!trimmedSearch) return true;
      const cleanName = product.cleanName || product.name;
      return (
        cleanName.toLowerCase().includes(trimmedSearch) ||
        product.sku.toLowerCase().includes(trimmedSearch) ||
        product.name.toLowerCase().includes(trimmedSearch)
      );
    });

    let criticalCount = 0;
    let totalValue = 0;
    for (const product of filteredProducts) {
      if (getStockStatus(product.stock, product.minStock) === "critical") {
        criticalCount += 1;
      }
      totalValue += product.stock * product.purchasePrice;
    }

    return {
      totalProducts: filteredProducts.length,
      criticalCount,
      totalValue,
    };
  }, [products, categoryFilter, levelsSearch]);

  const hasActiveFilters =
    levelsSearch.trim().length > 0 || categoryFilter !== "all";

  React.useEffect(() => {
    setCurrentPage(1);
  }, [levelsSearch, categoryFilter, criticalFirstSort]);

  React.useEffect(() => {
    if (activeTab !== "levels") return;

    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);
      const supabase = createClient();
      const { data, error: fetchError } = await supabase
        .from("products")
        .select("*")
        .order("clean_name", { ascending: true });

      if (cancelled) return;

      if (fetchError) {
        setError(
          fetchError.message ||
            "Αποτυχία φόρτωσης αποθέματος. Ελέγξτε τη σύνδεση.",
        );
        setProducts([]);
        setLoading(false);
        return;
      }

      setProducts((data as ProductRow[]).map(mapProductRow));
      setLoading(false);
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [activeTab, fetchKey]);

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
        const pattern = `%${trimmedProductSearch.replace(/[%_\\,]/g, "\\$&")}%`;
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

  async function handleSaveProductStock(variant: ProductVariant) {
    const product = products.find((row) => row.id === variant.id);
    if (!product) {
      toast.error("Το προϊόν δεν βρέθηκε.");
      return;
    }

    const newStock = Math.max(
      0,
      Math.round(Number.parseInt(productAdjustQty, 10) || 0),
    );
    const delta = newStock - product.stock;

    if (delta === 0) {
      setProductAdjustId(null);
      setProductAdjustQty("");
      return;
    }

    setProductAdjustSaving(true);
    const supabase = createClient();
    const { error: updateError } = await supabase
      .from("products")
      .update({ stock: newStock })
      .eq("id", variant.id);

    if (updateError) {
      toast.error(updateError.message || "Αποτυχία αποθήκευσης.");
      setProductAdjustSaving(false);
      return;
    }

    const { error: movementError } = await logInventoryMovement(supabase, {
      product_id: variant.id,
      type: "adjustment",
      quantity: Math.abs(delta),
      reason: "Χειροκίνητη προσαρμογή (επίπεδα αποθέματος)",
    });

    if (movementError) {
      console.error("inventory_movement insert failed:", movementError);
    }

    setProductAdjustId(null);
    setProductAdjustQty("");
    setMovementsFetchKey((key) => key + 1);
    setFetchKey((key) => key + 1);
    setProductAdjustSaving(false);
    toast.success("Το απόθεμα ενημερώθηκε.");
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

    const { error: updateError } = await supabase
      .from("products")
      .update({ stock: newStock })
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
          {loading ? (
            <LevelsSummarySkeleton />
          ) : (
            <div className="grid gap-4 sm:grid-cols-3">
              <div className={cn(premiumStatCard, "p-5")}>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Package className="size-4 text-kartex-gold" aria-hidden />
                  <p className={premiumLabel}>Συνολικά Προϊόντα</p>
                </div>
                <p className="mt-2 text-3xl font-bold tabular-nums text-kartex-navy">
                  {summary.totalProducts}
                </p>
              </div>
              <div className={cn(premiumStatCard, "p-5")}>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <TriangleAlert className="size-4 text-red-500" aria-hidden />
                  <p className={premiumLabel}>Κρίσιμο Απόθεμα</p>
                </div>
                <p className="mt-2 text-3xl font-bold tabular-nums text-red-700">
                  {summary.criticalCount}
                </p>
              </div>
              <div className={cn(premiumStatCard, "p-5")}>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Wallet className="size-4 text-kartex-gold" aria-hidden />
                  <p className={premiumLabel}>Συνολική Αξία</p>
                </div>
                <p className="mt-2 text-2xl font-bold tabular-nums text-kartex-navy">
                  {formatCurrencyEl(summary.totalValue)}
                </p>
              </div>
            </div>
          )}

          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="relative max-w-md flex-1">
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
              <Button
                type="button"
                variant={criticalFirstSort ? "default" : "outline"}
                size="sm"
                className={cn(
                  criticalFirstSort
                    ? "bg-kartex-navy text-white hover:bg-kartex-navy/90"
                    : "border-kartex-gold/40 text-kartex-navy hover:bg-kartex-gold/10",
                )}
                onClick={() => setCriticalFirstSort((value) => !value)}
              >
                <AlertCircle className="size-4" aria-hidden />
                Κρίσιμα πρώτα
              </Button>
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
                    {tab.id === "all"
                      ? `Όλα (${masterGroups.length})`
                      : `${tab.label} (${masterGroups.filter((group) => group.category === tab.id).length})`}
                  </button>
                );
              })}
            </div>
          </div>

          {loading ? (
            <LevelsListSkeleton />
          ) : !error ? (
            <>
              <div className="space-y-2">
                {paginatedGroups.length === 0 ? (
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
                    className="rounded-2xl border border-border bg-card py-12"
                  />
                ) : (
                  paginatedGroups.map((group) => (
                    <InventoryMasterGroupCard
                      key={getMasterGroupKey(group.cleanName, group.category)}
                      group={group}
                      isExpanded={expandedMasters.has(
                        getMasterGroupKey(group.cleanName, group.category),
                      )}
                      onToggle={() =>
                        toggleMaster(getMasterGroupKey(group.cleanName, group.category))
                      }
                      productAdjustId={productAdjustId}
                      productAdjustQty={productAdjustQty}
                      productAdjustSaving={productAdjustSaving}
                      onStartAdjust={(variant) => {
                        setProductAdjustId(variant.id);
                        setProductAdjustQty(String(variant.stock));
                      }}
                      onCancelAdjust={() => {
                        setProductAdjustId(null);
                        setProductAdjustQty("");
                      }}
                      onAdjustQtyChange={setProductAdjustQty}
                      onSaveAdjust={(variant) => void handleSaveProductStock(variant)}
                    />
                  ))
                )}
              </div>

              {filteredGroups.length > 0 ? (
                <PaginationControls
                  currentPage={currentPage}
                  totalPages={totalPages}
                  totalItems={filteredGroups.length}
                  itemsPerPage={LEVELS_ITEMS_PER_PAGE}
                  onPageChange={setCurrentPage}
                  itemLabel="ομάδες προϊόντων"
                />
              ) : null}
            </>
          ) : null}
        </>
      ) : null}

      {activeTab === "movements" ? (
        movementsLoading ? (
          <Card className={premiumTableWrap}>
            <CardContent className="space-y-3 p-4 sm:p-6">
              {Array.from({ length: 6 }).map((_, index) => (
                <Skeleton key={index} className="h-14 w-full rounded-lg" />
              ))}
            </CardContent>
          </Card>
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
                      {p.cleanName || p.name} ({p.sku}) — απόθεμα: {p.stock}
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

function InventoryMasterGroupCard({
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
            const status = getStockStatus(variant.stock, variant.minStock);
            const isCrit = status === "critical";
            const isLow = status === "low";
            const isAdjusting = productAdjustId === variant.id;

            return (
              <div
                key={variant.id}
                className={cn(
                  "flex flex-wrap items-center gap-4 px-6 py-3",
                  index < group.variants.length - 1 && "border-b border-border/30",
                )}
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
                  <div className="mt-2">
                    <StockBar
                      stock={variant.stock}
                      maxStock={maxStock}
                      minStock={variant.minStock}
                      showLabel={false}
                      thin
                      className="max-w-md"
                    />
                  </div>
                  <p className="mt-1 font-mono text-xs text-muted-foreground">
                    SKU {variant.sku}
                  </p>
                </div>

                <div className="shrink-0 text-right">
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
                  <div className="mt-1 flex flex-wrap justify-end gap-2 text-xs">
                    <span className="rounded-full bg-orange-50 px-2 py-0.5 font-semibold text-orange-700">
                      {variant.reservedStock} δεσμ.
                    </span>
                    <span className="rounded-full bg-emerald-50 px-2 py-0.5 font-semibold text-emerald-700">
                      {variant.availableStock} διαθ.
                    </span>
                  </div>
                </div>

                <div className="flex shrink-0 flex-wrap items-center gap-2">
                  {isAdjusting ? (
                    <>
                      <Input
                        type="number"
                        min={0}
                        value={productAdjustQty}
                        onChange={(event) => onAdjustQtyChange(event.target.value)}
                        className="w-24"
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
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        onClick={onCancelAdjust}
                      >
                        Άκυρο
                      </Button>
                    </>
                  ) : (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="border-kartex-gold/40 font-semibold text-kartex-navy hover:bg-kartex-gold/10"
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
    </div>
  );
}
