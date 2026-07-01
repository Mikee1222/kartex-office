"use client";

import { ArrowLeft, ExternalLink, Loader2 } from "lucide-react";
import Link from "next/link";
import * as React from "react";
import { toast } from "sonner";

import { WebsiteMasterImagesEditor } from "@/components/website/website-master-images-editor";
import { WebsiteMasterVariantsTable } from "@/components/website/website-master-variants-table";
import { ActiveToggle } from "@/components/website/active-toggle";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PageHeader } from "@/components/ui/page-header";
import { setMasterActive } from "@/lib/products/set-master-active";
import type { WebsiteProductMasterRow } from "@/lib/website/types";
import { getWebsiteUrl } from "@/lib/website/site-url";
import {
  premiumGoldButton,
  premiumSecondaryButton,
} from "@/lib/ui/premium-styles";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

type WebsiteCategoryWithSubs = {
  id: string;
  name: string;
  website_subcategories: { id: string; name: string }[];
};

type WebsiteProductEditPageProps = {
  masterId: string;
};

export function WebsiteProductEditPage({ masterId }: WebsiteProductEditPageProps) {
  const [master, setMaster] = React.useState<WebsiteProductMasterRow | null>(null);
  const [websiteCategories, setWebsiteCategories] = React.useState<
    WebsiteCategoryWithSubs[]
  >([]);
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [busyVariantId, setBusyVariantId] = React.useState<string | null>(null);

  const [cleanName, setCleanName] = React.useState("");
  const [category, setCategory] = React.useState("");
  const [subcategory, setSubcategory] = React.useState("");
  const [qualityGrade, setQualityGrade] = React.useState("");
  const [material, setMaterial] = React.useState("");
  const [description, setDescription] = React.useState("");

  const loadMaster = React.useCallback(async () => {
    setLoading(true);
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
  }, [masterId]);

  React.useEffect(() => {
    void loadMaster();
  }, [loadMaster]);

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

  const matchedCategory = websiteCategories.find((item) => item.name === category);
  const subcategoryOptions = matchedCategory?.website_subcategories ?? [];

  async function handleSaveDetails(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true);

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
    toast.success(
      master.isActive
        ? "Το προϊόν αφαιρέθηκε από τον κατάλογο."
        : "Το προϊόν εμφανίζεται στον κατάλογο.",
    );
  }

  async function handleInternalPriceSave(
    variantId: string,
    value: number | null,
  ): Promise<boolean> {
    setBusyVariantId(variantId);
    const supabase = createClient();
    const { error } = await supabase
      .from("products")
      .update({ internal_price_eur: value })
      .eq("id", variantId);
    setBusyVariantId(null);

    if (error) {
      toast.error(error.message);
      return false;
    }

    setMaster((current) => {
      if (!current) return current;
      return {
        ...current,
        variants: current.variants.map((variant) =>
          variant.id === variantId
            ? { ...variant, internalPriceEur: value }
            : variant,
        ),
      };
    });
    toast.success("Εσωτερική τιμή αποθηκεύτηκε");
    return true;
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
          <Link href="/website/products">Επιστροφή στη λίστα</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6 pb-12">
      <div className="flex flex-wrap items-center gap-3">
        <Button asChild variant="outline" className={premiumSecondaryButton}>
          <Link href="/website/products">
            <ArrowLeft className="size-4" />
            Πίσω
          </Link>
        </Button>
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
      </div>

      <PageHeader
        title={master.cleanName}
        subtitle="Επεξεργασία περιεχομένου website για product master."
        action={
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-500">Ενεργό στο website</span>
            <ActiveToggle
              active={master.isActive}
              disabled={saving}
              onClick={() => void handleToggleActive()}
              label={`Ενεργό ${master.cleanName}`}
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
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="material">Υλικό</Label>
                <Input
                  id="material"
                  value={material}
                  onChange={(event) => setMaterial(event.target.value)}
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="description">Περιγραφή (website)</Label>
                <textarea
                  id="description"
                  value={description}
                  onChange={(event) => setDescription(event.target.value)}
                  rows={5}
                  className={cn(
                    "flex w-full rounded-input border border-input bg-background px-3 py-2 text-sm shadow-sm",
                    "placeholder:text-muted-foreground focus-visible:border-kartex-gold/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-kartex-gold/30",
                  )}
                  placeholder="Σύντομο marketing κείμενο για τη σελίδα προϊόντος…"
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
          <WebsiteMasterVariantsTable
            variants={master.variants}
            isBusy={busyVariantId !== null}
            onInternalPriceSave={handleInternalPriceSave}
          />
        </CardContent>
      </Card>
    </div>
  );
}
