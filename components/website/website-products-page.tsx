"use client";

import { ExternalLink, ImageIcon, Upload } from "lucide-react";
import Image from "next/image";
import * as React from "react";
import { toast } from "sonner";

import { ActiveToggle } from "@/components/website/active-toggle";
import { DataError } from "@/components/dashboard/data-error";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { Skeleton } from "@/components/ui/skeleton";
import { setProductActive } from "@/lib/products/set-product-active";
import type { WebsiteProductRow } from "@/lib/website/types";
import { getWebsiteUrl } from "@/lib/website/site-url";
import {
  premiumFilterTabActiveCategory,
  premiumFilterTabInactive,
  premiumGoldButton,
  premiumSecondaryButton,
  premiumStatCard,
  premiumTableHead,
  premiumTableRow,
  premiumTableWrap,
} from "@/lib/ui/premium-styles";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

const PRODUCT_SELECT =
  "id, name, clean_name, sku, category, subcategory, image_url, is_active";

export function WebsiteProductsPage() {
  const [products, setProducts] = React.useState<WebsiteProductRow[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [activeCategory, setActiveCategory] = React.useState("all");
  const [selectedIds, setSelectedIds] = React.useState<Set<string>>(new Set());
  const [busyId, setBusyId] = React.useState<string | null>(null);
  const [bulkBusy, setBulkBusy] = React.useState(false);
  const [fetchKey, setFetchKey] = React.useState(0);

  const headerCheckboxRef = React.useRef<HTMLInputElement>(null);

  const load = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    const supabase = createClient();
    const { data, error: fetchError } = await supabase
      .from("products")
      .select(PRODUCT_SELECT)
      .order("name", { ascending: true });

    if (fetchError) {
      setError(fetchError.message);
      setProducts([]);
    } else {
      setProducts((data as WebsiteProductRow[]) ?? []);
    }
    setLoading(false);
  }, []);

  React.useEffect(() => {
    void load();
  }, [load, fetchKey]);

  const categories = React.useMemo(
    () =>
      [
        ...new Set(
          products
            .map((product) => product.category)
            .filter((category): category is string => Boolean(category)),
        ),
      ].sort((a, b) => a.localeCompare(b, "el")),
    [products],
  );

  const filtered = React.useMemo(() => {
    if (activeCategory === "all") {
      return products;
    }
    return products.filter((product) => product.category === activeCategory);
  }, [products, activeCategory]);

  const activeCount = React.useMemo(
    () => products.filter((product) => product.is_active).length,
    [products],
  );

  const withImageCount = React.useMemo(
    () => products.filter((product) => product.image_url).length,
    [products],
  );

  const selectedOnPage = React.useMemo(
    () => filtered.filter((product) => selectedIds.has(product.id)),
    [filtered, selectedIds],
  );

  const allSelected =
    filtered.length > 0 && selectedOnPage.length === filtered.length;
  const someSelected =
    selectedOnPage.length > 0 && selectedOnPage.length < filtered.length;

  React.useEffect(() => {
    if (headerCheckboxRef.current) {
      headerCheckboxRef.current.indeterminate = someSelected;
    }
  }, [someSelected]);

  function toggleSelection(productId: string, checked: boolean) {
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

  function toggleAll(checked: boolean) {
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

  function productDisplayName(product: WebsiteProductRow) {
    return product.clean_name || product.name;
  }

  async function handleToggleActive(product: WebsiteProductRow) {
    setBusyId(product.id);
    const supabase = createClient();
    const result = await setProductActive(
      supabase,
      product.id,
      !product.is_active,
    );
    setBusyId(null);

    if (!result.ok) {
      toast.error(result.error);
      return;
    }

    setProducts((current) =>
      current.map((row) =>
        row.id === product.id ? { ...row, is_active: !row.is_active } : row,
      ),
    );
    toast.success(
      product.is_active
        ? "Το προϊόν αφαιρέθηκε από τον κατάλογο website."
        : "Το προϊόν εμφανίζεται στον κατάλογο website.",
    );
  }

  async function handleBulkActive(isActive: boolean) {
    if (selectedIds.size === 0) {
      toast.error("Επιλέξτε τουλάχιστον ένα προϊόν.");
      return;
    }

    setBulkBusy(true);
    const supabase = createClient();
    const ids = Array.from(selectedIds);
    const { error: updateError } = await supabase
      .from("products")
      .update({ is_active: isActive })
      .in("id", ids);

    setBulkBusy(false);

    if (updateError) {
      toast.error(updateError.message);
      return;
    }

    setProducts((current) =>
      current.map((row) =>
        selectedIds.has(row.id) ? { ...row, is_active: isActive } : row,
      ),
    );
    toast.success(
      isActive
        ? `Ενεργοποιήθηκαν ${ids.length} προϊόντα στο website.`
        : `Απενεργοποιήθηκαν ${ids.length} προϊόντα στο website.`,
    );
  }

  async function handleImageUpload(productId: string, file: File) {
    if (!file.type.startsWith("image/")) {
      toast.error("Επιλέξτε αρχείο εικόνας.");
      return;
    }

    setBusyId(productId);
    const supabase = createClient();
    const extension = file.name.split(".").pop() || "jpg";
    const filePath = `${productId}/${Date.now()}.${extension}`;

    const { error: uploadError } = await supabase.storage
      .from("product-images")
      .upload(filePath, file, { upsert: true });

    if (uploadError) {
      setBusyId(null);
      toast.error(uploadError.message);
      return;
    }

    const {
      data: { publicUrl },
    } = supabase.storage.from("product-images").getPublicUrl(filePath);

    const { error: updateError } = await supabase
      .from("products")
      .update({ image_url: publicUrl })
      .eq("id", productId);

    setBusyId(null);

    if (updateError) {
      toast.error(updateError.message);
      return;
    }

    setProducts((current) =>
      current.map((row) =>
        row.id === productId ? { ...row, image_url: publicUrl } : row,
      ),
    );
    toast.success("Η εικόνα αποθηκεύτηκε.");
  }

  const websiteUrl = getWebsiteUrl();

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <PageHeader
        title="Προϊόντα Website"
        subtitle="Διαχείριση εμφάνισης προϊόντων στον δημόσιο κατάλογο kartex.gr."
        action={
          <Button asChild variant="outline" className={premiumSecondaryButton}>
            <a href={`${websiteUrl}/el/products`} target="_blank" rel="noreferrer">
              <ExternalLink className="size-4" />
              Προεπισκόπηση
            </a>
          </Button>
        }
      />

      {!loading && !error ? (
        <section className="grid gap-4 sm:grid-cols-3">
          <article className={cn(premiumStatCard, "p-5")}>
            <p className="text-[28px] font-semibold leading-none text-navy-900">
              {products.length}
            </p>
            <p className="mt-1 text-sm text-gray-400">Συνολικά</p>
          </article>
          <article className={cn(premiumStatCard, "p-5")}>
            <p className="text-[28px] font-semibold leading-none text-navy-900">
              {activeCount}
            </p>
            <p className="mt-1 text-sm text-gray-400">Ενεργά στο website</p>
          </article>
          <article className={cn(premiumStatCard, "p-5")}>
            <p className="text-[28px] font-semibold leading-none text-navy-900">
              {withImageCount}
            </p>
            <p className="mt-1 text-sm text-gray-400">Με εικόνα</p>
          </article>
        </section>
      ) : null}

      {!loading && products.length > 0 ? (
        <div
          className="flex flex-wrap gap-2"
          role="tablist"
          aria-label="Φίλτρο κατηγορίας"
        >
          {["all", ...categories].map((category) => {
            const isActive = activeCategory === category;
            const count =
              category === "all"
                ? products.length
                : products.filter((product) => product.category === category)
                    .length;

            return (
              <button
                key={category}
                type="button"
                role="tab"
                aria-selected={isActive}
                onClick={() => setActiveCategory(category)}
                className={cn(
                  isActive
                    ? premiumFilterTabActiveCategory
                    : premiumFilterTabInactive,
                )}
              >
                {category === "all"
                  ? `Όλα (${count})`
                  : `${category} (${count})`}
              </button>
            );
          })}
        </div>
      ) : null}

      {selectedIds.size > 0 ? (
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-sm text-gray-500">
            {selectedIds.size} επιλεγμένα
          </span>
          <Button
            type="button"
            className={premiumGoldButton}
            disabled={bulkBusy}
            onClick={() => void handleBulkActive(true)}
          >
            Ενεργοποίηση επιλεγμένων
          </Button>
          <Button
            type="button"
            variant="outline"
            className={premiumSecondaryButton}
            disabled={bulkBusy}
            onClick={() => void handleBulkActive(false)}
          >
            Απενεργοποίηση επιλεγμένων
          </Button>
        </div>
      ) : null}

      {error ? <DataError message={error} onRetry={() => setFetchKey((k) => k + 1)} /> : null}

      <Card className="border-gray-200/80 shadow-card">
        <CardContent className="p-0">
          {loading ? (
            <div className="space-y-3 p-6">
              {Array.from({ length: 6 }).map((_, index) => (
                <Skeleton key={index} className="h-14 w-full" />
              ))}
            </div>
          ) : products.length === 0 ? (
            <p className="p-8 text-center text-sm text-gray-500">
              Δεν βρέθηκαν προϊόντα.
            </p>
          ) : filtered.length === 0 ? (
            <p className="p-8 text-center text-sm text-gray-500">
              Δεν βρέθηκαν προϊόντα σε αυτή την κατηγορία.
            </p>
          ) : (
            <div className={premiumTableWrap}>
              <table className="w-full min-w-[720px]">
                <thead>
                  <tr className={premiumTableHead}>
                    <th className="w-10 px-4 py-3">
                      <input
                        ref={headerCheckboxRef}
                        type="checkbox"
                        checked={allSelected}
                        onChange={(event) => toggleAll(event.target.checked)}
                        className="size-4 rounded border-gray-300"
                        aria-label="Επιλογή όλων"
                      />
                    </th>
                    <th className="w-20 px-4 py-3">Εικόνα</th>
                    <th className="px-4 py-3">Προϊόν</th>
                    <th className="px-4 py-3">Κατηγορία</th>
                    <th className="px-4 py-3">Υποκατηγορία</th>
                    <th className="px-4 py-3">Ενεργό</th>
                    <th className="px-4 py-3">Ανέβασμα</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((product) => {
                    const isBusy = busyId === product.id;
                    const displayName = productDisplayName(product);
                    return (
                      <tr key={product.id} className={premiumTableRow}>
                        <td className="px-4 py-3">
                          <input
                            type="checkbox"
                            checked={selectedIds.has(product.id)}
                            onChange={(event) =>
                              toggleSelection(product.id, event.target.checked)
                            }
                            className="size-4 rounded border-gray-300"
                            aria-label={`Επιλογή ${displayName}`}
                          />
                        </td>
                        <td className="px-4 py-3">
                          {product.image_url ? (
                            <div className="relative size-12 overflow-hidden rounded-lg border border-gray-200 bg-gray-50">
                              <Image
                                src={product.image_url}
                                alt={displayName}
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
                          <p className="font-medium text-navy-900">{displayName}</p>
                          <p className="text-xs text-gray-400">{product.sku}</p>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">
                          {product.category || "—"}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">
                          {product.subcategory || "—"}
                        </td>
                        <td className="px-4 py-3">
                          <ActiveToggle
                            active={product.is_active}
                            disabled={isBusy}
                            onClick={() => void handleToggleActive(product)}
                            label={`Ενεργό ${displayName}`}
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
                                  void handleImageUpload(product.id, file);
                                }
                              }}
                            />
                          </label>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
