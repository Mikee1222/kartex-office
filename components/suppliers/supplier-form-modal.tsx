"use client";

import * as React from "react";

import { FormFieldLabel } from "@/components/ui/form-field-label";
import { Button } from "@/components/ui/button";
import { Dialog, DialogBody, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { FIELD_TOOLTIPS } from "@/lib/forms/field-tooltips";
import type { SupplierInput, SupplierRow } from "@/lib/settings/suppliers";
import { insertSupplier, updateSupplier } from "@/lib/settings/suppliers";
import { premiumGoldButton } from "@/lib/ui/premium-styles";
import { premiumTextarea } from "@/lib/ui/form-styles";
import { createClient } from "@/lib/supabase/client";

type SupplierFormModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initial?: SupplierRow | null;
  onSaved: (supplier: SupplierRow) => void;
};

export function SupplierFormModal({
  open,
  onOpenChange,
  initial = null,
  onSaved,
}: SupplierFormModalProps) {
  const isEdit = Boolean(initial);
  const [error, setError] = React.useState<string | null>(null);
  const [pending, setPending] = React.useState(false);

  const [name, setName] = React.useState("");
  const [phone, setPhone] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [address, setAddress] = React.useState("");
  const [region, setRegion] = React.useState("");
  const [country, setCountry] = React.useState("Ελλάδα");
  const [notes, setNotes] = React.useState("");

  React.useEffect(() => {
    if (!open) return;
    setError(null);
    setName(initial?.name ?? "");
    setPhone(initial?.phone ?? "");
    setEmail(initial?.email ?? "");
    setAddress(initial?.address ?? "");
    setRegion(initial?.region ?? "");
    setCountry(initial?.country ?? "Ελλάδα");
    setNotes(initial?.notes ?? "");
  }, [open, initial]);

  async function handleSubmit() {
    if (!name.trim()) {
      setError("Το όνομα είναι υποχρεωτικό.");
      return;
    }

    setError(null);
    setPending(true);
    const supabase = createClient();
    const input: SupplierInput = {
      name,
      phone,
      email,
      address,
      region,
      country,
      notes,
    };

    if (isEdit && initial) {
      const { error: updateError } = await updateSupplier(supabase, initial.id, input);
      setPending(false);
      if (updateError) {
        setError(updateError);
        return;
      }
      onSaved({ ...initial, ...input, phone: input.phone ?? null, email: input.email ?? null, address: input.address ?? null, region: input.region ?? null, notes: input.notes ?? null, country: input.country ?? "Ελλάδα" });
      onOpenChange(false);
      return;
    }

    const { item, error: insertError } = await insertSupplier(supabase, input);
    setPending(false);
    if (insertError || !item) {
      setError(insertError ?? "Αποτυχία αποθήκευσης.");
      return;
    }

    onSaved(item);
    onOpenChange(false);
  }

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title={isEdit ? "Επεξεργασία Προμηθευτή" : "Νέος Προμηθευτής"}
      className="max-w-lg"
    >
      <div>
        <DialogBody className="space-y-4">
          {error ? (
            <p className="text-sm text-destructive" role="alert">
              {error}
            </p>
          ) : null}

          <div className="space-y-2">
            <FormFieldLabel htmlFor="supplier-name" required tooltip={FIELD_TOOLTIPS.supplierName}>
              Όνομα
            </FormFieldLabel>
            <Input
              id="supplier-name"
              value={name}
              disabled={pending}
              onChange={(event) => setName(event.target.value)}
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <FormFieldLabel htmlFor="supplier-phone" tooltip={FIELD_TOOLTIPS.phone}>
                Τηλέφωνο
              </FormFieldLabel>
              <Input
                id="supplier-phone"
                type="tel"
                value={phone}
                disabled={pending}
                onChange={(event) => setPhone(event.target.value)}
              />
            </div>
            <div className="space-y-2">
              <FormFieldLabel htmlFor="supplier-email" tooltip={FIELD_TOOLTIPS.email}>
                Email
              </FormFieldLabel>
              <Input
                id="supplier-email"
                type="email"
                value={email}
                disabled={pending}
                onChange={(event) => setEmail(event.target.value)}
              />
            </div>
          </div>
          <div className="space-y-2">
            <FormFieldLabel htmlFor="supplier-address" tooltip={FIELD_TOOLTIPS.address}>
              Διεύθυνση
            </FormFieldLabel>
            <Input
              id="supplier-address"
              value={address}
              disabled={pending}
              onChange={(event) => setAddress(event.target.value)}
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <FormFieldLabel htmlFor="supplier-region" tooltip={FIELD_TOOLTIPS.supplierRegion}>
                Περιοχή
              </FormFieldLabel>
              <Input
                id="supplier-region"
                value={region}
                disabled={pending}
                onChange={(event) => setRegion(event.target.value)}
              />
            </div>
            <div className="space-y-2">
              <FormFieldLabel htmlFor="supplier-country" tooltip={FIELD_TOOLTIPS.supplierCountry}>
                Χώρα
              </FormFieldLabel>
              <Input
                id="supplier-country"
                value={country}
                disabled={pending}
                onChange={(event) => setCountry(event.target.value)}
              />
            </div>
          </div>
          <div className="space-y-2">
            <FormFieldLabel htmlFor="supplier-notes" tooltip={FIELD_TOOLTIPS.notes}>
              Σημειώσεις
            </FormFieldLabel>
            <textarea
              id="supplier-notes"
              value={notes}
              disabled={pending}
              onChange={(event) => setNotes(event.target.value)}
              className={premiumTextarea}
              rows={3}
            />
          </div>
        </DialogBody>
        <DialogFooter>
          <Button type="button" variant="outline" disabled={pending} onClick={() => onOpenChange(false)}>
            Άκυρο
          </Button>
          <Button
            type="button"
            disabled={pending}
            className={premiumGoldButton}
            onClick={() => void handleSubmit()}
          >
            {pending ? "Αποθήκευση…" : "Αποθήκευση"}
          </Button>
        </DialogFooter>
      </div>
    </Dialog>
  );
}
