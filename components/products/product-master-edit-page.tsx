"use client";

import { ArrowLeft, Loader2 } from "lucide-react";
import Link from "next/link";
import * as React from "react";
import { toast } from "sonner";

import {
  ProductCategorySelect,
  ProductSubcategorySelect,
} from "@/components/products/product-category-select";
import { ProductsMasterVariantsPanel } from "@/components/products/products-master-variants-panel";
import { ActiveToggle } from "@/components/website/active-toggle";
import { WebsiteMasterImagesEditor } from "@/components/website/website-master-images-editor";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PageHeader } from "@/components/ui/page-header";
import {
  fetchProductMasterDetail,
  updateProductMasterDetail,
} from "@/lib/products/fetch-product-master-detail";
import { setMasterActive } from "@/lib/products/set-master-active";
import type { WebsiteProductMasterRow } from "@/lib/website/types";
import {
  premiumGoldButton,
  premiumSecondaryButton,
} from "@/lib/ui/premium-styles";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

type ProductMasterEditPageProps = {
  masterId: string;
};

export function ProductMasterEditPage({ masterId }: ProductMasterEditPageProps) {
  const [master, setMaster] = React.useState<WebsiteProductMasterRow | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [categoryId, setCategoryId] = React.useState("");

  const [cleanName, setCleanName] = React.useState("");
  const [category, setCategory] = React.useState("");
  const [subcategory, setSubcategory] = React.useState("");
  const [qualityGrade, setQualityGrade] = React.useState("");
  const [material, setMaterial] = React.useState("");
  const [description, setDescription] = React.useState("");

  const loadMaster = React.useCallback(async () => {
    setLoading(true);
    const supabase = createClient();
    const result = await fetchProductMasterDetail(supabase, masterId);

    if (result.error || !result.master) {
      toast.error(result.error ?? "Αποτυχία φόρτωσης προϊόντος.");
      setMaster(null);
      setLoading(false);
      return;
    }

    setMaster(result.master);
    setCleanName(result.master.cleanName);
    setCategory(result.master.category);
    setSubcategory(result.master.subcategory ?? "");
    setQualityGrade(result.master.qualityGrade ?? "");
    setMaterial(result.master.material ?? "");
    setDescription(result.master.description ?? "");
    setLoading(false);
  }, [masterId]);

  React.useEffect(() => {
    void loadMaster();
  }, [loadMaster]);

  React.useEffect(() => {
    if (!category || categoryId) return;

    async function resolveCategoryId() {
      const supabase = createClient();
      const { data } = await supabase
        .from("website_categories")
        .select("id")
        .eq("name", category)
        .eq("is_active", true)
        .maybeSingle();
      if (data?.id) {
        setCategoryId(data.id as string);
      }
    }

    void resolveCategoryId();
  }, [category, categoryId]);

  async function handleSaveDetails(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true);

    const supabase = createClient();
    const result = await updateProductMasterDetail(supabase, masterId, {
      cleanName,
      category,
      subcategory: subcategory || null,
      qualityGrade: qualityGrade || null,
      material: material || null,
      description: description || null,
    });
    setSaving(false);

    if (result.error || !result.master) {
      toast.error(result.error ?? "Αποτυχία αποθήκευσης.");
      return;
    }

    setMaster(result.master);
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
        ? "Το προϊόν απενεργοποιήθηκε."
        : "Το προϊόν ενεργοποιήθηκε.",
    );
  }

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
          <Link href="/products">Επιστροφή στη λίστα</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6 pb-12">
      <Button asChild variant="outline" className={premiumSecondaryButton}>
        <Link href="/products">
          <ArrowLeft className="size-4" />
          Πίσω
        </Link>
      </Button>

      <PageHeader
        title={master.cleanName}
        subtitle="Διαχείριση master προϊόντος — στοιχεία, εικόνες και παραλλαγές."
        action={
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-500">Ενεργό</span>
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
              <ProductCategorySelect
                value={category}
                onChange={(name, id) => {
                  setCategory(name);
                  setCategoryId(id);
                  setSubcategory("");
                }}
                onCategoriesLoaded={(categories) => {
                  const match = categories.find((item) => item.name === category);
                  if (match) setCategoryId(match.id);
                }}
                disabled={saving}
                selectClassName="flex h-10 w-full rounded-input border border-input bg-background px-3 text-sm"
              />
              <ProductSubcategorySelect
                categoryId={categoryId}
                value={subcategory}
                onChange={setSubcategory}
                disabled={saving}
                selectClassName="flex h-10 w-full rounded-input border border-input bg-background px-3 text-sm"
              />
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="material">Υλικό</Label>
                <Input
                  id="material"
                  value={material}
                  onChange={(event) => setMaterial(event.target.value)}
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="description">Περιγραφή</Label>
                <textarea
                  id="description"
                  value={description}
                  onChange={(event) => setDescription(event.target.value)}
                  rows={5}
                  className={cn(
                    "flex w-full rounded-input border border-input bg-background px-3 py-2 text-sm shadow-sm",
                    "placeholder:text-muted-foreground focus-visible:border-kartex-gold/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-kartex-gold/30",
                  )}
                  placeholder="Περιγραφή προϊόντος…"
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
            apiBasePath="/api/products/product-masters"
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
          <ProductsMasterVariantsPanel
            master={master}
            disabled={saving}
            onVariantsChange={(variants) =>
              setMaster((current) =>
                current ? { ...current, variants } : current,
              )
            }
          />
        </CardContent>
      </Card>
    </div>
  );
}
