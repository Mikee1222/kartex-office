"use client";

import { Barcode, Eye, MoreVertical, Pencil } from "lucide-react";
import { useRouter } from "next/navigation";

import { ProductDeleteButton } from "@/components/products/product-delete-button";
import { type Product } from "@/components/products/types";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { printProductBarcode } from "@/lib/products/barcode-print";

type ProductRowActionsProps = {
  product: Product;
  onChanged?: () => void;
};

export function ProductRowActions({ product, onChanged }: ProductRowActionsProps) {
  const router = useRouter();

  function handlePrintBarcode() {
    const result = printProductBarcode({
      name: product.name,
      sku: product.sku,
      barcode: product.barcode,
    });
    if (!result.ok && result.error) {
      window.alert(result.error);
    }
  }

  return (
    <div className="flex items-center justify-end gap-1">
      <ProductDeleteButton product={product} onChanged={onChanged} />
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-muted-foreground hover:text-kartex-navy"
            aria-label="Ενέργειες προϊόντος"
          >
            <MoreVertical className="size-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="z-50 min-w-[11rem]">
          <DropdownMenuItem onClick={() => router.push(`/products/${product.id}`)}>
            <Eye className="size-4" />
            Προβολή
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => router.push(`/products/${product.id}/edit`)}
          >
            <Pencil className="size-4" />
            Επεξεργασία
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handlePrintBarcode}>
            <Barcode className="size-4" />
            Εκτύπωση Barcode
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
