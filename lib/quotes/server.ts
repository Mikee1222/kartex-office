import type { SupabaseClient } from "@supabase/supabase-js";

import { OrderStatus } from "@/components/orders/types";
import type { QuoteRequestRow } from "@/types/database";

type QuoteAcceptanceOrder = {
  id: string;
};

type QuoteAcceptanceSource = Pick<
  QuoteRequestRow,
  | "id"
  | "company_name"
  | "contact_name"
  | "email"
  | "phone"
  | "delivery_method"
  | "delivery_recipient_name"
  | "delivery_address"
  | "delivery_city"
  | "delivery_postal_code"
  | "pickup_agency"
>;

/** Copy quote contact fields onto a portal-created order after acceptance. */
export async function updateOrderFromQuoteAcceptance(
  supabase: SupabaseClient,
  order: QuoteAcceptanceOrder,
  quote: QuoteAcceptanceSource,
): Promise<{ error: string | null }> {
  const label = quote.company_name?.trim() || quote.contact_name?.trim() || "";

  const { error } = await supabase
    .from("orders")
    .update({
      quote_request_id: quote.id,
      customer_name: quote.contact_name?.trim() || null,
      customer_phone: quote.phone?.trim() || null,
      customer_email: quote.email?.trim() || null,
      company_name: quote.company_name?.trim() || null,
      delivery_method: quote.delivery_method ?? null,
      delivery_recipient_name: quote.delivery_recipient_name?.trim() || null,
      delivery_address: quote.delivery_address?.trim() || null,
      delivery_city: quote.delivery_city?.trim() || null,
      delivery_postal_code: quote.delivery_postal_code?.trim() || null,
      pickup_agency: quote.pickup_agency?.trim() || null,
      notes: `Παραγγελία από website portal · ${label}`,
      status: OrderStatus.PendingPayment,
      payment_status: "pending",
    })
    .eq("id", order.id);

  return { error: error?.message ?? null };
}
