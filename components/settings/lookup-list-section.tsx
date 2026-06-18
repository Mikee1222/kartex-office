"use client";

import { Loader2, Pencil, Plus, Trash2 } from "lucide-react";
import * as React from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import type { LookupRow } from "@/lib/settings/lookups";
import {
  deleteSimpleLookupRow,
  insertMaterial,
  insertPaymentTermOption,
  insertProductCategory,
  insertQualityGrade,
  toggleSimpleLookupActive,
  updateSimpleLookupName,
} from "@/lib/settings/lookups";
import { premiumTableHead, premiumTableRow, premiumTableWrap } from "@/lib/ui/premium-styles";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

type LookupTable =
  | "product_categories"
  | "payment_term_options"
  | "materials"
  | "quality_grades";

type LookupListSectionProps = {
  title: string;
  description?: string;
  table: LookupTable;
  items: LookupRow[];
  loading: boolean;
  error: string | null;
  onRefresh: () => void;
};

export function LookupListSection({
  title,
  description,
  table,
  items,
  loading,
  error,
  onRefresh,
}: LookupListSectionProps) {
  const [adding, setAdding] = React.useState(false);
  const [newName, setNewName] = React.useState("");
  const [editingId, setEditingId] = React.useState<string | null>(null);
  const [editName, setEditName] = React.useState("");
  const [busyId, setBusyId] = React.useState<string | null>(null);
  const [localError, setLocalError] = React.useState<string | null>(null);

  async function handleAdd() {
    const trimmed = newName.trim();
    if (!trimmed) return;

    setBusyId("add");
    setLocalError(null);
    const supabase = createClient();
    const result =
      table === "product_categories"
        ? await insertProductCategory(supabase, trimmed)
        : table === "payment_term_options"
          ? await insertPaymentTermOption(supabase, trimmed)
          : table === "materials"
            ? await insertMaterial(supabase, trimmed)
            : await insertQualityGrade(supabase, trimmed);

    setBusyId(null);
    if (result.error) {
      setLocalError(result.error);
      return;
    }

    setNewName("");
    setAdding(false);
    onRefresh();
  }

  async function handleSaveEdit(id: string) {
    setBusyId(id);
    setLocalError(null);
    const supabase = createClient();
    const { error: updateError } = await updateSimpleLookupName(
      supabase,
      table,
      id,
      editName,
    );
    setBusyId(null);

    if (updateError) {
      setLocalError(updateError);
      return;
    }

    setEditingId(null);
    onRefresh();
  }

  async function handleToggle(item: LookupRow) {
    setBusyId(item.id);
    const supabase = createClient();
    const { error: updateError } = await toggleSimpleLookupActive(
      supabase,
      table,
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

  async function handleDelete(item: LookupRow) {
    if (!window.confirm(`Διαγραφή «${item.name}»;`)) return;

    setBusyId(item.id);
    const supabase = createClient();
    const { error: deleteError } = await deleteSimpleLookupRow(supabase, table, item.id);
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
          <CardTitle className="text-lg text-navy-900">{title}</CardTitle>
          {description ? (
            <p className="mt-1 text-sm text-muted-foreground">{description}</p>
          ) : null}
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
          <div className="flex flex-wrap items-center gap-2">
            <Input
              value={newName}
              onChange={(event) => setNewName(event.target.value)}
              placeholder="Νέα τιμή"
              className="max-w-xs"
            />
            <Button
              type="button"
              size="sm"
              disabled={busyId === "add" || !newName.trim()}
              onClick={() => void handleAdd()}
            >
              {busyId === "add" ? "Αποθήκευση…" : "Αποθήκευση"}
            </Button>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              onClick={() => {
                setAdding(false);
                setNewName("");
              }}
            >
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
                  <th className="px-3 py-2 text-left">Τιμή</th>
                  <th className="px-3 py-2 text-left">Κατάσταση</th>
                  <th className="px-3 py-2 text-right">Ενέργειες</th>
                </tr>
              </thead>
              <tbody>
                {items.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="px-3 py-8 text-center text-muted-foreground">
                      Δεν υπάρχουν εγγραφές.
                    </td>
                  </tr>
                ) : (
                  items.map((item) => (
                    <tr key={item.id} className={premiumTableRow}>
                      <td className="px-3 py-2">
                        {editingId === item.id ? (
                          <div className="flex items-center gap-2">
                            <Input
                              value={editName}
                              onChange={(event) => setEditName(event.target.value)}
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
                            <Button
                              type="button"
                              size="sm"
                              variant="ghost"
                              onClick={() => setEditingId(null)}
                            >
                              Άκυρο
                            </Button>
                          </div>
                        ) : (
                          <span
                            className={cn(
                              "font-medium",
                              !item.isActive && "text-muted-foreground line-through",
                            )}
                          >
                            {item.name}
                          </span>
                        )}
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
                              setEditName(item.name);
                            }}
                            aria-label="Επεξεργασία"
                          >
                            <Pencil className="size-4" />
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            disabled={busyId === item.id}
                            onClick={() => void handleDelete(item)}
                            aria-label="Διαγραφή"
                          >
                            <Trash2 className="size-4 text-destructive" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
