import type { SupabaseClient } from "@supabase/supabase-js";

import type { QuoteRequestRow } from "@/types/database";

type QuoteAcceptanceOrder = {
  id: string;
};

type QuoteAcceptanceSource = Pick<
  QuoteRequestRow,
  "id" | "company_name" | "contact_name" | "email" | "phone"
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
      notes: `Παραγγελία από website portal · ${label}`,
      status: "Αναμονή πληρωμής",
      payment_status: "pending",
    })
    .eq("id", order.id);

  return { error: error?.message ?? null };
}
