"use client";

import { Package } from "lucide-react";

import { FormFieldLabel } from "@/components/ui/form-field-label";
import { Input } from "@/components/ui/input";
import { FIELD_TOOLTIPS } from "@/lib/forms/field-tooltips";
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

const masterSectionClass =
  "space-y-6 rounded-2xl border-2 border-gold-500/40 bg-gradient-to-br from-white to-gold-500/[0.03] p-8 shadow-card";

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
      <section className={masterSectionClass}>
        <div className="flex items-center gap-2.5">
          <div className="flex size-9 items-center justify-center rounded-xl bg-gold-500/15">
            <Package className="size-5 text-gold-500" aria-hidden />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-navy-900">Master Προϊόν</h2>
            <p className="text-sm text-gray-500">Συνδεδεμένο master προϊόν</p>
          </div>
        </div>
        <p className="text-base font-medium text-navy-900">
          {readOnlyLabel ?? (cleanName || "—")}
        </p>
      </section>
    );
  }

  const existingMaster = masters.find((master) => master.id === selectedMaster);

  return (
    <section className={masterSectionClass}>
      <div className="flex items-center gap-2.5">
        <div className="flex size-9 items-center justify-center rounded-xl bg-gold-500/15">
          <Package className="size-5 text-gold-500" aria-hidden />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-navy-900">Master Προϊόν</h2>
          <p className="text-sm text-gray-500">
            Σε ποιο προϊόν ανήκει αυτή η παραλλαγή; π.χ. όλες οι πετσέτες GIZA
            ανήκουν στο master &apos;Πετσέτα Giza&apos;
          </p>
        </div>
      </div>

      <div className="space-y-4">
        <div className={productFormField}>
          <FormFieldLabel
            htmlFor="product-master-select"
            required
            labelClassName={productFormLabel}
          >
            Master προϊόν
          </FormFieldLabel>
          <select
            id="product-master-select"
            value={selectedMaster}
            disabled={disabled}
            onChange={(event) => onSelectedMasterChange(event.target.value)}
            className={productFormSelect}
          >
            <option value="">
              {disabled ? "Φόρτωση masters…" : "Επιλέξτε ή δημιουργήστε νέο…"}
            </option>
            {masters.length > 0 ? (
              <optgroup label="— Υπάρχοντα —">
                {masters.map((master) => (
                  <option key={master.id} value={master.id}>
                    {master.clean_name} ({master.category})
                  </option>
                ))}
              </optgroup>
            ) : null}
            <option value="new">+ Νέο master προϊόν</option>
          </select>
        </div>

        {selectedMaster === "new" ? (
          <div className={productFormField}>
            <FormFieldLabel
              htmlFor="new-master-name"
              required
              tooltip={FIELD_TOOLTIPS.cleanName}
              labelClassName={productFormLabel}
            >
              Clean name (master)
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
