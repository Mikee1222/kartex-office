"use client";

import { Loader2, Plus } from "lucide-react";
import * as React from "react";

import { FormFieldLabel } from "@/components/ui/form-field-label";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { premiumSelect } from "@/lib/ui/form-styles";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

type LookupNameSelectProps = {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  label: string;
  required?: boolean;
  tooltip?: string;
  placeholder?: string;
  addPlaceholder?: string;
  loadOptions: (
    supabase: ReturnType<typeof createClient>,
    activeOnly: boolean,
  ) => Promise<{ items: { name: string }[]; error: string | null }>;
  insertOption: (
    supabase: ReturnType<typeof createClient>,
    name: string,
  ) => Promise<{ item: { name: string } | null; error: string | null }>;
  fieldClassName?: string;
  labelClassName?: string;
  selectClassName?: string;
  inputClassName?: string;
};

export function LookupNameSelect({
  value,
  onChange,
  disabled = false,
  label,
  required = false,
  tooltip,
  placeholder = "Επιλέξτε…",
  addPlaceholder = "Νέα τιμή",
  loadOptions,
  insertOption,
  fieldClassName = "space-y-2",
  labelClassName,
  selectClassName,
  inputClassName,
}: LookupNameSelectProps) {
  const [options, setOptions] = React.useState<string[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [adding, setAdding] = React.useState(false);
  const [newName, setNewName] = React.useState("");
  const [saving, setSaving] = React.useState(false);

  const load = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    const supabase = createClient();
    const result = await loadOptions(supabase, true);
    if (result.error) {
      setError(result.error);
      setOptions([]);
    } else {
      setOptions(result.items.map((item) => item.name));
    }
    setLoading(false);
  }, [loadOptions]);

  React.useEffect(() => {
    void load();
  }, [load]);

  async function handleAdd() {
    const trimmed = newName.trim();
    if (!trimmed) return;

    setSaving(true);
    const supabase = createClient();
    const { item, error: insertError } = await insertOption(supabase, trimmed);
    setSaving(false);

    if (insertError) {
      setError(insertError);
      return;
    }

    setNewName("");
    setAdding(false);
    await load();
    if (item) onChange(item.name);
  }

  const selectOptions =
    value && !options.includes(value) ? [...options, value] : options;

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
            onChange={(event) => onChange(event.target.value)}
            className={cn(selectClassName ?? premiumSelect, "min-w-[160px] flex-1")}
          >
            {selectOptions.length === 0 ? (
              <option value="">Δεν υπάρχουν επιλογές</option>
            ) : (
              <>
                {!value ? <option value="">{placeholder}</option> : null}
                {selectOptions.map((name) => (
                  <option key={name} value={name}>
                    {name}
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
            aria-label={`Νέο ${label.toLowerCase()}`}
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
            placeholder={addPlaceholder}
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
