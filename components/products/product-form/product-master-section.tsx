"use client";

import { Package } from "lucide-react";

import { FormFieldLabel } from "@/components/ui/form-field-label";
import { Input } from "@/components/ui/input";
import type { ProductMasterRow } from "@/lib/products/product-masters";
import {
  productFormField,
  productFormInput,
  productFormLabel,
  productFormSelect,
} from "@/lib/ui/product-form-styles";
import { cn } from "@/lib/utils";

type ProductMasterSectionProps = {
  masters: ProductMasterRow[];
  selectedMaster: string;
  newMasterName: string;
  cleanName: string;
  onSelectedMasterChange: (value: string) => void;
  onNewMasterNameChange: (value: string) => void;
  onCleanNameChange: (value: string) => void;
  disabled?: boolean;
  readOnly?: boolean;
  readOnlyLabel?: string;
};

export function ProductMasterSection({
  masters,
  selectedMaster,
  newMasterName,
  cleanName,
  onSelectedMasterChange,
  onNewMasterNameChange,
  onCleanNameChange,
  disabled = false,
  readOnly = false,
  readOnlyLabel,
}: ProductMasterSectionProps) {
  if (readOnly) {
    return (
      <section className="rounded-2xl border border-kartex-gold/20 bg-kartex-gold/5 p-5">
        <h3 className="mb-3 flex items-center gap-2 text-sm font-bold text-kartex-navy">
          <Package size={16} className="text-kartex-gold" aria-hidden />
          Τύπος Προϊόντος
        </h3>
        <p className="text-sm text-muted-foreground">
          {readOnlyLabel ?? (cleanName || "—")}
        </p>
      </section>
    );
  }

  const existingMaster = masters.find((master) => master.id === selectedMaster);

  return (
    <section className="rounded-2xl border border-kartex-gold/20 bg-kartex-gold/5 p-5">
      <h3 className="mb-3 flex items-center gap-2 text-sm font-bold text-kartex-navy">
        <Package size={16} className="text-kartex-gold" aria-hidden />
        Κατηγορία Προϊόντος
      </h3>

      <div className="space-y-3">
        <div className={productFormField}>
          <FormFieldLabel
            htmlFor="product-master-select"
            required
            labelClassName={productFormLabel}
          >
            Τύπος προϊόντος
          </FormFieldLabel>
          <select
            id="product-master-select"
            value={selectedMaster}
            disabled={disabled}
            onChange={(event) => onSelectedMasterChange(event.target.value)}
            className={cn(productFormSelect, "bg-background")}
          >
            <option value="">Επιλέξτε ή δημιουργήστε νέο…</option>
            {masters.length > 0 ? (
              <optgroup label="— Υπάρχοντα —">
                {masters.map((master) => (
                  <option key={master.id} value={master.id}>
                    {master.clean_name} ({master.category})
                  </option>
                ))}
              </optgroup>
            ) : null}
            <option value="new">+ Νέος τύπος προϊόντος</option>
          </select>
        </div>

        {selectedMaster === "new" ? (
          <div className={productFormField}>
            <FormFieldLabel
              htmlFor="new-master-name"
              required
              labelClassName={productFormLabel}
            >
              Όνομα νέου τύπου
            </FormFieldLabel>
            <Input
              id="new-master-name"
              value={newMasterName}
              disabled={disabled}
              onChange={(event) => onNewMasterNameChange(event.target.value)}
              placeholder="π.χ. Πετσέτα Cleopatra"
              className={productFormInput}
            />
          </div>
        ) : null}

        {selectedMaster && selectedMaster !== "new" && existingMaster ? (
          <div className={productFormField}>
            <FormFieldLabel htmlFor="clean-name" labelClassName={productFormLabel}>
              Clean name (master)
            </FormFieldLabel>
            <Input
              id="clean-name"
              value={cleanName}
              readOnly
              disabled
              onChange={(event) => onCleanNameChange(event.target.value)}
              className={cn(productFormInput, "bg-muted/40")}
            />
          </div>
        ) : null}
      </div>
    </section>
  );
}
