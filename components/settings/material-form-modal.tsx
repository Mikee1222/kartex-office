"use client";

import * as React from "react";

import { Button } from "@/components/ui/button";
import { Dialog, DialogBody, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { premiumGoldButton, premiumLabel } from "@/lib/ui/premium-styles";
import type { LookupRow } from "@/lib/settings/lookups";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

type MaterialFormModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editing: LookupRow | null;
  onSaved: () => void;
};

export function MaterialFormModal({
  open,
  onOpenChange,
  editing,
  onSaved,
}: MaterialFormModalProps) {
  const [name, setName] = React.useState("");
  const [isActive, setIsActive] = React.useState(true);
  const [pending, setPending] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!open) return;
    setName(editing?.name ?? "");
    setIsActive(editing?.isActive ?? true);
    setError(null);
  }, [open, editing]);

  async function handleSave() {
    if (!name.trim()) {
      setError("Το όνομα υλικού είναι υποχρεωτικό.");
      return;
    }

    setPending(true);
    setError(null);
    const supabase = createClient();

    const payload = {
      name: name.trim(),
      is_active: isActive,
    };

    const result = editing
      ? await supabase.from("materials").update(payload).eq("id", editing.id)
      : await supabase.from("materials").insert(payload);

    setPending(false);

    if (result.error) {
      setError(result.error.message);
      return;
    }

    onSaved();
    onOpenChange(false);
  }

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title={editing ? "Επεξεργασία Υλικού" : "Νέο Υλικό"}
      className="max-w-md"
    >
      <DialogBody className="space-y-4">
        {error ? (
          <p className="text-sm text-destructive" role="alert">
            {error}
          </p>
        ) : null}

        <div className="space-y-2">
          <label htmlFor="material-name" className={premiumLabel}>
            Όνομα υλικού
          </label>
          <Input
            id="material-name"
            value={name}
            onChange={(event) => setName(event.target.value)}
            disabled={pending}
            placeholder="π.χ. Βαμβάκι"
          />
        </div>

        <label className="flex cursor-pointer items-center gap-2">
          <input
            type="checkbox"
            checked={isActive}
            onChange={(event) => setIsActive(event.target.checked)}
            disabled={pending}
            className="size-4 rounded border-gray-300"
          />
          <span className={premiumLabel}>Ενεργό</span>
        </label>
      </DialogBody>
      <DialogFooter>
        <Button
          type="button"
          variant="outline"
          disabled={pending}
          onClick={() => onOpenChange(false)}
        >
          Ακύρωση
        </Button>
        <Button
          type="button"
          className={cn(premiumGoldButton)}
          disabled={pending}
          onClick={() => void handleSave()}
        >
          {pending ? "Αποθήκευση…" : "Αποθήκευση"}
        </Button>
      </DialogFooter>
    </Dialog>
  );
}
