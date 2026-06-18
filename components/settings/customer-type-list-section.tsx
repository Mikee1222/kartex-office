"use client";

import { Loader2, Pencil, Plus, Trash2 } from "lucide-react";
import * as React from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import type { CustomerTypeOptionRow } from "@/lib/settings/lookups";
import {
  deleteCustomerTypeOption,
  insertCustomerTypeOption,
  toggleLookupActive,
  updateCustomerTypeLabel,
} from "@/lib/settings/lookups";
import { premiumSelect } from "@/lib/ui/form-styles";
import { premiumTableHead, premiumTableRow, premiumTableWrap } from "@/lib/ui/premium-styles";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

const DB_KEY_OPTIONS: { value: CustomerTypeOptionRow["dbKey"]; label: string }[] = [
  { value: "hospital", label: "hospital (Νοσοκομείο)" },
  { value: "hotel", label: "hotel (Ξενοδοχείο)" },
  { value: "walk-in", label: "walk-in" },
];

type CustomerTypeListSectionProps = {
  items: CustomerTypeOptionRow[];
  loading: boolean;
  error: string | null;
  onRefresh: () => void;
};

export function CustomerTypeListSection({
  items,
  loading,
  error,
  onRefresh,
}: CustomerTypeListSectionProps) {
  const [adding, setAdding] = React.useState(false);
  const [newLabel, setNewLabel] = React.useState("");
  const [newDbKey, setNewDbKey] = React.useState<CustomerTypeOptionRow["dbKey"]>("hospital");
  const [editingId, setEditingId] = React.useState<string | null>(null);
  const [editLabel, setEditLabel] = React.useState("");
  const [busyId, setBusyId] = React.useState<string | null>(null);
  const [localError, setLocalError] = React.useState<string | null>(null);

  async function handleAdd() {
    setBusyId("add");
    setLocalError(null);
    const supabase = createClient();
    const { error: insertError } = await insertCustomerTypeOption(
      supabase,
      newLabel,
      newDbKey,
    );
    setBusyId(null);

    if (insertError) {
      setLocalError(insertError);
      return;
    }

    setNewLabel("");
    setAdding(false);
    onRefresh();
  }

  async function handleSaveEdit(id: string) {
    setBusyId(id);
    setLocalError(null);
    const supabase = createClient();
    const { error: updateError } = await updateCustomerTypeLabel(supabase, id, editLabel);
    setBusyId(null);

    if (updateError) {
      setLocalError(updateError);
      return;
    }

    setEditingId(null);
    onRefresh();
  }

  async function handleToggle(item: CustomerTypeOptionRow) {
    setBusyId(item.id);
    const supabase = createClient();
    const { error: updateError } = await toggleLookupActive(
      supabase,
      "customer_type_options",
      item.id,
      !item.isActive,
    );
    setBusyId(null);
    if (updateError) {
      toast.error(updateError);
      return;
    }
    onRefresh();
  }

  async function handleDelete(item: CustomerTypeOptionRow) {
    if (!window.confirm(`Διαγραφή τύπου «${item.label}»;`)) return;

    setBusyId(item.id);
    const supabase = createClient();
    const { error: deleteError } = await deleteCustomerTypeOption(supabase, item.id);
    setBusyId(null);

    if (deleteError) {
      toast.error(deleteError);
      return;
    }
    onRefresh();
  }

  return (
    <Card className={premiumTableWrap}>
      <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-3">
        <div>
          <CardTitle className="text-lg text-navy-900">Τύποι Πελατών</CardTitle>
          <p className="mt-1 text-sm text-muted-foreground">
            Ετικέτες εμφάνισης (νοσοκομεία, ξενοδοχεία, walk-in). Το db_key πρέπει να
            ταιριάζει με τον πίνακα πελατών.
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setAdding((current) => !current)}
        >
          <Plus className="size-4" />
          Προσθήκη
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        {error || localError ? (
          <p className="text-sm text-destructive" role="alert">
            {error ?? localError}
          </p>
        ) : null}

        {adding ? (
          <div className="flex flex-wrap items-end gap-2">
            <Input
              value={newLabel}
              onChange={(event) => setNewLabel(event.target.value)}
              placeholder="Ετικέτα (π.χ. Νοσοκομείο)"
              className="max-w-xs"
            />
            <select
              value={newDbKey}
              onChange={(event) =>
                setNewDbKey(event.target.value as CustomerTypeOptionRow["dbKey"])
              }
              className={premiumSelect}
            >
              {DB_KEY_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <Button
              type="button"
              size="sm"
              disabled={busyId === "add" || !newLabel.trim()}
              onClick={() => void handleAdd()}
            >
              Αποθήκευση
            </Button>
            <Button type="button" size="sm" variant="ghost" onClick={() => setAdding(false)}>
              Άκυρο
            </Button>
          </div>
        ) : null}

        {loading ? (
          <div className="flex items-center gap-2 py-6 text-sm text-gray-400">
            <Loader2 className="size-4 animate-spin" />
            Φόρτωση…
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className={premiumTableHead}>
                  <th className="px-3 py-2 text-left">Ετικέτα</th>
                  <th className="px-3 py-2 text-left font-mono text-xs">db_key</th>
                  <th className="px-3 py-2 text-left">Κατάσταση</th>
                  <th className="px-3 py-2 text-right">Ενέργειες</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr key={item.id} className={premiumTableRow}>
                    <td className="px-3 py-2">
                      {editingId === item.id ? (
                        <div className="flex items-center gap-2">
                          <Input
                            value={editLabel}
                            onChange={(event) => setEditLabel(event.target.value)}
                            className="max-w-xs"
                          />
                          <Button
                            type="button"
                            size="sm"
                            disabled={busyId === item.id}
                            onClick={() => void handleSaveEdit(item.id)}
                          >
                            OK
                          </Button>
                        </div>
                      ) : (
                        <span
                          className={cn(
                            "font-medium",
                            !item.isActive && "text-muted-foreground line-through",
                          )}
                        >
                          {item.label}
                        </span>
                      )}
                    </td>
                    <td className="px-3 py-2 font-mono text-xs text-muted-foreground">
                      {item.dbKey}
                    </td>
                    <td className="px-3 py-2">
                      <button
                        type="button"
                        disabled={busyId === item.id}
                        onClick={() => void handleToggle(item)}
                        className={cn(
                          "rounded-full px-2 py-0.5 text-xs font-semibold",
                          item.isActive
                            ? "bg-success/10 text-success"
                            : "bg-gray-100 text-gray-500",
                        )}
                      >
                        {item.isActive ? "Ενεργό" : "Ανενεργό"}
                      </button>
                    </td>
                    <td className="px-3 py-2 text-right">
                      <div className="inline-flex gap-1">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          disabled={busyId === item.id}
                          onClick={() => {
                            setEditingId(item.id);
                            setEditLabel(item.label);
                          }}
                        >
                          <Pencil className="size-4" />
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          disabled={busyId === item.id}
                          onClick={() => void handleDelete(item)}
                        >
                          <Trash2 className="size-4 text-destructive" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
