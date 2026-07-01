"use client";

import { Toaster as Sonner } from "sonner";

export function Toaster() {
  return (
    <Sonner
      position="bottom-right"
      closeButton
      toastOptions={{
        classNames: {
          toast:
            "rounded-xl border border-gray-200 bg-white text-foreground shadow-card-hover !pl-4",
          title: "font-semibold text-navy-900",
          description: "text-sm text-gray-600",
          success: "!border-l-4 !border-l-success",
          error: "!border-l-4 !border-l-danger",
          warning: "!border-l-4 !border-l-warning",
          info: "!border-l-4 !border-l-info",
        },
      }}
    />
  );
}
