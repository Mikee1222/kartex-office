"use client";

import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import * as React from "react";

import { type OrderEditFormData } from "@/components/orders/map-order-detail";
import { OrderStatus } from "@/components/orders/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FormFieldLabel } from "@/components/ui/form-field-label";
import { PaymentTermsSelect } from "@/components/settings/payment-terms-select";
import { FIELD_TOOLTIPS } from "@/lib/forms/field-tooltips";
import {
  premiumFormCard,
  premiumFormGrid,
  premiumFormShell,
  premiumGoldButton,
} from "@/lib/ui/premium-styles";
import { premiumSelect, premiumTextarea } from "@/lib/ui/form-styles";
import { logInventoryMovement } from "@/lib/inventory/log-movement";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

const STATUS_OPTIONS = [
  OrderStatus.Processing,
  OrderStatus.Scheduled,
  OrderStatus.Confirmed,
  OrderStatus.ReadyForShipment,
  OrderStatus.Reserved,
  OrderStatus.PartialShipment,
  OrderStatus.Shipped,
  OrderStatus.Completed,
  OrderStatus.PendingPayment,
  OrderStatus.Cancelled,
] as const;

const PRIORITY_OPTIONS = ["Κανονική", "Επείγον"] as const;

type OrderEditFormProps = {
  orderId: string;
  initial: OrderEditFormData;
};

export function OrderEditForm({ orderId, initial }: OrderEditFormProps) {
  const router = useRouter();
  const [error, setError] = React.useState<string | null>(null);
  const [pending, setPending] = React.useState(false);

  const [status, setStatus] = React.useState(initial.status);
  const [deliveryDate, setDeliveryDate] = React.useState(initial.deliveryDate);
  const [paymentTerms, setPaymentTerms] = React.useState(initial.paymentTerms ?? "");
  const [priority, setPriority] = React.useState(() =>
    PRIORITY_OPTIONS.includes(
      initial.priority as (typeof PRIORITY_OPTIONS)[number],
    )
      ? initial.priority
      : "Κανονική",
  );
  const [notes, setNotes] = React.useState(initial.notes);
  const [internalNotes, setInternalNotes] = React.useState(initial.internalNotes);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setPending(true);

    const supabase = createClient();
    const wasShipped = initial.status === OrderStatus.Shipped;
    const payload = {
      status,
      delivery_date: deliveryDate || null,
      payment_terms: paymentTerms,
      priority,
      notes: notes.trim() || null,
      internal_notes: internalNotes.trim() || null,
    };

    const { data, error: updateError } = await supabase
      .from("orders")
      .update(payload)
      .eq("id", orderId)
      .select()
      .single();

    if (updateError) {
      console.error("Order update error:", updateError);
      setError(updateError.message || "Αποτυχία αποθήκευσης παραγγελίας.");
      setPending(false);
      return;
    }

    if (status === OrderStatus.Shipped && !wasShipped) {
      const { data: items, error: itemsError } = await supabase
        .from("order_items")
        .select("product_id, quantity")
        .eq("order_id", orderId);

      if (itemsError) {
        console.error("order_items fetch error:", itemsError);
        setError(itemsError.message || "Αποτυχία φόρτωσης γραμμών παραγγελίας.");
        setPending(false);
        return;
      }

      for (const item of items ?? []) {
        if (!item.product_id) continue;

        const quantity = item.quantity ?? 0;
        if (quantity <= 0) continue;

        const { error: rpcError } = await supabase.rpc("decrease_stock", {
          p_product_id: item.product_id,
          p_quantity: quantity,
        });

        if (rpcError) {
          console.error("decrease_stock failed:", rpcError);
          setError(
            rpcError.message ||
              "Η παραγγελία αποθηκεύτηκε, αλλά απέτυχε η αφαίρεση αποθέματος.",
          );
          setPending(false);
          return;
        }

        const { error: movementError } = await logInventoryMovement(supabase, {
          product_id: item.product_id,
          type: "out",
          quantity,
          reason: "Αποστολή παραγγελίας",
          order_id: orderId,
        });

        if (movementError) {
          console.error("inventory_movement insert failed:", movementError);
        }
      }

      await supabase
        .from("orders")
        .update({ stock_deducted: true })
        .eq("id", orderId);
    }

    router.push(`/orders/${orderId}`);
    router.refresh();
  }

  return (
    <div className={premiumFormShell}>
      <Link
        href={`/orders/${orderId}`}
        className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-kartex-navy"
      >
        <ArrowLeft className="size-4" aria-hidden />
        Παραγγελία {initial.orderNumber}
      </Link>

      <h1 className="text-2xl font-semibold tracking-tight text-kartex-navy">
        Επεξεργασία παραγγελίας
      </h1>

      <Card className="premiumFormCard">
        <CardHeader>
          <CardTitle className="text-lg text-kartex-navy">
            {initial.orderNumber}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={(e) => void handleSubmit(e)} className="space-y-6">
            {error ? (
              <p
                className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive"
                role="alert"
              >
                {error}
              </p>
            ) : null}

            <fieldset disabled={pending} className="grid gap-4">
              <div className="space-y-2">
                <FormFieldLabel htmlFor="order-status" tooltip={FIELD_TOOLTIPS.orderStatus}>
                  Κατάσταση
                </FormFieldLabel>
                <select
                  id="order-status"
                  value={status}
                  onChange={(e) => setStatus(e.target.value as typeof status)}
                  className={premiumSelect}
                >
                  {STATUS_OPTIONS.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <FormFieldLabel htmlFor="delivery-date" tooltip={FIELD_TOOLTIPS.deliveryDate}>
                  Ημερομηνία παράδοσης
                </FormFieldLabel>
                <input
                  id="delivery-date"
                  type="date"
                  value={deliveryDate}
                  onChange={(e) => setDeliveryDate(e.target.value)}
                  className={premiumSelect}
                />
              </div>

              <PaymentTermsSelect
                value={paymentTerms}
                onChange={setPaymentTerms}
                disabled={pending}
                label="Όροι πληρωμής"
                extraOption={initial.paymentTerms}
              />

              <div className="space-y-2">
                <FormFieldLabel htmlFor="priority" tooltip={FIELD_TOOLTIPS.orderPriority}>
                  Προτεραιότητα
                </FormFieldLabel>
                <select
                  id="priority"
                  value={priority}
                  onChange={(e) => setPriority(e.target.value)}
                  className={premiumSelect}
                >
                  {PRIORITY_OPTIONS.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <FormFieldLabel htmlFor="notes" tooltip={FIELD_TOOLTIPS.orderNotes}>
                  Σημειώσεις
                </FormFieldLabel>
                <textarea
                  id="notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className={premiumTextarea}
                  placeholder="Σημειώσεις πελάτη / παράδοσης…"
                />
              </div>

              <div className="space-y-2">
                <FormFieldLabel htmlFor="internal-notes" tooltip={FIELD_TOOLTIPS.orderInternalNotes}>
                  Εσωτερικές σημειώσεις
                </FormFieldLabel>
                <textarea
                  id="internal-notes"
                  value={internalNotes}
                  onChange={(e) => setInternalNotes(e.target.value)}
                  className={premiumTextarea}
                  placeholder="Μόνο για την ομάδα…"
                />
              </div>
            </fieldset>

            <div className="flex flex-col-reverse gap-3 border-t border-border pt-4 sm:flex-row sm:justify-end">
              <Button
                type="button"
                variant="outline"
                disabled={pending}
                onClick={() => router.push(`/orders/${orderId}`)}
              >
                Ακύρωση
              </Button>
              <Button
                type="submit"
                disabled={pending}
                className={cn(premiumGoldButton, "sm:min-w-[140px]")}
              >
                {pending ? "Αποθήκευση…" : "Αποθήκευση"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
