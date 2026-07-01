"use client";

import { ArrowLeft, ExternalLink, Loader2 } from "lucide-react";
import Link from "next/link";
import * as React from "react";
import { toast } from "sonner";

import {
  ProductCategorySelect,
  ProductSubcategorySelect,
} from "@/components/products/product-category-select";
import { InventoryMasterVariantsPanel } from "@/components/products/inventory-master-variants-panel";
import { ActiveToggle } from "@/components/website/active-toggle";
import { WebsiteMasterImagesEditor } from "@/components/website/website-master-images-editor";
import { WebsiteMasterVariantsPanel } from "@/components/website/website-master-variants-panel";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PageHeader } from "@/components/ui/page-header";
import {
  INVENTORY_PRODUCT_MASTER_DETAIL_SELECT,
  mapInventoryProductMasterRow,
  type InventoryProductMasterRow,
} from "@/lib/products/product-master-detail";
import { setMasterActive } from "@/lib/products/set-master-active";
import {
  premiumGoldButton,
  premiumSecondaryButton,
} from "@/lib/ui/premium-styles";
import { getWebsiteUrl } from "@/lib/website/site-url";
import type { WebsiteProductMasterRow } from "@/lib/website/types";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

type ProductMasterDetailContext = "website" | "inventory";

type WebsiteCategoryWithSubs = {
  id: string;
  name: string;
  website_subcategories: { id: string; name: string }[];
};

type ProductMasterDetailPageProps = {
  masterId: string;
  context: ProductMasterDetailContext;
};

type MasterRow = WebsiteProductMasterRow | InventoryProductMasterRow;

const CONTEXT_CONFIG = {
  website: {
    backHref: "/website/products",
    backLabel: "Πίσω",
    subtitle: "Επεξεργασία περιεχομένου website για product master.",
    activeLabel: "Ενεργό στο website",
    descriptionLabel: "Περιγραφή (website)",
    descriptionPlaceholder:
      "Σύντομο marketing κείμενο για τη σελίδα προϊόντος…",
    showPreview: true,
    imagesApiBasePath: undefined as string | undefined,
    variantDetailHrefPrefix: undefined as string | undefined,
    showInternalPrice: true,
    addVariantMode: "website" as const,
    activeOnToast: "Το προϊόν εμφανίζεται στον κατάλογο.",
    activeOffToast: "Το προϊόν αφαιρέθηκε από τον κατάλογο.",
    notFoundBackHref: "/website/products",
  },
  inventory: {
    backHref: "/products",
    backLabel: "Πίσω στα Προϊόντα",
    subtitle: "Επισκόπηση master προϊόντος — στοιχεία, εικόνες και παραλλαγές.",
    activeLabel: "Ενεργό",
    descriptionLabel: "Περιγραφή",
    descriptionPlaceholder: "Περιγραφή προϊόντος…",
    showPreview: false,
    imagesApiBasePath: "/api/products/product-masters",
    variantDetailHrefPrefix: "/products",
    showInternalPrice: false,
    addVariantMode: "products" as const,
    activeOnToast: "Το προϊόν ενεργοποιήθηκε.",
    activeOffToast: "Το προϊόν απενεργοποιήθηκε.",
    notFoundBackHref: "/products",
  },
} as const;

export function ProductMasterDetailPage({
  masterId,
  context,
}: ProductMasterDetailPageProps) {
  const config = CONTEXT_CONFIG[context];

  const [master, setMaster] = React.useState<MasterRow | null>(null);
  const [websiteCategories, setWebsiteCategories] = React.useState<
    WebsiteCategoryWithSubs[]
  >([]);
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [busyVariantId, setBusyVariantId] = React.useState<string | null>(null);

  const [cleanName, setCleanName] = React.useState("");
  const [category, setCategory] = React.useState("");
  const [categoryId, setCategoryId] = React.useState("");
  const [subcategory, setSubcategory] = React.useState("");
  const [qualityGrade, setQualityGrade] = React.useState("");
  const [material, setMaterial] = React.useState("");
  const [description, setDescription] = React.useState("");

  const loadMaster = React.useCallback(async () => {
    setLoading(true);

    if (context === "website") {
      const response = await fetch(`/api/website/product-masters/${masterId}`);
      const payload = (await response.json()) as {
        master?: WebsiteProductMasterRow;
        error?: string;
      };

      if (!response.ok || !payload.master) {
        toast.error(payload.error ?? "Αποτυχία φόρτωσης προϊόντος.");
        setMaster(null);
        setLoading(false);
        return;
      }

      setMaster(payload.master);
      setCleanName(payload.master.cleanName);
      setCategory(payload.master.category);
      setSubcategory(payload.master.subcategory ?? "");
      setQualityGrade(payload.master.qualityGrade ?? "");
      setMaterial(payload.master.material ?? "");
      setDescription(payload.master.description ?? "");
      setLoading(false);
      return;
    }

    const supabase = createClient();
    const { data, error } = await supabase
      .from("product_masters")
      .select(INVENTORY_PRODUCT_MASTER_DETAIL_SELECT)
      .eq("id", masterId)
      .maybeSingle();

    if (error || !data) {
      toast.error(error?.message ?? "Αποτυχία φόρτωσης προϊόντος.");
      setMaster(null);
      setLoading(false);
      return;
    }

    const mapped = mapInventoryProductMasterRow(
      data as Parameters<typeof mapInventoryProductMasterRow>[0],
    );
    setMaster(mapped);
    setCleanName(mapped.cleanName);
    setCategory(mapped.category);
    setSubcategory(mapped.subcategory ?? "");
    setQualityGrade(mapped.qualityGrade ?? "");
    setMaterial(mapped.material ?? "");
    setDescription(mapped.description ?? "");
    setLoading(false);
  }, [context, masterId]);

  React.useEffect(() => {
    void loadMaster();
  }, [loadMaster]);

  React.useEffect(() => {
    if (context !== "website") return;

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
  }, [context]);

  const matchedCategory = websiteCategories.find((item) => item.name === category);
  const subcategoryOptions = matchedCategory?.website_subcategories ?? [];

  async function handleSaveDetails(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true);

    if (context === "website") {
      const response = await fetch(`/api/website/product-masters/${masterId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cleanName,
          category,
          subcategory: subcategory || null,
          qualityGrade: qualityGrade || null,
          material: material || null,
          description: description || null,
        }),
      });

      const payload = (await response.json()) as {
        master?: WebsiteProductMasterRow;
        error?: string;
      };
      setSaving(false);

      if (!response.ok || !payload.master) {
        toast.error(payload.error ?? "Αποτυχία αποθήκευσης.");
        return;
      }

      setMaster(payload.master);
      toast.success("Οι αλλαγές αποθηκεύτηκαν.");
      return;
    }

    const supabase = createClient();
    const { data, error } = await supabase
      .from("product_masters")
      .update({
        clean_name: cleanName.trim(),
        category: category.trim(),
        subcategory: subcategory.trim() || null,
        quality_grade: qualityGrade.trim() || null,
        material: material.trim() || null,
        description: description.trim() || null,
      })
      .eq("id", masterId)
      .select(INVENTORY_PRODUCT_MASTER_DETAIL_SELECT)
      .single();

    setSaving(false);

    if (error || !data) {
      toast.error(error?.message ?? "Αποτυχία αποθήκευσης.");
      return;
    }

    const mapped = mapInventoryProductMasterRow(
      data as Parameters<typeof mapInventoryProductMasterRow>[0],
    );
    setMaster(mapped);
    toast.success("Οι αλλαγές αποθηκεύτηκαν.");
  }

  async function handleToggleActive() {
    if (!master) return;
    setSaving(true);
    const supabase = createClient();
    const result = await setMasterActive(supabase, master.id, !master.isActive);
    setSaving(false);

    if (!result.ok) {
      toast.error(result.error);
      return;
    }

    setMaster({ ...master, isActive: !master.isActive });
    toast.success(master.isActive ? config.activeOffToast : config.activeOnToast);
  }

  const websiteUrl = getWebsiteUrl();

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <Loader2 className="size-8 animate-spin text-gold-600" />
      </div>
    );
  }

  if (!master) {
    return (
      <div className="mx-auto max-w-3xl space-y-4 py-12 text-center">
        <p className="text-gray-500">Το προϊόν δεν βρέθηκε.</p>
        <Button asChild variant="outline">
          <Link href={config.notFoundBackHref}>Επιστροφή στη λίστα</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6 pb-12">
      <div className="flex flex-wrap items-center gap-3">
        <Button asChild variant="outline" className={premiumSecondaryButton}>
          <Link href={config.backHref}>
            <ArrowLeft className="size-4" />
            {config.backLabel}
          </Link>
        </Button>
        {config.showPreview ? (
          <Button asChild variant="outline" className={premiumSecondaryButton}>
            <a
              href={`${websiteUrl}/el/products/${master.id}`}
              target="_blank"
              rel="noreferrer"
            >
              <ExternalLink className="size-4" />
              Προεπισκόπηση
            </a>
          </Button>
        ) : null}
      </div>

      <PageHeader
        title={master.cleanName}
        subtitle={config.subtitle}
        action={
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-500">{config.activeLabel}</span>
            <ActiveToggle
              active={master.isActive}
              disabled={saving}
              onClick={() => void handleToggleActive()}
              label={`${config.activeLabel} ${master.cleanName}`}
            />
          </div>
        }
      />

      <Card className="border-gray-200/80 shadow-card">
        <CardHeader>
          <CardTitle className="text-lg text-navy-900">Στοιχεία προϊόντος</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={(event) => void handleSaveDetails(event)} className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="cleanName">Όνομα</Label>
                <Input
                  id="cleanName"
                  value={cleanName}
                  onChange={(event) => setCleanName(event.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="qualityGrade">Quality grade</Label>
                <Input
                  id="qualityGrade"
                  value={qualityGrade}
                  onChange={(event) => setQualityGrade(event.target.value)}
                />
              </div>
              {context === "website" ? (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="category">Κατηγορία</Label>
                    <select
                      id="category"
                      value={category}
                      onChange={(event) => {
                        setCategory(event.target.value);
                        setSubcategory("");
                      }}
                      className="flex h-10 w-full rounded-input border border-input bg-background px-3 text-sm"
                      required
                    >
                      <option value="">—</option>
                      {websiteCategories.map((item) => (
                        <option key={item.id} value={item.name}>
                          {item.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="subcategory">Υποκατηγορία</Label>
                    <select
                      id="subcategory"
                      value={subcategory}
                      onChange={(event) => setSubcategory(event.target.value)}
                      className="flex h-10 w-full rounded-input border border-input bg-background px-3 text-sm"
                      disabled={!category}
                    >
                      <option value="">—</option>
                      {subcategoryOptions.map((item) => (
                        <option key={item.id} value={item.name}>
                          {item.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </>
              ) : (
                <>
                  <ProductCategorySelect
                    value={category}
                    onChange={(name, id) => {
                      setCategory(name);
                      setCategoryId(id);
                      setSubcategory("");
                    }}
                    required
                  />
                  <ProductSubcategorySelect
                    categoryId={categoryId}
                    value={subcategory}
                    onChange={setSubcategory}
                  />
                </>
              )}
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="material">Υλικό</Label>
                <Input
                  id="material"
                  value={material}
                  onChange={(event) => setMaterial(event.target.value)}
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="description">{config.descriptionLabel}</Label>
                <textarea
                  id="description"
                  value={description}
                  onChange={(event) => setDescription(event.target.value)}
                  rows={5}
                  className={cn(
                    "flex w-full rounded-input border border-input bg-background px-3 py-2 text-sm shadow-sm",
                    "placeholder:text-muted-foreground focus-visible:border-kartex-gold/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-kartex-gold/30",
                  )}
                  placeholder={config.descriptionPlaceholder}
                />
              </div>
            </div>
            <Button type="submit" className={premiumGoldButton} disabled={saving}>
              {saving ? <Loader2 className="size-4 animate-spin" /> : null}
              Αποθήκευση στοιχείων
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card className="border-gray-200/80 shadow-card">
        <CardHeader>
          <CardTitle className="text-lg text-navy-900">Εικόνες</CardTitle>
        </CardHeader>
        <CardContent>
          <WebsiteMasterImagesEditor
            masterId={master.id}
            cleanName={master.cleanName}
            images={master.images}
            disabled={saving}
            apiBasePath={config.imagesApiBasePath}
            onChange={(images, imageUrl) =>
              setMaster((current) =>
                current ? { ...current, images, imageUrl } : current,
              )
            }
          />
        </CardContent>
      </Card>

      <Card className="border-gray-200/80 shadow-card">
        <CardHeader>
          <CardTitle className="text-lg text-navy-900">
            Παραλλαγές ({master.variants.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {context === "inventory" ? (
            <InventoryMasterVariantsPanel
              master={master as InventoryProductMasterRow}
              disabled={saving}
              onVariantsChange={(variants) =>
                setMaster((current) =>
                  current ? { ...current, variants } : current,
                )
              }
            />
          ) : (
            <WebsiteMasterVariantsPanel
              master={master as WebsiteProductMasterRow}
              disabled={saving || busyVariantId !== null}
              setBusyId={setBusyVariantId}
              variantDetailHrefPrefix={config.variantDetailHrefPrefix}
              showInternalPrice={config.showInternalPrice}
              addVariantMode={config.addVariantMode}
              onVariantsChange={(variants) =>
                setMaster((current) =>
                  current ? { ...current, variants } : current,
                )
              }
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
