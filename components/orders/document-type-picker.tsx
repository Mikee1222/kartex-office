"use client";

import { FileText, Receipt } from "lucide-react";

import { FormFieldLabel } from "@/components/ui/form-field-label";
import type { OrderDocumentType } from "@/lib/orders/order-vat";
import { cn } from "@/lib/utils";

const OPTIONS: {
  value: "receipt" | "invoice";
  label: string;
  description: string;
  icon: typeof Receipt;
}[] = [
  {
    value: "receipt",
    label: "Απόδειξη",
    description: "Για ιδιώτες · Με ΦΠΑ 24%",
    icon: Receipt,
  },
  {
    value: "invoice",
    label: "Τιμολόγιο",
    description: "Για επιχειρήσεις · Χωρίς ΦΠΑ",
    icon: FileText,
  },
];

type DocumentTypePickerProps = {
  value: OrderDocumentType;
  onChange: (value: "receipt" | "invoice") => void;
  className?: string;
};

export function DocumentTypePicker({
  value,
  onChange,
  className,
}: DocumentTypePickerProps) {
  const selected = value === "invoice" ? "invoice" : "receipt";

  return (
    <div className={cn("space-y-3", className)}>
      <FormFieldLabel>Τύπος Παραστατικού</FormFieldLabel>
      <div className="grid gap-2 sm:grid-cols-2">
        {OPTIONS.map((option) => {
          const Icon = option.icon;
          const isActive = selected === option.value;

          return (
            <button
              key={option.value}
              type="button"
              onClick={() => onChange(option.value)}
              className={cn(
                "rounded-xl border px-4 py-3 text-left transition-colors",
                isActive
                  ? "border-kartex-gold bg-kartex-gold/10 text-kartex-navy"
                  : "border-border bg-white text-muted-foreground hover:border-kartex-gold/40",
              )}
            >
              <Icon
                className={cn(
                  "mb-1.5 size-5",
                  isActive ? "text-kartex-gold" : "text-muted-foreground",
                )}
                aria-hidden
              />
              <div className="text-sm font-semibold">{option.label}</div>
              <div className="mt-0.5 text-xs text-muted-foreground">{option.description}</div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function documentTypeLabel(value: OrderDocumentType): string {
  return value === "invoice" ? "Τιμολόγιο" : "Απόδειξη";
}
