"use client";

import { FormFieldLabel } from "@/components/ui/form-field-label";
import { Input } from "@/components/ui/input";
import { LookupNameSelect } from "@/components/settings/lookup-name-select";
import {
  fetchMaterials,
  insertMaterial,
  fetchQualityGrades,
  insertQualityGrade,
} from "@/lib/settings/lookups";
import { FIELD_TOOLTIPS } from "@/lib/forms/field-tooltips";
import {
  productFormField,
  productFormInput,
  productFormLabel,
  productFormSection,
  productFormSectionTitle,
  productFormSelect,
} from "@/lib/ui/product-form-styles";

type ProductFormDimensionsSectionProps = {
  value: {
    widthCm: string;
    heightCm: string;
    weightKg: string;
  };
  material: string;
  qualityGrade: string;
  onChange: (value: {
    widthCm: string;
    heightCm: string;
    weightKg: string;
  }) => void;
  onMaterialChange: (value: string) => void;
  onQualityChange: (value: string) => void;
  disabled?: boolean;
};

export type ProductDimensionsFormState = {
  widthCm: string;
  heightCm: string;
  weightKg: string;
};

export function ProductFormDimensionsSection({
  value,
  material,
  qualityGrade,
  onChange,
  onMaterialChange,
  onQualityChange,
  disabled = false,
}: ProductFormDimensionsSectionProps) {
  return (
    <section className={productFormSection}>
      <h2 className={productFormSectionTitle}>Διαστάσεις</h2>
      <div className="grid grid-cols-2 gap-6 sm:grid-cols-3 xl:grid-cols-5">
        <div className={productFormField}>
          <FormFieldLabel
            htmlFor="width-cm"
            tooltip={FIELD_TOOLTIPS.width}
            labelClassName={productFormLabel}
          >
            Πλάτος (cm)
          </FormFieldLabel>
          <Input
            id="width-cm"
            type="number"
            min={0}
            step={0.1}
            disabled={disabled}
            value={value.widthCm}
            onChange={(event) => onChange({ ...value, widthCm: event.target.value })}
            className={productFormInput}
          />
        </div>
        <div className={productFormField}>
          <FormFieldLabel
            htmlFor="height-cm"
            tooltip={FIELD_TOOLTIPS.height}
            labelClassName={productFormLabel}
          >
            Ύψος (cm)
          </FormFieldLabel>
          <Input
            id="height-cm"
            type="number"
            min={0}
            step={0.1}
            disabled={disabled}
            value={value.heightCm}
            onChange={(event) => onChange({ ...value, heightCm: event.target.value })}
            className={productFormInput}
          />
        </div>
        <div className={productFormField}>
          <FormFieldLabel
            htmlFor="weight-kg"
            tooltip={FIELD_TOOLTIPS.weight}
            labelClassName={productFormLabel}
          >
            Βάρος (kg)
          </FormFieldLabel>
          <Input
            id="weight-kg"
            type="number"
            min={0}
            step={0.001}
            disabled={disabled}
            value={value.weightKg}
            onChange={(event) => onChange({ ...value, weightKg: event.target.value })}
            className={productFormInput}
          />
        </div>
        <LookupNameSelect
          label="Υλικό"
          tooltip={FIELD_TOOLTIPS.material}
          value={material}
          onChange={onMaterialChange}
          disabled={disabled}
          placeholder="Επιλέξτε υλικό…"
          addPlaceholder="Νέο υλικό"
          loadOptions={fetchMaterials}
          insertOption={insertMaterial}
          fieldClassName={productFormField}
          labelClassName={productFormLabel}
          selectClassName={productFormSelect}
          inputClassName={productFormInput}
        />
        <LookupNameSelect
          label="Ποιότητα"
          tooltip={FIELD_TOOLTIPS.quality}
          value={qualityGrade}
          onChange={onQualityChange}
          disabled={disabled}
          placeholder="Επιλέξτε ποιότητα…"
          addPlaceholder="Νέα ποιότητα"
          loadOptions={fetchQualityGrades}
          insertOption={insertQualityGrade}
          fieldClassName={productFormField}
          labelClassName={productFormLabel}
          selectClassName={productFormSelect}
          inputClassName={productFormInput}
        />
      </div>
    </section>
  );
}
