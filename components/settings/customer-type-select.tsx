"use client";

import { Loader2 } from "lucide-react";
import * as React from "react";

import { FormFieldLabel } from "@/components/ui/form-field-label";
import { FIELD_TOOLTIPS } from "@/lib/forms/field-tooltips";
import { useCustomerTypeOptions } from "@/lib/settings/use-lookup-options";
import { premiumSelect } from "@/lib/ui/form-styles";
import { cn } from "@/lib/utils";

type CustomerTypeSelectProps = {
  id?: string;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  required?: boolean;
  label?: string;
  className?: string;
  extraOption?: string | null;
  tooltip?: string;
};

export function CustomerTypeSelect({
  id = "customer-type",
  value,
  onChange,
  disabled = false,
  required = false,
  label = "Τύπος",
  className,
  extraOption,
  tooltip = FIELD_TOOLTIPS.customerType,
}: CustomerTypeSelectProps) {
  const { items, loading, error } = useCustomerTypeOptions();

  const options = React.useMemo(() => {
    const labels = items.filter((item) => item.isActive).map((item) => item.label);
    if (extraOption?.trim() && !labels.includes(extraOption.trim())) {
      return [extraOption.trim(), ...labels];
    }
    return labels;
  }, [items, extraOption]);

  return (
    <div className={cn("space-y-2", className)}>
      <FormFieldLabel htmlFor={id} required={required} tooltip={tooltip}>
        {label}
      </FormFieldLabel>

      {loading ? (
        <div className="flex items-center gap-2 text-sm text-gray-400" role="status">
          <Loader2 className="size-4 animate-spin" aria-hidden />
          Φόρτωση τύπων πελάτη…
        </div>
      ) : null}

      {error ? (
        <p className="text-sm text-destructive" role="alert">
          Αποτυχία φόρτωσης: {error}
        </p>
      ) : null}

      {!loading && !error ? (
        <select
          id={id}
          value={value}
          disabled={disabled || options.length === 0}
          required={required}
          onChange={(event) => onChange(event.target.value)}
          className={premiumSelect}
        >
          {!value ? <option value="">Επιλέξτε τύπο…</option> : null}
          {options.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      ) : null}
    </div>
  );
}
