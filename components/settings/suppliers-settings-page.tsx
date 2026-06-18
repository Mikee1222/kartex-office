"use client";

import { Loader2, Pencil, Plus, Trash2 } from "lucide-react";
import * as React from "react";
import { toast } from "sonner";

import { SupplierFormModal } from "@/components/suppliers/supplier-form-modal";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import {
  deleteSupplier,
  fetchSuppliers,
  toggleSupplierActive,
  type SupplierRow,
} from "@/lib/settings/suppliers";
import { premiumGoldButton, premiumTableHead, premiumTableRow, premiumTableWrap } from "@/lib/ui/premium-styles";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

export function SuppliersSettingsPage() {
  const [items, setItems] = React.useState<SupplierRow[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [busyId, setBusyId] = React.useState<string | null>(null);
  const [modalOpen, setModalOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<SupplierRow | null>(null);

  const load = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    const supabase = createClient();
    const result = await fetchSuppliers(supabase, false);
    setItems(result.items);
    setError(result.error);
    setLoading(false);
  }, []);

  React.useEffect(() => {
    void load();
  }, [load]);

  async function handleToggle(item: SupplierRow) {
    setBusyId(item.id);
    const supabase = createClient();
    const { error: updateError } = await toggleSupplierActive(
      supabase,
      item.id,
      !item.isActive,
    );
    setBusyId(null);
    if (updateError) {
      toast.error(updateError);
      return;
    }
    void load();
  }

  async function handleDelete(item: SupplierRow) {
    if (!window.confirm(`Διαγραφή προμηθευτή «${item.name}»;`)) return;
    setBusyId(item.id);
    const supabase = createClient();
    const { error: deleteError } = await deleteSupplier(supabase, item.id);
    setBusyId(null);
    if (deleteError) {
      toast.error(deleteError);
      return;
    }
    void load();
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <PageHeader
        title="Προμηθευτές"
        subtitle="Διαχείριση προμηθευτών και στοιχείων επικοινωνίας."
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
            Νέος Προμηθευτής
          </Button>
        }
      />

      <Card className={premiumTableWrap}>
        <CardHeader>
          <CardTitle className="text-lg text-navy-900">Λίστα προμηθευτών</CardTitle>
        </CardHeader>
        <CardContent>
          {error ? <p className="mb-4 text-sm text-destructive">{error}</p> : null}

          {loading ? (
            <div className="flex items-center gap-2 py-8 text-sm text-gray-400">
              <Loader2 className="size-4 animate-spin" />
              Φόρτωση…
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[720px] text-sm">
                <thead>
                  <tr className={premiumTableHead}>
                    <th className="px-3 py-2 text-left">Όνομα</th>
                    <th className="px-3 py-2 text-left">Επικοινωνία</th>
                    <th className="px-3 py-2 text-left">Περιοχή</th>
                    <th className="px-3 py-2 text-left">Κατάσταση</th>
                    <th className="px-3 py-2 text-right">Ενέργειες</th>
                  </tr>
                </thead>
                <tbody>
                  {items.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-3 py-8 text-center text-muted-foreground">
                        Δεν υπάρχουν προμηθευτές.
                      </td>
                    </tr>
                  ) : (
                    items.map((item) => (
                      <tr key={item.id} className={premiumTableRow}>
                        <td className="px-3 py-2 font-medium text-navy-900">{item.name}</td>
                        <td className="px-3 py-2 text-muted-foreground">
                          <div>{item.phone?.trim() || "—"}</div>
                          <div className="text-xs">{item.email?.trim() || ""}</div>
                        </td>
                        <td className="px-3 py-2 text-muted-foreground">
                          {[item.region, item.country].filter(Boolean).join(", ") || "—"}
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
                            {item.isActive ? "Ενεργός" : "Ανενεργός"}
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
                                setEditing(item);
                                setModalOpen(true);
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

      <SupplierFormModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        initial={editing}
        onSaved={() => {
          void load();
        }}
      />
    </div>
  );
}
