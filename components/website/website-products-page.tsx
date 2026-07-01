"use client";

import { ExternalLink } from "lucide-react";
import * as React from "react";
import { toast } from "sonner";

import { DataError } from "@/components/dashboard/data-error";
import { WebsiteMasterGroupTableRow } from "@/components/website/website-master-group-ui";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { Skeleton } from "@/components/ui/skeleton";
import { setMasterActive } from "@/lib/products/set-master-active";
import {
  mapWebsiteProductMasterRow,
  WEBSITE_PRODUCT_MASTERS_SELECT,
} from "@/lib/website/product-masters";
import type { WebsiteProductMasterRow } from "@/lib/website/types";
import { getWebsiteUrl } from "@/lib/website/site-url";
import {
  premiumFilterTabActiveCategory,
  premiumFilterTabInactive,
  premiumGoldButton,
  premiumSecondaryButton,
  premiumStatCard,
  premiumTableHead,
  premiumTableWrap,
} from "@/lib/ui/premium-styles";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

type WebsiteCategoryWithSubs = {
  id: string;
  name: string;
  website_subcategories: { id: string; name: string }[];
};

export function WebsiteProductsPage() {
  const [masters, setMasters] = React.useState<WebsiteProductMasterRow[]>([]);
  const [websiteCategories, setWebsiteCategories] = React.useState<
    WebsiteCategoryWithSubs[]
  >([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [activeCategory, setActiveCategory] = React.useState("all");
  const [selectedIds, setSelectedIds] = React.useState<Set<string>>(new Set());
  const [busyId, setBusyId] = React.useState<string | null>(null);
  const [bulkBusy, setBulkBusy] = React.useState(false);
  const [fetchKey, setFetchKey] = React.useState(0);
  const [expandedId, setExpandedId] = React.useState<string | null>(null);

  const headerCheckboxRef = React.useRef<HTMLInputElement>(null);

  const knownCategoryNames = React.useMemo(
    () => new Set(websiteCategories.map((category) => category.name)),
    [websiteCategories],
  );

  const load = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    const supabase = createClient();
    const { data, error: fetchError } = await supabase
      .from("product_masters")
      .select(WEBSITE_PRODUCT_MASTERS_SELECT)
      .order("category")
      .order("clean_name");

    if (fetchError) {
      setError(fetchError.message);
      setMasters([]);
    } else {
      setMasters(
        (data ?? []).map((row) =>
          mapWebsiteProductMasterRow(
            row as Parameters<typeof mapWebsiteProductMasterRow>[0],
          ),
        ),
      );
    }
    setLoading(false);
  }, []);

  React.useEffect(() => {
    void load();
  }, [load, fetchKey]);

  React.useEffect(() => {
    async function loadCategories() {
      const supabase = createClient();
      const { data } = await supabase
        .from("website_categories")
        .select("id, name, website_subcategories(id, name)")
        .eq("is_active", true)
        .order("sort_order");
      setWebsiteCategories((data as WebsiteCategoryWithSubs[] | null) ?? []);
    }
    void loadCategories();
  }, []);

  const categoryTabs = React.useMemo(() => {
    const tabs = [
      {
        id: "all",
        label: "Όλα",
        count: masters.length,
      },
      ...websiteCategories.map((category) => ({
        id: category.name,
        label: category.name,
        count: masters.filter((master) => master.category === category.name)
          .length,
      })),
    ];
    return tabs;
  }, [masters, websiteCategories]);

  const filtered = React.useMemo(() => {
    if (activeCategory === "all") {
      return masters;
    }
    return masters.filter((master) => master.category === activeCategory);
  }, [masters, activeCategory]);

  const activeCount = React.useMemo(
    () => masters.filter((master) => master.isActive).length,
    [masters],
  );

  const withImageCount = React.useMemo(
    () => masters.filter((master) => master.imageUrl).length,
    [masters],
  );

  const selectedOnPage = React.useMemo(
    () => filtered.filter((master) => selectedIds.has(master.id)),
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

  function toggleSelection(masterId: string, checked: boolean) {
    setSelectedIds((current) => {
      const next = new Set(current);
      if (checked) {
        next.add(masterId);
      } else {
        next.delete(masterId);
      }
      return next;
    });
  }

  function toggleAll(checked: boolean) {
    setSelectedIds((current) => {
      const next = new Set(current);
      for (const master of filtered) {
        if (checked) {
          next.add(master.id);
        } else {
          next.delete(master.id);
        }
      }
      return next;
    });
  }

  function updateMaster(
    masterId: string,
    patch: Partial<WebsiteProductMasterRow>,
  ) {
    setMasters((current) =>
      current.map((row) => (row.id === masterId ? { ...row, ...patch } : row)),
    );
  }

  function updateVariantInternalPrice(
    masterId: string,
    variantId: string,
    internalPriceEur: number | null,
  ) {
    setMasters((current) =>
      current.map((master) => {
        if (master.id !== masterId) return master;
        return {
          ...master,
          variants: master.variants.map((variant) =>
            variant.id === variantId
              ? { ...variant, internalPriceEur }
              : variant,
          ),
        };
      }),
    );
  }

  async function handleToggleActive(master: WebsiteProductMasterRow) {
    setBusyId(master.id);
    const supabase = createClient();
    const result = await setMasterActive(supabase, master.id, !master.isActive);
    setBusyId(null);

    if (!result.ok) {
      toast.error(result.error);
      return;
    }

    updateMaster(master.id, { isActive: !master.isActive });
    toast.success(
      master.isActive
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
      .from("product_masters")
      .update({ is_active: isActive })
      .in("id", ids);

    setBulkBusy(false);

    if (updateError) {
      toast.error(updateError.message);
      return;
    }

    setMasters((current) =>
      current.map((row) =>
        selectedIds.has(row.id) ? { ...row, isActive } : row,
      ),
    );
    toast.success(
      isActive
        ? `Ενεργοποιήθηκαν ${ids.length} masters στο website.`
        : `Απενεργοποιήθηκαν ${ids.length} masters στο website.`,
    );
  }

  async function handleCategoryChange(masterId: string, categoryName: string) {
    if (!categoryName) return;

    setBusyId(masterId);
    const supabase = createClient();
    const { error: updateError } = await supabase
      .from("product_masters")
      .update({ category: categoryName, subcategory: null })
      .eq("id", masterId);

    setBusyId(null);

    if (updateError) {
      toast.error(updateError.message);
      return;
    }

    updateMaster(masterId, {
      category: categoryName,
      subcategory: null,
    });
    toast.success("Κατηγορία αποθηκεύτηκε");
  }

  async function handleSubcategoryChange(
    masterId: string,
    subcategoryName: string,
  ) {
    setBusyId(masterId);
    const supabase = createClient();
    const subcategory = subcategoryName || null;
    const { error: updateError } = await supabase
      .from("product_masters")
      .update({ subcategory })
      .eq("id", masterId);

    setBusyId(null);

    if (updateError) {
      toast.error(updateError.message);
      return;
    }

    updateMaster(masterId, { subcategory });
    toast.success("Υποκατηγορία αποθηκεύτηκε");
  }

  async function handleImageUpload(masterId: string, file: File) {
    if (!file.type.startsWith("image/")) {
      toast.error("Επιλέξτε αρχείο εικόνας.");
      return;
    }

    setBusyId(masterId);
    const supabase = createClient();
    const extension = file.name.split(".").pop() || "jpg";
    const filePath = `masters/${masterId}/${Date.now()}.${extension}`;

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
      .from("product_masters")
      .update({ image_url: publicUrl })
      .eq("id", masterId);

    setBusyId(null);

    if (updateError) {
      toast.error(updateError.message);
      return;
    }

    updateMaster(masterId, { imageUrl: publicUrl });
    toast.success("Η εικόνα αποθηκεύτηκε.");
  }

  async function handleInternalPriceSave(
    masterId: string,
    variantId: string,
    value: number | null,
  ): Promise<boolean> {
    setBusyId(variantId);
    const supabase = createClient();
    const { error: updateError } = await supabase
      .from("products")
      .update({ internal_price_eur: value })
      .eq("id", variantId);

    setBusyId(null);

    if (updateError) {
      toast.error(updateError.message);
      return false;
    }

    updateVariantInternalPrice(masterId, variantId, value);
    toast.success("Εσωτερική τιμή αποθηκεύτηκε");
    return true;
  }

  const websiteUrl = getWebsiteUrl();

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <PageHeader
        title="Προϊόντα Website"
        subtitle="Διαχείριση εμφάνισης product masters στον δημόσιο κατάλογο kartex.gr."
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
              {masters.length}
            </p>
            <p className="mt-1 text-sm text-gray-400">Συνολικά masters</p>
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

      {!loading && masters.length > 0 ? (
        <div
          className="flex flex-wrap gap-2"
          role="tablist"
          aria-label="Φίλτρο κατηγορίας"
        >
          {categoryTabs.map((tab) => {
            const isActive = activeCategory === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={isActive}
                onClick={() => setActiveCategory(tab.id)}
                className={cn(
                  isActive
                    ? premiumFilterTabActiveCategory
                    : premiumFilterTabInactive,
                )}
              >
                {tab.label} ({tab.count})
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

      {error ? (
        <DataError message={error} onRetry={() => setFetchKey((k) => k + 1)} />
      ) : null}

      <Card className="border-gray-200/80 shadow-card">
        <CardContent className="p-0">
          {loading ? (
            <div className="space-y-3 p-6">
              {Array.from({ length: 6 }).map((_, index) => (
                <Skeleton key={index} className="h-14 w-full" />
              ))}
            </div>
          ) : masters.length === 0 ? (
            <p className="p-8 text-center text-sm text-gray-500">
              Δεν βρέθηκαν product masters.
            </p>
          ) : filtered.length === 0 ? (
            <p className="p-8 text-center text-sm text-gray-500">
              Δεν βρέθηκαν προϊόντα σε αυτή την κατηγορία.
            </p>
          ) : (
            <div className={premiumTableWrap}>
              <table className="w-full min-w-[960px]">
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
                    <th className="px-4 py-3">Παραλλαγές</th>
                    <th className="px-4 py-3">Ενεργό</th>
                    <th className="px-4 py-3">Ανέβασμα</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((master) => {
                    const isBusy =
                      busyId === master.id ||
                      master.variants.some((variant) => variant.id === busyId);
                    const hasUnknownCategory =
                      Boolean(master.category) &&
                      !knownCategoryNames.has(master.category);

                    return (
                      <WebsiteMasterGroupTableRow
                        key={master.id}
                        master={master}
                        websiteCategories={websiteCategories}
                        isExpanded={expandedId === master.id}
                        isSelected={selectedIds.has(master.id)}
                        isBusy={isBusy}
                        hasUnknownCategory={hasUnknownCategory}
                        onToggleExpand={() =>
                          setExpandedId((current) =>
                            current === master.id ? null : master.id,
                          )
                        }
                        onToggleSelect={(checked) =>
                          toggleSelection(master.id, checked)
                        }
                        onToggleActive={() => void handleToggleActive(master)}
                        onCategoryChange={(categoryName) =>
                          void handleCategoryChange(master.id, categoryName)
                        }
                        onSubcategoryChange={(subcategoryName) =>
                          void handleSubcategoryChange(
                            master.id,
                            subcategoryName,
                          )
                        }
                        onImageUpload={(file) =>
                          void handleImageUpload(master.id, file)
                        }
                        onInternalPriceSave={(variantId, value) =>
                          handleInternalPriceSave(master.id, variantId, value)
                        }
                      />
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
