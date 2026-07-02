"use client";

import { FormFieldLabel } from "@/components/ui/form-field-label";
import { FIELD_TOOLTIPS } from "@/lib/forms/field-tooltips";
import {
  CUSTOMER_SOURCE_OPTIONS,
  type CustomerSource,
} from "@/components/customers/types";
import { premiumSelect } from "@/lib/ui/form-styles";
import { cn } from "@/lib/utils";

type CustomerSourceSelectProps = {
  id?: string;
  value: CustomerSource;
  onChange: (value: CustomerSource) => void;
  disabled?: boolean;
  required?: boolean;
  label?: string;
  className?: string;
  tooltip?: string;
};

export function CustomerSourceSelect({
  id = "customer-source",
  value,
  onChange,
  disabled = false,
  required = false,
  label = "Πηγή",
  className,
  tooltip = FIELD_TOOLTIPS.customerSource,
}: CustomerSourceSelectProps) {
  return (
    <div className={cn("space-y-2", className)}>
      <FormFieldLabel htmlFor={id} required={required} tooltip={tooltip}>
        {label}
      </FormFieldLabel>
      <select
        id={id}
        value={value}
        disabled={disabled}
        required={required}
        onChange={(event) => onChange(event.target.value as CustomerSource)}
        className={premiumSelect}
      >
        {CUSTOMER_SOURCE_OPTIONS.map((option) => (
          <option key={option.value} value={option.label}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}
