"use client";

import * as React from "react";

import {
  checkProductFieldUnique,
  type ProductIdentifierField,
} from "@/lib/products/identifiers";

export type IdentifierUniqueStatus = "idle" | "checking" | "unique" | "taken";

export function useIdentifierUniqueness(
  field: ProductIdentifierField,
  value: string,
  productId?: string,
) {
  const [status, setStatus] = React.useState<IdentifierUniqueStatus>("idle");

  React.useEffect(() => {
    setStatus("idle");
  }, [value, field, productId]);

  const checkOnBlur = React.useCallback(
    async (overrideValue?: string) => {
      const trimmed = (overrideValue ?? value).trim();
      if (!trimmed) {
        setStatus("idle");
        return;
      }

      setStatus("checking");
      const unique = await checkProductFieldUnique(field, trimmed, productId);
      setStatus(unique ? "unique" : "taken");
    },
    [field, value, productId],
  );

  return { status, checkOnBlur };
}
