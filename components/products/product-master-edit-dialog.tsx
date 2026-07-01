"use client";

import { Loader2 } from "lucide-react";
import * as React from "react";

import {
  ProductCategorySelect,
  ProductSubcategorySelect,
} from "@/components/products/product-category-select";
import { MaterialIdSelect } from "@/components/settings/material-id-select";
import { Button } from "@/components/ui/button";
import { Dialog, DialogBody, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { premiumGoldButton } from "@/lib/ui/premium-styles";
import { cn } from "@/lib/utils";

export type ProductMasterEditFormValues = {
  cleanName: string;
  category: string;
  subcategory: string;
  qualityGrade: string;
  materialId: string | null;
  materialName: string | null;
  description: string;
};

type ProductMasterEditDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  values: ProductMasterEditFormValues;
  onChange: (values: ProductMasterEditFormValues) => void;
  onSave: () => Promise<void>;
  saving?: boolean;
  descriptionLabel?: string;
  descriptionPlaceholder?: string;
};

export function ProductMasterEditDialog({
  open,
  onOpenChange,
  values,
  onChange,
  onSave,
  saving = false,
  descriptionLabel = "Περιγραφή",
  descriptionPlaceholder = "Περιγραφή προϊόντος…",
}: ProductMasterEditDialogProps) {
  const [categoryId, setCategoryId] = React.useState("");

  function patch(partial: Partial<ProductMasterEditFormValues>) {
    onChange({ ...values, ...partial });
  }

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title="Επεξεργασία προϊόντος"
      description="Ενημέρωση ονόματος, κατηγορίας και στοιχείων ποιότητας."
      className="max-w-2xl"
    >
      <form
        onSubmit={(event) => {
          event.preventDefault();
          void onSave();
        }}
      >
        <DialogBody className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="master-edit-name">Όνομα</Label>
              <Input
                id="master-edit-name"
                value={values.cleanName}
                onChange={(event) => patch({ cleanName: event.target.value })}
                required
              />
            </div>
            <ProductCategorySelect
              value={values.category}
              onChange={(name, id) => {
                patch({ category: name, subcategory: "" });
                setCategoryId(id);
              }}
              required
            />
            <ProductSubcategorySelect
              categoryId={categoryId}
              value={values.subcategory}
              onChange={(subcategory) => patch({ subcategory })}
            />
            <div className="space-y-2">
              <Label htmlFor="master-edit-quality">Σειρά / Ποιότητα</Label>
              <Input
                id="master-edit-quality"
                value={values.qualityGrade}
                onChange={(event) => patch({ qualityGrade: event.target.value })}
              />
            </div>
            <MaterialIdSelect
              value={values.materialId ?? ""}
              onChange={(materialId, materialName) =>
                patch({ materialId: materialId || null, materialName })
              }
              disabled={saving}
            />
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="master-edit-description">{descriptionLabel}</Label>
              <textarea
                id="master-edit-description"
                value={values.description}
                onChange={(event) => patch({ description: event.target.value })}
                rows={5}
                className={cn(
                  "flex w-full rounded-input border border-input bg-background px-3 py-2 text-sm shadow-sm",
                  "placeholder:text-muted-foreground focus-visible:border-kartex-gold/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-kartex-gold/30",
                )}
                placeholder={descriptionPlaceholder}
              />
            </div>
          </div>
        </DialogBody>
        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={saving}
          >
            Ακύρωση
          </Button>
          <Button type="submit" className={premiumGoldButton} disabled={saving}>
            {saving ? <Loader2 className="size-4 animate-spin" /> : null}
            Αποθήκευση
          </Button>
        </DialogFooter>
      </form>
    </Dialog>
  );
}
