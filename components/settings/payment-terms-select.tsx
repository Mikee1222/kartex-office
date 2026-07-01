"use client";

import { Loader2 } from "lucide-react";
import * as React from "react";

import { FormFieldLabel } from "@/components/ui/form-field-label";
import { FIELD_TOOLTIPS } from "@/lib/forms/field-tooltips";
import { usePaymentTermOptions } from "@/lib/settings/use-lookup-options";
import { premiumSelect } from "@/lib/ui/form-styles";
import { cn } from "@/lib/utils";

type PaymentTermsSelectProps = {
  id?: string;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  label?: string;
  className?: string;
  /** Include a legacy value not in the active list (edit forms). */
  extraOption?: string | null;
  tooltip?: string;
};

export function PaymentTermsSelect({
  id = "payment-terms",
  value,
  onChange,
  disabled = false,
  label = "Όροι Πληρωμής",
  className,
  extraOption,
  tooltip = FIELD_TOOLTIPS.paymentTerms,
}: PaymentTermsSelectProps) {
  const { names, loading, error } = usePaymentTermOptions();

  const options = React.useMemo(() => {
    const base = [...names];
    if (extraOption?.trim() && !base.includes(extraOption.trim())) {
      base.unshift(extraOption.trim());
    }
    return base;
  }, [names, extraOption]);

  React.useEffect(() => {
    if (loading || options.length === 0) return;
    if (!value || !options.includes(value)) {
      onChange(options[0] ?? "");
    }
  }, [loading, options, value, onChange]);

  return (
    <div className={cn("space-y-2", className)}>
      <FormFieldLabel htmlFor={id} tooltip={tooltip}>
        {label}
      </FormFieldLabel>

      {loading ? (
        <div className="flex items-center gap-2 text-sm text-gray-400" role="status">
          <Loader2 className="size-4 animate-spin" aria-hidden />
          Φόρτωση όρων πληρωμής…
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
          onChange={(event) => onChange(event.target.value)}
          className={premiumSelect}
        >
          {options.length === 0 ? (
            <option value="">Δεν υπάρχουν επιλογές</option>
          ) : (
            options.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))
          )}
        </select>
      ) : null}
    </div>
  );
}
