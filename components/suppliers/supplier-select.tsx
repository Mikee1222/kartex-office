"use client";

import { Loader2, Plus } from "lucide-react";
import * as React from "react";

import { SupplierFormModal } from "@/components/suppliers/supplier-form-modal";
import { FormFieldLabel } from "@/components/ui/form-field-label";
import { Button } from "@/components/ui/button";
import { FIELD_TOOLTIPS } from "@/lib/forms/field-tooltips";
import { fetchSuppliers, type SupplierRow } from "@/lib/settings/suppliers";
import { premiumSelect } from "@/lib/ui/form-styles";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

type SupplierSelectProps = {
  value: string;
  onChange: (supplierId: string, supplierName: string) => void;
  disabled?: boolean;
  label?: string;
  tooltip?: string;
  /** Match legacy text supplier on edit when supplier_id is missing. */
  legacySupplierName?: string;
  fieldClassName?: string;
  labelClassName?: string;
  selectClassName?: string;
};

export function SupplierSelect({
  value,
  onChange,
  disabled = false,
  label = "Προμηθευτής",
  tooltip = FIELD_TOOLTIPS.supplier,
  legacySupplierName,
  fieldClassName = "space-y-2",
  labelClassName,
  selectClassName,
}: SupplierSelectProps) {
  const [suppliers, setSuppliers] = React.useState<SupplierRow[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [modalOpen, setModalOpen] = React.useState(false);

  const load = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    const supabase = createClient();
    const result = await fetchSuppliers(supabase, true);
    setSuppliers(result.items);
    setError(result.error);
    setLoading(false);
  }, []);

  React.useEffect(() => {
    void load();
  }, [load]);

  React.useEffect(() => {
    if (loading || value || !legacySupplierName?.trim()) return;
    const match = suppliers.find(
      (s) => s.name.toLowerCase() === legacySupplierName.trim().toLowerCase(),
    );
    if (match) {
      onChange(match.id, match.name);
    }
  }, [loading, value, legacySupplierName, suppliers, onChange]);

  const options = suppliers;

  return (
    <>
      <div className={fieldClassName}>
        <FormFieldLabel tooltip={tooltip} labelClassName={labelClassName}>
          {label}
        </FormFieldLabel>

        {loading ? (
          <div className="flex items-center gap-2 text-sm text-gray-400">
            <Loader2 className="size-4 animate-spin" aria-hidden />
            Φόρτωση προμηθευτών…
          </div>
        ) : null}

        {error ? (
          <p className="text-sm text-destructive" role="alert">
            {error}
          </p>
        ) : null}

        {!loading ? (
          <div className="flex flex-wrap items-start gap-2">
            <select
              value={value}
              disabled={disabled || options.length === 0}
              onChange={(event) => {
                const id = event.target.value;
                const supplier = suppliers.find((s) => s.id === id);
                onChange(id, supplier?.name ?? "");
              }}
              className={cn(selectClassName ?? premiumSelect, "min-w-[200px] flex-1")}
            >
              {!value ? <option value="">Επιλέξτε προμηθευτή…</option> : null}
              {options.map((supplier) => (
                <option key={supplier.id} value={supplier.id}>
                  {supplier.name}
                </option>
              ))}
            </select>
            <Button
              type="button"
              variant="outline"
              size="icon"
              disabled={disabled}
              onClick={() => setModalOpen(true)}
              aria-label="Νέος προμηθευτής"
            >
              <Plus className="size-4" />
            </Button>
          </div>
        ) : null}
      </div>

      <SupplierFormModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        onSaved={(supplier) => {
          void load();
          onChange(supplier.id, supplier.name);
        }}
      />
    </>
  );
}
