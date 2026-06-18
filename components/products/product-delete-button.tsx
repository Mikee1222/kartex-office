"use client";

import { Loader2, PowerOff, RotateCcw } from "lucide-react";
import { useRouter } from "next/navigation";
import * as React from "react";
import { toast } from "sonner";

import { ProductDeleteDialog } from "@/components/products/product-delete-dialog";
import { type Product } from "@/components/products/types";
import { Button } from "@/components/ui/button";
import { usePermissionsOptional } from "@/lib/auth/permissions-context";
import { setProductActive } from "@/lib/products/set-product-active";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

type ProductDeleteButtonProps = {
  product: Pick<Product, "id" | "name" | "isActive">;
  onChanged?: () => void;
  variant?: "icon" | "outline";
  className?: string;
};

export function ProductDeleteButton({
  product,
  onChanged,
  variant = "icon",
  className,
}: ProductDeleteButtonProps) {
  const router = useRouter();
  const permissions = usePermissionsOptional();
  const [open, setOpen] = React.useState(false);
  const [restoring, setRestoring] = React.useState(false);

  if (!permissions?.can("canDeleteProducts")) {
    return null;
  }

  const isActive = product.isActive ?? true;

  async function handleRestore() {
    setRestoring(true);
    const supabase = createClient();
    const result = await setProductActive(supabase, product.id, true);
    setRestoring(false);

    if (!result.ok) {
      toast.error(result.error);
      return;
    }

    toast.success("Το προϊόν επαναφέρθηκε");
    onChanged?.();
    router.refresh();
  }

  if (!isActive) {
    if (variant === "icon") {
      return (
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className={cn(
            "h-8 w-8 text-muted-foreground hover:bg-muted hover:text-kartex-navy",
            className,
          )}
          aria-label={`Επαναφορά ${product.name}`}
          disabled={restoring}
          onClick={() => void handleRestore()}
        >
          {restoring ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <RotateCcw className="size-4" />
          )}
        </Button>
      );
    }

    return (
      <Button
        type="button"
        variant="outline"
        size="sm"
        className={cn("h-8", className)}
        disabled={restoring}
        onClick={() => void handleRestore()}
      >
        {restoring ? (
          <Loader2 className="size-3.5 animate-spin" />
        ) : (
          <RotateCcw className="size-3.5" />
        )}
        Επαναφορά
      </Button>
    );
  }

  return (
    <>
      {variant === "icon" ? (
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className={cn(
            "h-8 w-8 text-muted-foreground hover:bg-muted hover:text-kartex-navy",
            className,
          )}
          aria-label={`Απενεργοποίηση ${product.name}`}
          onClick={() => setOpen(true)}
        >
          <PowerOff className="size-4" />
        </Button>
      ) : (
        <Button
          type="button"
          variant="outline"
          size="sm"
          className={cn(
            "h-8 text-muted-foreground hover:bg-muted hover:text-kartex-navy",
            className,
          )}
          onClick={() => setOpen(true)}
        >
          <PowerOff className="size-3.5" />
          Απενεργοποίηση
        </Button>
      )}

      <ProductDeleteDialog
        product={product}
        open={open}
        onOpenChange={setOpen}
        onChanged={onChanged}
      />
    </>
  );
}

/** @deprecated Use ProductDeleteButton — kept for import compatibility */
export const ProductDeactivateButton = ProductDeleteButton;
