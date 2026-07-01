export type OrderDeliveryFields = {
  customer_address?: string | null;
  delivery_method?: string | null;
  delivery_address?: string | null;
  delivery_city?: string | null;
  delivery_postal_code?: string | null;
  pickup_agency?: string | null;
};

type CustomerSnapshot = {
  address?: string | null;
  city?: string | null;
  postal_code?: string | null;
};

function legacyAddressLine(
  order: OrderDeliveryFields,
  customer: CustomerSnapshot | null,
): string | null {
  const line2 = [customer?.city?.trim(), customer?.postal_code?.trim()]
    .filter(Boolean)
    .join(" ");
  const parts = [customer?.address?.trim(), line2].filter(Boolean);
  if (parts.length > 0) return parts.join(", ");
  return order.customer_address?.trim() || null;
}

/** Address string suitable for geocoding — mirrors drivers app logic. */
export function resolveGeocodeQuery(
  order: OrderDeliveryFields,
  customer: CustomerSnapshot | null,
): string {
  const method = order.delivery_method;

  if (method === "pickup") {
    return order.pickup_agency?.trim() ?? "";
  }

  if (method === "address") {
    const line2 = [order.delivery_city?.trim(), order.delivery_postal_code?.trim()]
      .filter(Boolean)
      .join(" ");
    const parts = [order.delivery_address?.trim(), line2].filter(Boolean);
    if (parts.length > 0) return parts.join(", ");
    return legacyAddressLine(order, customer) ?? "";
  }

  return legacyAddressLine(order, customer) ?? "";
}
