"use client";

import { PowerOff } from "lucide-react";
import * as React from "react";

import { ProductDeleteDialog } from "@/components/products/product-delete-dialog";
import { type Product } from "@/components/products/types";
import { Button } from "@/components/ui/button";
import { usePermissionsOptional } from "@/lib/auth/permissions-context";
import { cn } from "@/lib/utils";

type ProductDeactivateButtonProps = {
  product: Pick<Product, "id" | "name">;
  onChanged?: () => void;
  variant?: "icon" | "outline";
  className?: string;
};

export function ProductDeactivateButton({
  product,
  onChanged,
  variant = "icon",
  className,
}: ProductDeactivateButtonProps) {
  const permissions = usePermissionsOptional();
  const [open, setOpen] = React.useState(false);

  if (!permissions?.can("canDeleteProducts")) {
    return null;
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
