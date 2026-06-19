"use client";

import { CheckCircle2, Loader2, Wand2, XCircle } from "lucide-react";
import * as React from "react";

import { BarcodePreview } from "@/components/products/product-form/barcode-preview";
import { useIdentifierUniqueness } from "@/components/products/product-form/use-identifier-uniqueness";
import { FormFieldLabel } from "@/components/ui/form-field-label";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FIELD_TOOLTIPS } from "@/lib/forms/field-tooltips";
import {
  checkProductFieldUnique,
  generateBarcode,
  generateSku,
  suggestSku,
} from "@/lib/products/identifiers";
import {
  productFormField,
  productFormInput,
  productFormLabel,
} from "@/lib/ui/product-form-styles";
import { cn } from "@/lib/utils";

type ProductSkuFieldProps = {
  value: string;
  onChange: (value: string) => void;
  category: string;
  material: string;
  widthCm: string;
  heightCm: string;
  productId?: string;
  disabled?: boolean;
  onManualEdit?: () => void;
};

function IdentifierStatus({
  status,
  uniqueLabel = "Διαθέσιμο",
  takenLabel = "Χρησιμοποιείται ήδη",
}: {
  status: "idle" | "checking" | "unique" | "taken";
  uniqueLabel?: string;
  takenLabel?: string;
}) {
  if (status === "checking") {
    return (
      <p className="flex items-center gap-1.5 text-xs text-gray-500">
        <Loader2 className="size-3.5 animate-spin" aria-hidden />
        Έλεγχος…
      </p>
    );
  }

  if (status === "unique") {
    return (
      <p className="flex items-center gap-1.5 text-xs text-emerald-600">
        <CheckCircle2 className="size-3.5 shrink-0" aria-hidden />
        {uniqueLabel}
      </p>
    );
  }

  if (status === "taken") {
    return (
      <p className="flex items-center gap-1.5 text-xs text-destructive">
        <XCircle className="size-3.5 shrink-0" aria-hidden />
        {takenLabel}
      </p>
    );
  }

  return null;
}

export function ProductSkuField({
  value,
  onChange,
  category,
  material,
  widthCm,
  heightCm,
  productId,
  disabled = false,
  onManualEdit,
}: ProductSkuFieldProps) {
  const { status, checkOnBlur } = useIdentifierUniqueness("sku", value, productId);

  const suggestion = React.useMemo(
    () =>
      suggestSku({
        category,
        material,
        widthCm,
        heightCm,
      }),
    [category, material, widthCm, heightCm],
  );

  const showSuggestion = Boolean(suggestion) && suggestion !== value.trim();

  async function handleAutoGenerate() {
    for (let attempt = 0; attempt < 8; attempt++) {
      const next = generateSku({ category, material, widthCm, heightCm });
      const unique = await checkProductFieldUnique("sku", next, productId);
      onChange(next);
      if (unique) {
        void checkOnBlur(next);
        return;
      }
    }
    const fallback = generateSku({ category, material, widthCm, heightCm });
    onChange(fallback);
    void checkOnBlur(fallback);
  }

  return (
    <div className={productFormField}>
      <FormFieldLabel
        htmlFor="sku"
        required
        tooltip={FIELD_TOOLTIPS.sku}
        labelClassName={productFormLabel}
      >
        SKU
      </FormFieldLabel>
      <div className="flex gap-2">
        <Input
          id="sku"
          value={value}
          disabled={disabled}
          onChange={(event) => {
            onManualEdit?.();
            onChange(event.target.value);
          }}
          onBlur={() => void checkOnBlur()}
          className={cn(productFormInput, "min-w-0 flex-1")}
          required
        />
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={disabled}
          onClick={() => void handleAutoGenerate()}
          className="h-11 shrink-0 gap-1.5 px-3"
        >
          <Wand2 className="size-4" aria-hidden />
          Αυτόματο
        </Button>
      </div>
      {showSuggestion ? (
        <div className="flex flex-wrap items-center gap-2 text-xs text-gray-500">
          <span>
            Πιθανό SKU:{" "}
            <span className="font-mono text-gray-600">{suggestion}</span>
          </span>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            disabled={disabled}
            className="h-7 px-2 text-xs text-gold-600 hover:text-gold-700"
            onClick={() => {
              onChange(suggestion);
              void checkOnBlur(suggestion);
            }}
          >
            Χρήση αυτού
          </Button>
        </div>
      ) : null}
      <IdentifierStatus
        status={status}
        takenLabel="Υπάρχει ήδη"
      />
    </div>
  );
}

type ProductBarcodeFieldProps = {
  value: string;
  onChange: (value: string) => void;
  productId?: string;
  disabled?: boolean;
  onManualEdit?: () => void;
};

export function ProductBarcodeField({
  value,
  onChange,
  productId,
  disabled = false,
  onManualEdit,
}: ProductBarcodeFieldProps) {
  const { status, checkOnBlur } = useIdentifierUniqueness(
    "barcode",
    value,
    productId,
  );

  async function handleAutoGenerate() {
    for (let attempt = 0; attempt < 8; attempt++) {
      const next = generateBarcode();
      const unique = await checkProductFieldUnique("barcode", next, productId);
      onChange(next);
      if (unique) {
        void checkOnBlur(next);
        return;
      }
    }
    const fallback = generateBarcode();
    onChange(fallback);
    void checkOnBlur(fallback);
  }

  return (
    <div className={productFormField}>
      <FormFieldLabel
        htmlFor="barcode"
        tooltip={FIELD_TOOLTIPS.barcode}
        labelClassName={productFormLabel}
      >
        Barcode
      </FormFieldLabel>
      <div className="flex gap-2">
        <Input
          id="barcode"
          value={value}
          disabled={disabled}
          onChange={(event) => {
            onManualEdit?.();
            onChange(event.target.value);
          }}
          onBlur={() => void checkOnBlur()}
          className={cn(productFormInput, "min-w-0 flex-1 font-mono")}
          inputMode="numeric"
          pattern="\d*"
        />
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={disabled}
          onClick={() => void handleAutoGenerate()}
          className="h-11 shrink-0 gap-1.5 px-3"
        >
          <Wand2 className="size-4" aria-hidden />
          Αυτόματο
        </Button>
      </div>
      {value.trim() ? <BarcodePreview value={value} className="mt-1" /> : null}
      <IdentifierStatus status={status} />
    </div>
  );
}
