"use client";

import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import * as React from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Dialog, DialogBody, DialogFooter } from "@/components/ui/dialog";
import { setProductActive } from "@/lib/products/set-product-active";
import { createClient } from "@/lib/supabase/client";

type ProductDeleteDialogProps = {
  product: { id: string; name: string };
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onChanged?: () => void;
};

export function ProductDeleteDialog({
  product,
  open,
  onOpenChange,
  onChanged,
}: ProductDeleteDialogProps) {
  const router = useRouter();
  const [submitting, setSubmitting] = React.useState(false);

  async function handleConfirm() {
    setSubmitting(true);
    const supabase = createClient();
    const result = await setProductActive(supabase, product.id, false);
    setSubmitting(false);

    if (!result.ok) {
      toast.error(result.error);
      return;
    }

    toast.success("Το προϊόν απενεργοποιήθηκε");
    onOpenChange(false);
    onChanged?.();
    router.refresh();
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!submitting) onOpenChange(next);
      }}
      title="Απενεργοποίηση προϊόντος"
      className="max-w-lg"
    >
      <DialogBody className="text-sm text-foreground">
        <p>
          Το προϊόν θα απενεργοποιηθεί και δεν θα εμφανίζεται πλέον. Μπορείτε να το
          επαναφέρετε αργότερα.
        </p>
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
          type="button"
          onClick={() => void handleConfirm()}
          disabled={submitting}
        >
          {submitting ? (
            <>
              <Loader2 className="size-4 animate-spin" />
              Απενεργοποίηση…
            </>
          ) : (
            "Απενεργοποίηση"
          )}
        </Button>
      </DialogFooter>
    </Dialog>
  );
}
