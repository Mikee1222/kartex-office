"use client";

import * as React from "react";

import type { CustomerTypeOptionRow, LookupRow } from "@/lib/settings/lookups";
import {
  fetchCustomerTypeOptions,
  fetchPaymentTermOptions,
} from "@/lib/settings/lookups";
import { createClient } from "@/lib/supabase/client";

export function usePaymentTermOptions() {
  const [items, setItems] = React.useState<LookupRow[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      const supabase = createClient();
      const result = await fetchPaymentTermOptions(supabase, true);
      if (cancelled) return;
      setItems(result.items);
      setError(result.error);
      setLoading(false);
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  const names = React.useMemo(() => items.map((item) => item.name), [items]);
  return { items, names, loading, error };
}

export function useCustomerTypeOptions() {
  const [items, setItems] = React.useState<CustomerTypeOptionRow[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      const supabase = createClient();
      const result = await fetchCustomerTypeOptions(supabase, true);
      if (cancelled) return;
      setItems(result.items);
      setError(result.error);
      setLoading(false);
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  function labelForDbKey(dbKey: string): string {
    const match = items.find((item) => item.dbKey === dbKey);
    if (match) return match.label;
    return dbKey;
  }

  function dbKeyForLabel(label: string): CustomerTypeOptionRow["dbKey"] | null {
    const match = items.find((item) => item.label === label);
    return match?.dbKey ?? null;
  }

  return { items, loading, error, labelForDbKey, dbKeyForLabel };
}
