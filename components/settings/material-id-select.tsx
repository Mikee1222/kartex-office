"use client";

import { Loader2, Plus } from "lucide-react";
import * as React from "react";

import { FormFieldLabel } from "@/components/ui/form-field-label";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { fetchMaterials, insertMaterial, type LookupRow } from "@/lib/settings/lookups";
import { premiumSelect } from "@/lib/ui/form-styles";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

type MaterialIdSelectProps = {
  value: string;
  onChange: (materialId: string, materialName: string | null) => void;
  disabled?: boolean;
  label?: string;
  required?: boolean;
  tooltip?: string;
  placeholder?: string;
  fieldClassName?: string;
  labelClassName?: string;
  selectClassName?: string;
  inputClassName?: string;
};

export function MaterialIdSelect({
  value,
  onChange,
  disabled = false,
  label = "Υλικό",
  required = false,
  tooltip,
  placeholder = "Επιλέξτε υλικό…",
  fieldClassName = "space-y-2",
  labelClassName,
  selectClassName,
  inputClassName,
}: MaterialIdSelectProps) {
  const [options, setOptions] = React.useState<LookupRow[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [adding, setAdding] = React.useState(false);
  const [newName, setNewName] = React.useState("");
  const [saving, setSaving] = React.useState(false);

  const load = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    const supabase = createClient();
    const result = await fetchMaterials(supabase, true);
    if (result.error) {
      setError(result.error);
      setOptions([]);
    } else {
      setOptions(result.items);
    }
    setLoading(false);
  }, []);

  React.useEffect(() => {
    void load();
  }, [load]);

  async function handleAdd() {
    const trimmed = newName.trim();
    if (!trimmed) return;

    setSaving(true);
    const supabase = createClient();
    const { item, error: insertError } = await insertMaterial(supabase, trimmed);
    setSaving(false);

    if (insertError) {
      setError(insertError);
      return;
    }

    setNewName("");
    setAdding(false);
    await load();
    if (item) onChange(item.id, item.name);
  }

  const selectOptions =
    value && !options.some((option) => option.id === value)
      ? options
      : options;

  return (
    <div className={fieldClassName}>
      <FormFieldLabel required={required} tooltip={tooltip} labelClassName={labelClassName}>
        {label}
      </FormFieldLabel>

      {loading ? (
        <div className="flex items-center gap-2 text-sm text-gray-400">
          <Loader2 className="size-4 animate-spin" aria-hidden />
          Φόρτωση…
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
            disabled={disabled || selectOptions.length === 0}
            onChange={(event) => {
              const nextId = event.target.value;
              const match = selectOptions.find((option) => option.id === nextId);
              onChange(nextId, match?.name ?? null);
            }}
            className={cn(selectClassName ?? premiumSelect, "min-w-[160px] flex-1")}
          >
            {selectOptions.length === 0 ? (
              <option value="">Δεν υπάρχουν επιλογές</option>
            ) : (
              <>
                {!value ? <option value="">{placeholder}</option> : null}
                {selectOptions.map((option) => (
                  <option key={option.id} value={option.id}>
                    {option.name}
                  </option>
                ))}
              </>
            )}
          </select>
          <Button
            type="button"
            variant="outline"
            size="icon"
            disabled={disabled || adding}
            onClick={() => setAdding((current) => !current)}
            aria-label="Νέο υλικό"
          >
            <Plus className="size-4" />
          </Button>
        </div>
      ) : null}

      {adding ? (
        <div className="flex flex-wrap items-center gap-2">
          <Input
            value={newName}
            onChange={(event) => setNewName(event.target.value)}
            placeholder="Νέο υλικό"
            disabled={saving}
            className={cn("max-w-xs", inputClassName)}
          />
          <Button
            type="button"
            size="sm"
            disabled={saving || !newName.trim()}
            onClick={() => void handleAdd()}
          >
            {saving ? "Αποθήκευση…" : "Προσθήκη"}
          </Button>
          <Button
            type="button"
            size="sm"
            variant="ghost"
            disabled={saving}
            onClick={() => {
              setAdding(false);
              setNewName("");
            }}
          >
            Άκυρο
          </Button>
        </div>
      ) : null}
    </div>
  );
}
