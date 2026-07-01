"use client";

import * as React from "react";

import { Button } from "@/components/ui/button";
import { ColorPicker } from "@/components/ui/color-picker";
import { Dialog, DialogBody, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { premiumGoldButton, premiumLabel } from "@/lib/ui/premium-styles";
import type { ProductColor } from "@/lib/products/types";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

type ColorFormModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editing: ProductColor | null;
  onSaved: () => void;
};

export function ColorFormModal({
  open,
  onOpenChange,
  editing,
  onSaved,
}: ColorFormModalProps) {
  const [name, setName] = React.useState("");
  const [hex, setHex] = React.useState("#D4AF37");
  const [isActive, setIsActive] = React.useState(true);
  const [pending, setPending] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!open) return;
    setName(editing?.name ?? "");
    setHex(editing?.hexCode ?? "#D4AF37");
    setIsActive(editing?.isActive ?? true);
    setError(null);
  }, [open, editing]);

  async function handleSave() {
    if (!name.trim()) {
      setError("Το όνομα χρώματος είναι υποχρεωτικό.");
      return;
    }

    setPending(true);
    setError(null);
    const supabase = createClient();

    const payload = {
      name: name.trim(),
      hex_code: hex,
      is_active: isActive,
    };

    const result = editing
      ? await supabase.from("product_colors").update(payload).eq("id", editing.id)
      : await supabase.from("product_colors").insert(payload);

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
      title={editing ? "Επεξεργασία Χρώματος" : "Νέο Χρώμα"}
      className="max-w-md"
    >
      <DialogBody className="space-y-4">
        {error ? (
          <p className="text-sm text-destructive" role="alert">
            {error}
          </p>
        ) : null}

        <ColorPicker
          showName
          nameLabel="Όνομα χρώματος"
          value={{ name, hex }}
          onChange={(next) => {
            setName(next.name ?? "");
            setHex(next.hex);
          }}
          disabled={pending}
        />

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
