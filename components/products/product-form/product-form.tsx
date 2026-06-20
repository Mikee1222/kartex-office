"use client";

import { ArrowLeft, Wand2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import * as React from "react";

import { ProductCategorySelect } from "@/components/products/product-category-select";
import { ProductColorsStockSection } from "@/components/products/product-form/product-colors-stock-section";
import {
  ProductFormDimensionsSection,
  type ProductDimensionsFormState,
} from "@/components/products/product-form/product-form-dimensions-section";
import { ProductFormPreview } from "@/components/products/product-form/product-form-preview";
import { ProductMasterSection } from "@/components/products/product-form/product-master-section";
import {
  ProductBarcodeField,
  ProductSkuField,
} from "@/components/products/product-form/product-sku-field";
import { SupplierSelect } from "@/components/suppliers/supplier-select";
import {
  previewColorsFromFormState,
  selectionsFromFormState,
  totalStockFromFormState,
  type ProductColorsFormState,
} from "@/lib/products/color-form-state";
import { saveProductColorVariants } from "@/lib/products/color-variants";
import { MEASUREMENT_UNITS, DEFAULT_MEASUREMENT_UNIT } from "@/lib/products/constants";
import type { ProductColor } from "@/lib/products/types";
import {
  dimensionsToPayload,
  parseOptionalNumber,
  productCategoryToPayload,
} from "@/lib/products/form-utils";
import { checkProductFieldUnique } from "@/lib/products/identifiers";
import {
  ensureProductMaster,
  fetchProductMastersAsRows,
  resolveProductCleanName,
  type ProductMasterRow,
} from "@/lib/products/product-masters";
import { FIELD_TOOLTIPS } from "@/lib/forms/field-tooltips";
import { Button } from "@/components/ui/button";
import { FormFieldLabel } from "@/components/ui/form-field-label";
import { Input } from "@/components/ui/input";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import { type ProductEditInitial } from "@/types/database";
import {
  productFormField,
  productFormGrid,
  productFormInput,
  productFormLabel,
  productFormLayout,
  productFormSection,
  productFormSectionTitle,
  productFormSelect,
  productFormShell,
  productFormTextarea,
} from "@/lib/ui/product-form-styles";
import {
  premiumGoldButton,
  premiumPageSubtitle,
  premiumPageTitle,
} from "@/lib/ui/premium-styles";

type ProductFormProps = {
  mode: "new" | "edit";
  title?: string;
  subtitle?: string;
  cancelHref: string;
  successHref: string;
  productId?: string;
  initial?: ProductEditInitial;
  presetMasterId?: string | null;
};

function emptyDimensions(): ProductDimensionsFormState {
  return { widthCm: "", heightCm: "", weightKg: "" };
}

export function ProductForm({
  mode,
  title,
  subtitle,
  cancelHref,
  successHref,
  productId,
  initial,
  presetMasterId,
}: ProductFormProps) {
  const router = useRouter();
  const [error, setError] = React.useState<string | null>(null);
  const [pending, setPending] = React.useState(false);
  const [palette, setPalette] = React.useState<ProductColor[]>([]);
  const [mastersLoading, setMastersLoading] = React.useState(mode === "new");

  const [name, setName] = React.useState(initial?.name ?? "");
  const [cleanName, setCleanName] = React.useState(initial?.cleanName ?? "");
  const [masters, setMasters] = React.useState<ProductMasterRow[]>([]);
  const [selectedMaster, setSelectedMaster] = React.useState(
    presetMasterId ?? "",
  );
  const [newMasterName, setNewMasterName] = React.useState("");
  const [sku, setSku] = React.useState(initial?.sku ?? "");
  const [barcode, setBarcode] = React.useState(initial?.barcode ?? "");
  const [category, setCategory] = React.useState(initial?.category ?? "");
  const [subcategory, setSubcategory] = React.useState(initial?.subcategory ?? "");
  const [purchasePrice, setPurchasePrice] = React.useState(
    initial?.purchasePrice ?? "",
  );
  const [salePrice, setSalePrice] = React.useState(initial?.salePrice ?? "");
  const [minStock, setMinStock] = React.useState(initial?.minStock ?? "");
  const [unit, setUnit] = React.useState(initial?.unit ?? DEFAULT_MEASUREMENT_UNIT);
  const [supplierId, setSupplierId] = React.useState(initial?.supplierId ?? "");
  const [supplierName, setSupplierName] = React.useState(initial?.supplierName ?? "");
  const [material, setMaterial] = React.useState(initial?.material ?? "");
  const [qualityGrade, setQualityGrade] = React.useState(initial?.qualityGrade ?? "");
  const [description, setDescription] = React.useState(initial?.description ?? "");
  const [notes, setNotes] = React.useState(initial?.notes ?? "");
  const [dimensions, setDimensions] = React.useState<ProductDimensionsFormState>(() =>
    initial
      ? {
          widthCm: initial.widthCm,
          heightCm: initial.heightCm,
          weightKg: initial.weightKg,
        }
      : emptyDimensions(),
  );
  const [colorForm, setColorForm] = React.useState<ProductColorsFormState>({});

  const colorSelections = selectionsFromFormState(colorForm);
  const totalStock = totalStockFromFormState(colorForm);
  const previewColors = previewColorsFromFormState(colorForm, palette);

  const selectedMasterRow = React.useMemo(
    () => masters.find((item) => item.id === selectedMaster) ?? null,
    [masters, selectedMaster],
  );

  React.useEffect(() => {
    if (mode !== "new") return;

    let cancelled = false;

    async function loadMasters() {
      setMastersLoading(true);
      const supabase = createClient();
      const { data, error: fetchError } = await fetchProductMastersAsRows(supabase);
      if (cancelled) return;
      if (fetchError) {
        setError(fetchError);
      } else {
        setMasters(data);
      }
      setMastersLoading(false);
    }

    void loadMasters();
    return () => {
      cancelled = true;
    };
  }, [mode]);

  React.useEffect(() => {
    if (mode !== "new" || !selectedMaster || selectedMaster === "new") {
      return;
    }

    const master = masters.find((item) => item.id === selectedMaster);
    if (!master) return;

    setCategory(master.category);
    setCleanName(master.clean_name);
    if (master.subcategory) {
      setSubcategory(master.subcategory);
    }
    if (master.material) {
      setMaterial(master.material);
    }
    if (master.quality_grade) {
      setQualityGrade(master.quality_grade);
    }
  }, [mode, selectedMaster, masters]);

  React.useEffect(() => {
    if (mode !== "new" || selectedMaster !== "new") {
      return;
    }
    setCleanName(newMasterName);
  }, [mode, selectedMaster, newMasterName]);

  const isVariantContext =
    mode === "new" && Boolean(selectedMaster && selectedMaster !== "new");

  const PRODUCT_FORM_STEPS = [
    { num: "1", label: "Τύπος Προϊόντος" },
    { num: "2", label: "Βασικά Στοιχεία" },
    { num: "3", label: "Διαστάσεις & Specs" },
    { num: "4", label: "Χρώματα & Απόθεμα" },
  ] as const;

  function handleAutoVariantName() {
    const master = masters.find((item) => item.id === selectedMaster);
    const masterName =
      master?.clean_name ??
      ((selectedMaster === "new" ? newMasterName.trim() : cleanName.trim()) || null);
    const parts: string[] = [];
    const { widthCm, heightCm } = dimensions;
    if (widthCm.trim() && heightCm.trim()) {
      parts.push(`${widthCm.trim()}×${heightCm.trim()}cm`);
    }
    const gsmValue = /^\d+$/.test(qualityGrade.trim()) ? qualityGrade.trim() : "";
    if (gsmValue) {
      parts.push(`${gsmValue}gsm`);
    }
    const suggestion = masterName
      ? `${masterName} ${parts.join(" ")}`.trim()
      : parts.join(" ");
    if (suggestion) {
      setName(suggestion);
    }
  }

  const pageTitle =
    title ??
    (mode === "new"
      ? isVariantContext && selectedMasterRow
        ? `Νέα Παραλλαγή — ${selectedMasterRow.clean_name}`
        : isVariantContext
          ? "Νέα Παραλλαγή"
          : "Νέο Προϊόν"
      : "Επεξεργασία προϊόντος");

  const pageSubtitle =
    subtitle ??
    (mode === "new"
      ? isVariantContext
        ? "Προσθήκη νέου μεγέθους, χρώματος ή ποιότητας"
        : "Συμπληρώστε τα στοιχεία του νέου προϊόντος"
      : undefined);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!name.trim()) {
      setError("Το όνομα προϊόντος είναι υποχρεωτικό.");
      return;
    }
    if (!sku.trim()) {
      setError("Το SKU είναι υποχρεωτικό.");
      return;
    }
    if (!category.trim()) {
      setError("Η κατηγορία είναι υποχρεωτική.");
      return;
    }
    if (mode === "new" && !selectedMaster) {
      setError("Επιλέξτε ή δημιουργήστε master προϊόν.");
      return;
    }
    if (mode === "new" && selectedMaster === "new" && !newMasterName.trim()) {
      setError("Το clean name του νέου master είναι υποχρεωτικό.");
      return;
    }
    if (colorSelections.length === 0) {
      setError("Επιλέξτε τουλάχιστον ένα χρώμα με απόθεμα.");
      return;
    }

    const trimmedSku = sku.trim();
    const trimmedBarcode = barcode.trim();

    const skuUnique = await checkProductFieldUnique("sku", trimmedSku, productId);
    if (!skuUnique) {
      setError("Το SKU χρησιμοποιείται ήδη από άλλο προϊόν.");
      return;
    }

    if (trimmedBarcode) {
      const barcodeUnique = await checkProductFieldUnique(
        "barcode",
        trimmedBarcode,
        productId,
      );
      if (!barcodeUnique) {
        setError("Το barcode χρησιμοποιείται ήδη από άλλο προϊόν.");
        return;
      }
    }

    setError(null);
    setPending(true);
    const supabase = createClient();

    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session) {
      setError("Πρέπει να είστε συνδεδεμένοι για να αποθηκεύσετε προϊόν.");
      setPending(false);
      return;
    }

    let masterId: string | null = initial?.masterId || null;
    let resolvedCleanName =
      resolveProductCleanName(selectedMaster, newMasterName, cleanName, masters) ??
      (cleanName.trim() || null);

    if (mode === "new") {
      const masterResult = await ensureProductMaster(supabase, {
        selectedMaster,
        newMasterName,
        category,
        subcategory,
        qualityGrade,
        material,
        masters,
      });

      if (masterResult.error) {
        setError(masterResult.error);
        setPending(false);
        return;
      }

      masterId = masterResult.masterId;
      resolvedCleanName = masterResult.cleanName ?? resolvedCleanName;
    }

    const payload = {
      name: name.trim(),
      clean_name: resolvedCleanName,
      master_id: masterId,
      subcategory: subcategory.trim() || null,
      sku: sku.trim(),
      barcode: barcode.trim() || null,
      category: productCategoryToPayload(category),
      purchase_price: parseOptionalNumber(purchasePrice),
      sale_price: parseOptionalNumber(salePrice),
      stock: 0,
      min_stock: Math.max(0, Math.round(parseOptionalNumber(minStock))),
      supplier_id: supplierId || null,
      supplier: supplierName.trim() || null,
      description: description.trim() || null,
      notes: notes.trim() || null,
      is_active: initial?.isActive ?? true,
      ...dimensionsToPayload(dimensions, unit, material, qualityGrade),
    };

    if (mode === "new") {
      const { data, error: insertError } = await supabase
        .from("products")
        .insert(payload)
        .select()
        .single();

      if (insertError || !data) {
        setError(insertError?.message || "Αποτυχία αποθήκευσης προϊόντος.");
        setPending(false);
        return;
      }

      const { error: variantError } = await saveProductColorVariants(
        supabase,
        data.id,
        colorSelections,
      );
      if (variantError) {
        setError(variantError);
        setPending(false);
        return;
      }

      setPending(false);
      router.push(successHref);
      router.refresh();
      return;
    }

    if (!productId) {
      setError("Λείπει το αναγνωριστικό προϊόντος.");
      setPending(false);
      return;
    }

    const { error: updateError } = await supabase
      .from("products")
      .update(payload)
      .eq("id", productId);

    if (updateError) {
      setError(updateError.message || "Αποτυχία αποθήκευσης προϊόντος.");
      setPending(false);
      return;
    }

    const { error: variantError } = await saveProductColorVariants(
      supabase,
      productId,
      colorSelections,
    );

    if (variantError) {
      setError(variantError);
      setPending(false);
      return;
    }

    setPending(false);
    router.push(successHref);
    router.refresh();
  }

  return (
    <div className={productFormShell}>
      <Link
        href={cancelHref}
        className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-kartex-navy"
      >
        <ArrowLeft className="size-4" aria-hidden />
        Προϊόντα
      </Link>

      <h1 className={premiumPageTitle}>{pageTitle}</h1>
      {pageSubtitle ? <p className={premiumPageSubtitle}>{pageSubtitle}</p> : null}

      <form
        onSubmit={(event) => void handleSubmit(event)}
        className={productFormLayout}
      >
        <div className="min-w-0 space-y-8">
          {error ? (
            <p
              className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive"
              role="alert"
            >
              {error}
            </p>
          ) : null}

          <fieldset disabled={pending} className="space-y-8">
            {mode === "new" ? (
              <div className="mb-6 flex items-center gap-2">
                {PRODUCT_FORM_STEPS.map((step, index) => (
                  <React.Fragment key={step.num}>
                    <div className="flex items-center gap-2">
                      <div className="flex size-6 items-center justify-center rounded-full border border-kartex-gold/30 bg-kartex-gold/10 text-xs font-bold text-kartex-gold">
                        {step.num}
                      </div>
                      <span className="hidden text-xs font-medium text-muted-foreground sm:block">
                        {step.label}
                      </span>
                    </div>
                    {index < PRODUCT_FORM_STEPS.length - 1 ? (
                      <div className="h-px flex-1 bg-border" aria-hidden />
                    ) : null}
                  </React.Fragment>
                ))}
              </div>
            ) : null}

            {mode === "new" ? (
              <ProductMasterSection
                masters={masters}
                selectedMaster={selectedMaster}
                newMasterName={newMasterName}
                cleanName={cleanName}
                onSelectedMasterChange={setSelectedMaster}
                onNewMasterNameChange={setNewMasterName}
                onCleanNameChange={setCleanName}
                disabled={pending || mastersLoading}
              />
            ) : initial?.masterId || initial?.cleanName ? (
              <ProductMasterSection
                masters={[]}
                selectedMaster=""
                newMasterName=""
                cleanName={initial.cleanName || name}
                onSelectedMasterChange={() => undefined}
                onNewMasterNameChange={() => undefined}
                onCleanNameChange={() => undefined}
                readOnly
                readOnlyLabel={
                  initial.cleanName
                    ? `${initial.cleanName}${initial.category ? ` (${initial.category})` : ""}`
                    : undefined
                }
              />
            ) : null}

            <section className={productFormSection}>
              <h2 className={productFormSectionTitle}>Βασικές Πληροφορίες</h2>
              <div className={productFormGrid}>
                <div className={cn(productFormField, "sm:col-span-2")}>
                  <div className="flex items-center justify-between gap-2">
                    <FormFieldLabel
                      htmlFor="product-name"
                      required
                      tooltip={FIELD_TOOLTIPS.productName}
                      labelClassName={productFormLabel}
                    >
                      Περιγραφή Παραλλαγής
                    </FormFieldLabel>
                    <button
                      type="button"
                      onClick={handleAutoVariantName}
                      disabled={pending}
                      className="flex items-center gap-1 text-xs text-kartex-gold hover:underline disabled:pointer-events-none disabled:opacity-50"
                    >
                      <Wand2 size={12} aria-hidden />
                      Αυτόματη ονομασία
                    </button>
                  </div>
                  <Input
                    id="product-name"
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    className={productFormInput}
                    required
                  />
                  <p className="mt-1 text-xs text-muted-foreground">
                    π.χ. &quot;80×150 cm Λευκό&quot; ή &quot;55×75 Oxford 3 Side&quot; —
                    αυτό που ξεχωρίζει αυτή την παραλλαγή
                  </p>
                </div>
                <ProductSkuField
                  value={sku}
                  onChange={setSku}
                  category={category}
                  material={material}
                  widthCm={dimensions.widthCm}
                  heightCm={dimensions.heightCm}
                  productId={productId}
                  disabled={pending}
                />
                <ProductBarcodeField
                  value={barcode}
                  onChange={setBarcode}
                  productId={productId}
                  disabled={pending}
                />
                <div className={productFormField}>
                  <ProductCategorySelect
                    value={category}
                    onChange={setCategory}
                    disabled={pending || isVariantContext}
                    required
                    fieldClassName={productFormField}
                    labelClassName={productFormLabel}
                    selectClassName={productFormSelect}
                    inputClassName={productFormInput}
                  />
                </div>
                {selectedMaster === "new" || mode === "edit" ? (
                  <div className={productFormField}>
                    <FormFieldLabel
                      htmlFor="product-subcategory"
                      tooltip={FIELD_TOOLTIPS.subcategory}
                      labelClassName={productFormLabel}
                    >
                      Υποκατηγορία
                    </FormFieldLabel>
                    <Input
                      id="product-subcategory"
                      value={subcategory}
                      disabled={pending}
                      onChange={(event) => setSubcategory(event.target.value)}
                      className={productFormInput}
                    />
                  </div>
                ) : null}
                <div className={productFormField}>
                  <SupplierSelect
                    value={supplierId}
                    onChange={(id, supplierLabel) => {
                      setSupplierId(id);
                      setSupplierName(supplierLabel);
                    }}
                    disabled={pending}
                    legacySupplierName={initial?.supplierName}
                    fieldClassName={productFormField}
                    labelClassName={productFormLabel}
                    selectClassName={productFormSelect}
                  />
                </div>
                <div className={productFormField}>
                  <FormFieldLabel
                    htmlFor="purchase-price"
                    tooltip={FIELD_TOOLTIPS.purchasePrice}
                    labelClassName={productFormLabel}
                  >
                    Τιμή Αγοράς €
                  </FormFieldLabel>
                  <Input
                    id="purchase-price"
                    type="number"
                    min={0}
                    step={0.01}
                    value={purchasePrice}
                    onChange={(event) => setPurchasePrice(event.target.value)}
                    className={productFormInput}
                  />
                </div>
                <div className={productFormField}>
                  <FormFieldLabel
                    htmlFor="sale-price"
                    tooltip={FIELD_TOOLTIPS.salePrice}
                    labelClassName={productFormLabel}
                  >
                    Τιμή Πώλησης €
                  </FormFieldLabel>
                  <Input
                    id="sale-price"
                    type="number"
                    min={0}
                    step={0.01}
                    value={salePrice}
                    onChange={(event) => setSalePrice(event.target.value)}
                    className={productFormInput}
                  />
                </div>
                <div className={productFormField}>
                  <FormFieldLabel
                    htmlFor="min-stock"
                    tooltip={FIELD_TOOLTIPS.minStock}
                    labelClassName={productFormLabel}
                  >
                    Ελάχιστο Απόθεμα
                  </FormFieldLabel>
                  <Input
                    id="min-stock"
                    type="number"
                    min={0}
                    value={minStock}
                    onChange={(event) => setMinStock(event.target.value)}
                    className={productFormInput}
                  />
                </div>
                <div className={productFormField}>
                  <FormFieldLabel
                    htmlFor="unit"
                    tooltip={FIELD_TOOLTIPS.unit}
                    labelClassName={productFormLabel}
                  >
                    Μονάδα Μέτρησης
                  </FormFieldLabel>
                  <select
                    id="unit"
                    value={unit}
                    disabled={pending}
                    onChange={(event) => setUnit(event.target.value)}
                    className={productFormSelect}
                  >
                    {MEASUREMENT_UNITS.map((item) => (
                      <option key={item.value} value={item.value}>
                        {item.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </section>

            <ProductFormDimensionsSection
              value={dimensions}
              material={material}
              qualityGrade={qualityGrade}
              onChange={setDimensions}
              onMaterialChange={setMaterial}
              onQualityChange={setQualityGrade}
              disabled={pending}
            />

            <ProductColorsStockSection
              key={productId ?? "new"}
              value={colorForm}
              onChange={setColorForm}
              initialSelections={initial?.colorSelections}
              unit={unit}
              disabled={pending}
              onPaletteLoaded={setPalette}
            />

            <section className={productFormSection}>
              <h2 className={productFormSectionTitle}>Περιγραφή</h2>
              <div className="space-y-6">
                <div className={productFormField}>
                  <FormFieldLabel
                    htmlFor="description"
                    tooltip={FIELD_TOOLTIPS.description}
                    labelClassName={productFormLabel}
                  >
                    Περιγραφή
                  </FormFieldLabel>
                  <textarea
                    id="description"
                    value={description}
                    onChange={(event) => setDescription(event.target.value)}
                    className={productFormTextarea}
                    rows={4}
                  />
                </div>
                <div className={productFormField}>
                  <FormFieldLabel
                    htmlFor="notes"
                    tooltip={FIELD_TOOLTIPS.notes}
                    labelClassName={productFormLabel}
                  >
                    Σημειώσεις (εσωτερικές)
                  </FormFieldLabel>
                  <textarea
                    id="notes"
                    value={notes}
                    onChange={(event) => setNotes(event.target.value)}
                    className={productFormTextarea}
                    rows={3}
                  />
                </div>
              </div>
            </section>
          </fieldset>

          <div className="flex flex-col-reverse gap-3 border-t border-border pt-4 sm:flex-row sm:justify-end">
            <Button
              type="button"
              variant="outline"
              disabled={pending}
              onClick={() => router.push(cancelHref)}
            >
              Ακύρωση
            </Button>
            <Button
              type="submit"
              disabled={pending}
              className={cn(premiumGoldButton, "sm:min-w-[140px]")}
            >
              {pending ? "Αποθήκευση…" : "Αποθήκευση"}
            </Button>
          </div>
        </div>

        <ProductFormPreview
          name={name}
          sku={sku}
          category={category}
          purchasePrice={purchasePrice}
          salePrice={salePrice}
          totalStock={totalStock}
          unit={unit}
          colors={previewColors}
          className="hidden lg:block lg:w-[320px] lg:shrink-0"
        />
      </form>
    </div>
  );
}
