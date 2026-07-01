"use client";

import { ArrowLeft, Loader2 } from "lucide-react";
import Link from "next/link";
import * as React from "react";
import { toast } from "sonner";

import { InventoryMasterVariantsPanel } from "@/components/products/inventory-master-variants-panel";
import {
  MasterGroupStatsRow,
} from "@/components/products/master-group-ui";
import {
  ProductCategorySelect,
  ProductSubcategorySelect,
} from "@/components/products/product-category-select";
import { ActiveToggle } from "@/components/website/active-toggle";
import { WebsiteMasterImagesEditor } from "@/components/website/website-master-images-editor";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PageHeader } from "@/components/ui/page-header";
import {
  countInventoryMasterStockStats,
  INVENTORY_PRODUCT_MASTER_DETAIL_SELECT,
  mapInventoryProductMasterRow,
  type InventoryProductMasterRow,
} from "@/lib/products/product-master-detail";
import { setMasterActive } from "@/lib/products/set-master-active";
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
  const [master, setMaster] = React.useState<InventoryProductMasterRow | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);

  const [cleanName, setCleanName] = React.useState("");
  const [category, setCategory] = React.useState("");
  const [categoryId, setCategoryId] = React.useState("");
  const [subcategory, setSubcategory] = React.useState("");
  const [qualityGrade, setQualityGrade] = React.useState("");
  const [material, setMaterial] = React.useState("");
  const [description, setDescription] = React.useState("");

  const loadMaster = React.useCallback(async () => {
    setLoading(true);
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
  }, [masterId]);

  React.useEffect(() => {
    void loadMaster();
  }, [loadMaster]);

  async function handleSaveDetails(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true);

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
    toast.success(
      master.isActive
        ? "Το προϊόν απενεργοποιήθηκε."
        : "Το προϊόν ενεργοποιήθηκε.",
    );
  }

  const stockStats = master
    ? countInventoryMasterStockStats(master.variants)
    : { criticalCount: 0, lowCount: 0, okCount: 0 };

  const totalStock = master?.variants.reduce((sum, variant) => sum + variant.stock, 0) ?? 0;

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
          Πίσω στα Προϊόντα
        </Link>
      </Button>

      <PageHeader
        title={master.cleanName}
        subtitle="Επισκόπηση master προϊόντος — στοιχεία, εικόνες και παραλλαγές αποθήκης."
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

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-2xl border border-gray-200/80 bg-white p-4 shadow-card">
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
            Συνολικό απόθεμα
          </p>
          <p className="mt-1 text-3xl font-bold tabular-nums text-navy-900">{totalStock}</p>
        </div>
        <div className="rounded-2xl border border-gray-200/80 bg-white p-4 shadow-card">
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
            Παραλλαγές
          </p>
          <p className="mt-1 text-3xl font-bold tabular-nums text-navy-900">
            {master.variants.length}
          </p>
        </div>
      </div>

      <MasterGroupStatsRow
        criticalCount={stockStats.criticalCount}
        lowCount={stockStats.lowCount}
        okCount={stockStats.okCount}
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
                required
              />
              <ProductSubcategorySelect
                categoryId={categoryId}
                value={subcategory}
                onChange={setSubcategory}
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
          <InventoryMasterVariantsPanel
            master={master}
            disabled={saving}
            onVariantsChange={(variants) =>
              setMaster((current) => (current ? { ...current, variants } : current))
            }
          />
        </CardContent>
      </Card>
    </div>
  );
}
