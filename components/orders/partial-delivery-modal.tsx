"use client";

import * as React from "react";

import {
  type OrderDeliveryHistoryEntry,
  type OrderLineItem,
} from "@/components/orders/order-detail-types";
import { Button } from "@/components/ui/button";
import { Dialog, DialogBody, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { loadOrderDeliveries } from "@/lib/orders/load-deliveries";
import { submitPartialDelivery } from "@/lib/orders/submit-partial-delivery";
import { premiumGoldButton } from "@/lib/ui/premium-styles";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
type PartialDeliveryModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  orderId: string;
  isReserved: boolean;
  items: OrderLineItem[];
  onSuccess: () => void;
};

export function PartialDeliveryModal({
  open,
  onOpenChange,
  orderId,
  isReserved,
  items,
  onSuccess,
}: PartialDeliveryModalProps) {
  const pendingItems = items.filter((item) => item.quantityPending > 0);
  const pendingInitKey = pendingItems
    .map((item) => `${item.id}:${item.quantityPending}`)
    .join("|");

  const [quantities, setQuantities] = React.useState<Record<string, string>>({});
  const [notes, setNotes] = React.useState("");
  const [submitting, setSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [history, setHistory] = React.useState<OrderDeliveryHistoryEntry[]>([]);
  const [historyLoading, setHistoryLoading] = React.useState(false);

  const resetForm = React.useCallback(() => {
    setQuantities({});
    setNotes("");
    setError(null);
  }, []);

  React.useEffect(() => {
    if (!open) resetForm();
  }, [open, resetForm]);

  React.useEffect(() => {
    if (!open) return;

    const pending = items.filter((item) => item.quantityPending > 0);
    const initial: Record<string, string> = {};
    for (const item of pending) {
      initial[item.id] = "";
    }
    setQuantities(initial);

    let cancelled = false;
    setHistoryLoading(true);
    void (async () => {
      const supabase = createClient();
      const rows = await loadOrderDeliveries(supabase, orderId);
      if (!cancelled) {
        setHistory(rows);
        setHistoryLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [open, orderId, pendingInitKey]);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setSubmitting(true);

    const lines = pendingItems
      .map((item) => {
        const raw = quantities[item.id] ?? "";
        const qty = Number.parseInt(raw, 10);
        if (!Number.isFinite(qty) || qty <= 0) return null;
        return {
          orderItemId: item.id,
          productId: item.productId,
          quantity: qty,
        };
      })
      .filter((line): line is NonNullable<typeof line> => line !== null);

    const supabase = createClient();
    const result = await submitPartialDelivery(supabase, {
      orderId,
      isReserved,
      notes,
      lines,
    });

    setSubmitting(false);

    if (!result.ok) {
      setError(result.error);
      return;
    }

    onOpenChange(false);
    onSuccess();
  }

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title="Καταχώρηση Παράδοσης"
      description="Καταχωρήστε τις ποσότητες που παραδίδονται τώρα."
      className="max-w-2xl"
    >
      <form onSubmit={(event) => void handleSubmit(event)}>
        <DialogBody className="space-y-5">
          {error ? (
            <p
              className="rounded-md border border-danger/30 bg-danger/10 px-3 py-2 text-sm text-danger"
              role="alert"
            >
              {error}
            </p>
          ) : null}

          {pendingItems.length === 0 ? (
            <p className="text-sm text-[#64748B]">
              Όλα τα προϊόντα έχουν παραδοθεί πλήρως.
            </p>
          ) : (
            <ul className="space-y-4">
              {pendingItems.map((item) => (
                <li
                  key={item.id}
                  className="rounded-lg border border-border bg-[#F8F9FC]/60 p-4"
                >
                  <p className="font-semibold text-kartex-navy">{item.product}</p>
                  <dl className="mt-2 grid grid-cols-3 gap-2 text-xs text-[#64748B]">
                    <div>
                      <dt>Παραγγελία</dt>
                      <dd className="font-medium text-[#0F172A]">{item.quantity}</dd>
                    </div>
                    <div>
                      <dt>Παραδόθηκε</dt>
                      <dd className="font-medium text-[#0F172A]">
                        {item.quantityDelivered}
                      </dd>
                    </div>
                    <div>
                      <dt>Εκκρεμεί</dt>
                      <dd className="font-medium text-warning">{item.quantityPending}</dd>
                    </div>
                  </dl>
                  <div className="mt-3 space-y-1.5">
                    <Label htmlFor={`qty-${item.id}`}>Ποσότητα παράδοσης</Label>
                    <Input
                      id={`qty-${item.id}`}
                      type="number"
                      min={1}
                      max={item.quantityPending}
                      value={quantities[item.id] ?? ""}
                      onChange={(event) =>
                        setQuantities((prev) => ({
                          ...prev,
                          [item.id]: event.target.value,
                        }))
                      }
                      placeholder={`Έως ${item.quantityPending}`}
                      disabled={submitting}
                    />
                  </div>
                </li>
              ))}
            </ul>
          )}

          <div className="space-y-2">
            <Label htmlFor="delivery-notes">Σημειώσεις παράδοσης</Label>
            <textarea
              id="delivery-notes"
              rows={2}
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              disabled={submitting}
              className="flex min-h-[72px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus-visible:border-kartex-gold/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-kartex-gold/30"
              placeholder="Προαιρετικά…"
            />
          </div>

          <section className="border-t border-border pt-4">
            <h3 className="text-sm font-bold text-kartex-navy">Ιστορικό παραδόσεων</h3>
            {historyLoading ? (
              <p className="mt-2 text-sm text-[#64748B]">Φόρτωση…</p>
            ) : history.length === 0 ? (
              <p className="mt-2 text-sm text-[#64748B]">
                Δεν υπάρχουν προηγούμενες παραδόσεις.
              </p>
            ) : (
              <ul className="mt-3 space-y-3">
                {history.map((entry) => (
                  <li
                    key={entry.id}
                    className="rounded-md border border-border/80 bg-white px-3 py-2 text-sm"
                  >
                    <p className="font-medium text-kartex-navy">{entry.createdAt}</p>
                    {entry.notes ? (
                      <p className="mt-1 text-[#64748B]">{entry.notes}</p>
                    ) : null}
                    <ul className="mt-2 space-y-0.5 text-[#64748B]">
                      {entry.items.map((line, index) => (
                        <li key={`${entry.id}-${index}`}>
                          {line.productName} × {line.quantity}
                        </li>
                      ))}
                    </ul>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </DialogBody>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={submitting}
          >
            Ακύρωση
          </Button>
          <Button
            type="submit"
            className={cn(premiumGoldButton)}
            disabled={submitting || pendingItems.length === 0}
          >
            {submitting ? "Αποθήκευση…" : "Καταχώρηση"}
          </Button>
        </DialogFooter>
      </form>
    </Dialog>
  );
}
