"use client";

import { Layers, Pencil, Plus, Trash2 } from "lucide-react";
import * as React from "react";
import { toast } from "sonner";

import { DataError } from "@/components/dashboard/data-error";
import { MaterialFormModal } from "@/components/settings/material-form-modal";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";
import { Skeleton } from "@/components/ui/skeleton";
import type { LookupRow } from "@/lib/settings/lookups";
import { premiumGoldButton, premiumTableHead, premiumTableRow, premiumTableWrap } from "@/lib/ui/premium-styles";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

export function MaterialsSettingsPage() {
  const [materials, setMaterials] = React.useState<LookupRow[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [fetchKey, setFetchKey] = React.useState(0);
  const [modalOpen, setModalOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<LookupRow | null>(null);
  const [busyId, setBusyId] = React.useState<string | null>(null);

  const load = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    const supabase = createClient();
    const { data, error: fetchError } = await supabase
      .from("materials")
      .select("id, name, is_active")
      .order("name", { ascending: true });

    if (fetchError) {
      setError(fetchError.message);
      setMaterials([]);
    } else {
      setMaterials(
        (data ?? []).map((row) => ({
          id: row.id as string,
          name: row.name as string,
          isActive: row.is_active as boolean,
        })),
      );
    }
    setLoading(false);
  }, []);

  React.useEffect(() => {
    void load();
  }, [load, fetchKey]);

  async function toggleActive(material: LookupRow) {
    setBusyId(material.id);
    const supabase = createClient();
    const { error: updateError } = await supabase
      .from("materials")
      .update({ is_active: !material.isActive })
      .eq("id", material.id);
    setBusyId(null);
    if (updateError) {
      toast.error(updateError.message);
      return;
    }
    setFetchKey((key) => key + 1);
  }

  async function handleDelete(material: LookupRow) {
    if (!window.confirm(`Διαγραφή υλικού «${material.name}»;`)) return;

    setBusyId(material.id);
    const supabase = createClient();

    const { count, error: countError } = await supabase
      .from("product_masters")
      .select("id", { count: "exact", head: true })
      .eq("material_id", material.id);

    if (countError) {
      setBusyId(null);
      toast.error(countError.message);
      return;
    }

    if ((count ?? 0) > 0) {
      setBusyId(null);
      toast.error("Το υλικό χρησιμοποιείται σε προϊόντα και δεν μπορεί να διαγραφεί.");
      return;
    }

    const { error: deleteError } = await supabase
      .from("materials")
      .delete()
      .eq("id", material.id);

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
        title="Υλικά"
        subtitle="Διαχείριση καταλόγου υλικών (σύνθεση υφάσματος)."
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
            Νέο Υλικό
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
                <th className="px-4 py-3">Εικονίδιο</th>
                <th className="px-4 py-3">Όνομα</th>
                <th className="px-4 py-3">Κατάσταση</th>
                <th className="px-4 py-3 text-right">Ενέργειες</th>
              </tr>
            </thead>
            <tbody>
              {materials.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 py-10 text-center text-gray-400">
                    Δεν υπάρχουν υλικά.
                  </td>
                </tr>
              ) : (
                materials.map((material) => (
                  <tr key={material.id} className={premiumTableRow}>
                    <td className="px-4 py-3">
                      <span
                        className="inline-flex size-10 items-center justify-center rounded-full border-2 border-gray-200 bg-navy-900/5 text-gold-500"
                        aria-hidden
                      >
                        <Layers className="size-5" />
                      </span>
                    </td>
                    <td className="px-4 py-3 font-medium text-navy-900">{material.name}</td>
                    <td className="px-4 py-3">
                      <button
                        type="button"
                        disabled={busyId === material.id}
                        onClick={() => void toggleActive(material)}
                        className={cn(
                          "rounded-full px-2.5 py-1 text-xs font-semibold transition-colors",
                          material.isActive
                            ? "bg-success/10 text-success"
                            : "bg-gray-100 text-gray-500",
                        )}
                      >
                        {material.isActive ? "Ενεργό" : "Ανενεργό"}
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
                            setEditing(material);
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
                          disabled={busyId === material.id}
                          onClick={() => void handleDelete(material)}
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

      <MaterialFormModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        editing={editing}
        onSaved={() => setFetchKey((key) => key + 1)}
      />
    </div>
  );
}
