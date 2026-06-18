"use client";

import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import * as React from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Dialog, DialogBody, DialogFooter } from "@/components/ui/dialog";
import { deleteProduct } from "@/lib/products/delete-product";
import { createClient } from "@/lib/supabase/client";

type ProductDeleteDialogProps = {
  product: { id: string; name: string };
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDeleted?: () => void;
};

export function ProductDeleteDialog({
  product,
  open,
  onOpenChange,
  onDeleted,
}: ProductDeleteDialogProps) {
  const router = useRouter();
  const [deleting, setDeleting] = React.useState(false);

  async function handleConfirm() {
    setDeleting(true);
    const supabase = createClient();
    const result = await deleteProduct(supabase, product.id);
    setDeleting(false);

    if (!result.ok) {
      toast.error(result.error);
      return;
    }

    toast.success("Το προϊόν διαγράφηκε");
    onOpenChange(false);
    onDeleted?.();
    router.refresh();
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!deleting) onOpenChange(next);
      }}
      title="Διαγραφή προϊόντος"
      className="max-w-lg"
    >
      <DialogBody className="text-sm text-foreground">
        <p>
          Είστε σίγουροι ότι θέλετε να διαγράψετε οριστικά το προϊόν{" "}
          <span className="font-semibold text-kartex-navy">{product.name}</span>; Αυτή η
          ενέργεια δεν αναιρείται.
        </p>
      </DialogBody>
      <DialogFooter>
        <Button
          type="button"
          variant="outline"
          onClick={() => onOpenChange(false)}
          disabled={deleting}
        >
          Ακύρωση
        </Button>
        <Button
          type="button"
          variant="destructive"
          onClick={() => void handleConfirm()}
          disabled={deleting}
        >
          {deleting ? (
            <>
              <Loader2 className="size-4 animate-spin" />
              Διαγραφή…
            </>
          ) : (
            "Διαγραφή"
          )}
        </Button>
      </DialogFooter>
    </Dialog>
  );
}
