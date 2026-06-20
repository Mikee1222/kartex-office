"use client";

import { Loader2 } from "lucide-react";
import * as React from "react";

import { FormFieldLabel } from "@/components/ui/form-field-label";
import { FIELD_TOOLTIPS } from "@/lib/forms/field-tooltips";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

export type WebsiteCategoryOption = {
  id: string;
  name: string;
};

export type WebsiteSubcategoryOption = {
  id: string;
  name: string;
};

type ProductCategorySelectProps = {
  value: string;
  onChange: (name: string, categoryId: string) => void;
  disabled?: boolean;
  label?: string;
  required?: boolean;
  fieldClassName?: string;
  labelClassName?: string;
  selectClassName?: string;
  onCategoriesLoaded?: (categories: WebsiteCategoryOption[]) => void;
};

export function ProductCategorySelect({
  value,
  onChange,
  disabled = false,
  label = "Κατηγορία",
  required = false,
  fieldClassName = "space-y-2",
  labelClassName,
  selectClassName,
  onCategoriesLoaded,
}: ProductCategorySelectProps) {
  const [categories, setCategories] = React.useState<WebsiteCategoryOption[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);
      const supabase = createClient();
      const { data, error: fetchError } = await supabase
        .from("website_categories")
        .select("id, name")
        .eq("is_active", true)
        .order("sort_order", { ascending: true });

      if (cancelled) return;

      if (fetchError) {
        setError(fetchError.message);
        setCategories([]);
      } else {
        const items = (data ?? []).map((row) => ({
          id: row.id as string,
          name: row.name as string,
        }));
        setCategories(items);
        onCategoriesLoaded?.(items);
      }
      setLoading(false);
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [onCategoriesLoaded]);

  const selectedId =
    categories.find((item) => item.name === value)?.id ??
    (value ? "" : "");

  return (
    <div className={fieldClassName}>
      <FormFieldLabel
        required={required}
        tooltip={FIELD_TOOLTIPS.category}
        labelClassName={labelClassName}
      >
        {label}
      </FormFieldLabel>

      {loading ? (
        <div className="flex items-center gap-2 text-sm text-gray-400">
          <Loader2 className="size-4 animate-spin" aria-hidden />
          Φόρτωση κατηγοριών…
        </div>
      ) : null}

      {error ? (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : null}

      {!loading ? (
        <select
          value={selectedId}
          disabled={disabled || categories.length === 0}
          onChange={(event) => {
            const category = categories.find((item) => item.id === event.target.value);
            if (category) {
              onChange(category.name, category.id);
            }
          }}
          className={cn(selectClassName, "w-full")}
        >
          <option value="">
            {categories.length === 0 ? "Δεν υπάρχουν κατηγορίες" : "Επιλέξτε κατηγορία…"}
          </option>
          {categories.map((item) => (
            <option key={item.id} value={item.id}>
              {item.name}
            </option>
          ))}
        </select>
      ) : null}
    </div>
  );
}

type ProductSubcategorySelectProps = {
  categoryId: string;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  fieldClassName?: string;
  labelClassName?: string;
  selectClassName?: string;
};

export function ProductSubcategorySelect({
  categoryId,
  value,
  onChange,
  disabled = false,
  fieldClassName = "space-y-2",
  labelClassName,
  selectClassName,
}: ProductSubcategorySelectProps) {
  const [subcategories, setSubcategories] = React.useState<WebsiteSubcategoryOption[]>([]);
  const [loading, setLoading] = React.useState(false);

  React.useEffect(() => {
    if (!categoryId) {
      setSubcategories([]);
      return;
    }

    let cancelled = false;

    async function load() {
      setLoading(true);
      const supabase = createClient();
      const { data } = await supabase
        .from("website_subcategories")
        .select("id, name")
        .eq("category_id", categoryId)
        .eq("is_active", true)
        .order("sort_order", { ascending: true });

      if (cancelled) return;

      setSubcategories(
        (data ?? []).map((row) => ({
          id: row.id as string,
          name: row.name as string,
        })),
      );
      setLoading(false);
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [categoryId]);

  if (!categoryId || (!loading && subcategories.length === 0)) {
    return null;
  }

  const selectedId = subcategories.find((item) => item.name === value)?.id ?? "";

  return (
    <div className={fieldClassName}>
      <FormFieldLabel
        htmlFor="product-subcategory"
        tooltip={FIELD_TOOLTIPS.subcategory}
        labelClassName={labelClassName}
      >
        Υποκατηγορία
      </FormFieldLabel>
      {loading ? (
        <div className="flex items-center gap-2 text-sm text-gray-400">
          <Loader2 className="size-4 animate-spin" aria-hidden />
          Φόρτωση…
        </div>
      ) : (
        <select
          id="product-subcategory"
          value={selectedId}
          disabled={disabled}
          onChange={(event) => {
            const subcategory = subcategories.find((item) => item.id === event.target.value);
            onChange(subcategory?.name ?? "");
          }}
          className={cn(selectClassName, "w-full")}
        >
          <option value="">Επιλέξτε υποκατηγορία…</option>
          {subcategories.map((item) => (
            <option key={item.id} value={item.id}>
              {item.name}
            </option>
          ))}
        </select>
      )}
    </div>
  );
}
