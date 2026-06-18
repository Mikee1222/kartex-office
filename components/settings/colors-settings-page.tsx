"use client";

import { Pencil, Plus, Trash2 } from "lucide-react";
import * as React from "react";
import { toast } from "sonner";

import { ColorFormModal } from "@/components/settings/color-form-modal";
import { DataError } from "@/components/dashboard/data-error";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";
import { Skeleton } from "@/components/ui/skeleton";
import { mapProductColor } from "@/lib/products/color-variants";
import type { ProductColor } from "@/lib/products/types";
import { premiumGoldButton, premiumTableHead, premiumTableRow, premiumTableWrap } from "@/lib/ui/premium-styles";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

export function ColorsSettingsPage() {
  const [colors, setColors] = React.useState<ProductColor[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [fetchKey, setFetchKey] = React.useState(0);
  const [modalOpen, setModalOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<ProductColor | null>(null);
  const [busyId, setBusyId] = React.useState<string | null>(null);

  const load = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    const supabase = createClient();
    const { data, error: fetchError } = await supabase
      .from("product_colors")
      .select("id, name, hex_code, is_active")
      .order("name", { ascending: true });

    if (fetchError) {
      setError(fetchError.message);
      setColors([]);
    } else {
      setColors(
        (data ?? []).map((row) =>
          mapProductColor(row as { id: string; name: string; hex_code: string; is_active: boolean }),
        ),
      );
    }
    setLoading(false);
  }, []);

  React.useEffect(() => {
    void load();
  }, [load, fetchKey]);

  async function toggleActive(color: ProductColor) {
    setBusyId(color.id);
    const supabase = createClient();
    const { error: updateError } = await supabase
      .from("product_colors")
      .update({ is_active: !color.isActive })
      .eq("id", color.id);
    setBusyId(null);
    if (updateError) {
      toast.error(updateError.message);
      return;
    }
    setFetchKey((key) => key + 1);
  }

  async function handleDelete(color: ProductColor) {
    if (!window.confirm(`Διαγραφή χρώματος «${color.name}»;`)) return;

    setBusyId(color.id);
    const supabase = createClient();

    const { count, error: countError } = await supabase
      .from("product_color_variants")
      .select("id", { count: "exact", head: true })
      .eq("color_id", color.id)
      .eq("is_active", true);

    if (countError) {
      setBusyId(null);
      toast.error(countError.message);
      return;
    }

    if ((count ?? 0) > 0) {
      setBusyId(null);
      toast.error("Το χρώμα χρησιμοποιείται σε προϊόντα και δεν μπορεί να διαγραφεί.");
      return;
    }

    const { error: deleteError } = await supabase
      .from("product_colors")
      .delete()
      .eq("id", color.id);

    setBusyId(null);
    if (deleteError) {
      toast.error(deleteError.message);
      return;
    }
    setFetchKey((key) => key + 1);
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <PageHeader
        title="Χρώματα"
        subtitle="Διαχείριση χρωμάτων προϊόντων."
        action={
          <Button
            type="button"
            className={premiumGoldButton}
            onClick={() => {
              setEditing(null);
              setModalOpen(true);
            }}
          >
            <Plus className="size-4" />
            Νέο Χρώμα
          </Button>
        }
      />

      {error ? <DataError message={error} onRetry={() => setFetchKey((k) => k + 1)} /> : null}

      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 4 }).map((_, index) => (
            <Skeleton key={index} className="h-14 w-full" />
          ))}
        </div>
      ) : !error ? (
        <div className={premiumTableWrap}>
          <table className="w-full text-sm">
            <thead>
              <tr className={premiumTableHead}>
                <th className="px-4 py-3">Χρώμα</th>
                <th className="px-4 py-3">Όνομα</th>
                <th className="px-4 py-3">Hex</th>
                <th className="px-4 py-3">Κατάσταση</th>
                <th className="px-4 py-3 text-right">Ενέργειες</th>
              </tr>
            </thead>
            <tbody>
              {colors.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-10 text-center text-gray-400">
                    Δεν υπάρχουν χρώματα.
                  </td>
                </tr>
              ) : (
                colors.map((color) => (
                  <tr key={color.id} className={premiumTableRow}>
                    <td className="px-4 py-3">
                      <span
                        className="inline-block size-10 rounded-full border-2 border-gray-200 shadow-sm"
                        style={{ backgroundColor: color.hexCode }}
                        aria-hidden
                      />
                    </td>
                    <td className="px-4 py-3 font-medium text-navy-900">{color.name}</td>
                    <td className="px-4 py-3 font-mono text-xs text-gray-600">
                      {color.hexCode}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        type="button"
                        disabled={busyId === color.id}
                        onClick={() => void toggleActive(color)}
                        className={cn(
                          "rounded-full px-2.5 py-1 text-xs font-semibold transition-colors",
                          color.isActive
                            ? "bg-success/10 text-success"
                            : "bg-gray-100 text-gray-500",
                        )}
                      >
                        {color.isActive ? "Ενεργό" : "Ανενεργό"}
                      </button>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-1">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          aria-label="Επεξεργασία"
                          onClick={() => {
                            setEditing(color);
                            setModalOpen(true);
                          }}
                        >
                          <Pencil className="size-4" />
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="text-destructive"
                          aria-label="Διαγραφή"
                          disabled={busyId === color.id}
                          onClick={() => void handleDelete(color)}
                        >
                          <Trash2 className="size-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      ) : null}

      <ColorFormModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        editing={editing}
        onSaved={() => setFetchKey((key) => key + 1)}
      />
    </div>
  );
}
