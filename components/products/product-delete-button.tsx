"use client";

import { Trash2 } from "lucide-react";
import * as React from "react";

import { ProductDeleteDialog } from "@/components/products/product-delete-dialog";
import { type Product } from "@/components/products/types";
import { Button } from "@/components/ui/button";
import { usePermissionsOptional } from "@/lib/auth/permissions-context";
import { cn } from "@/lib/utils";

type ProductDeleteButtonProps = {
  product: Pick<Product, "id" | "name">;
  onDeleted?: () => void;
  variant?: "icon" | "outline";
  className?: string;
};

export function ProductDeleteButton({
  product,
  onDeleted,
  variant = "icon",
  className,
}: ProductDeleteButtonProps) {
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
            "h-8 w-8 text-destructive hover:bg-destructive/10 hover:text-destructive",
            className,
          )}
          aria-label={`Διαγραφή ${product.name}`}
          onClick={() => setOpen(true)}
        >
          <Trash2 className="size-4" />
        </Button>
      ) : (
        <Button
          type="button"
          variant="outline"
          size="sm"
          className={cn(
            "h-8 text-destructive hover:bg-destructive/10 hover:text-destructive",
            className,
          )}
          onClick={() => setOpen(true)}
        >
          <Trash2 className="size-3.5" />
          Διαγραφή
        </Button>
      )}

      <ProductDeleteDialog
        product={product}
        open={open}
        onOpenChange={setOpen}
        onDeleted={onDeleted}
      />
    </>
  );
}
