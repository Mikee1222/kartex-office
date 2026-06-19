import { QuotesList } from "@/components/quotes/quotes-list";
import { createClient } from "@/lib/supabase/server";
import { mapQuoteRequestRow, type QuoteRequestRow } from "@/types/database";

export default async function QuotesPage() {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("quote_requests")
    .select("*, quote_request_items!quote_request_items_quote_request_id_fkey(count)")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Failed to load quote requests:", error.message);
  }

  const initialQuotes = ((data ?? []) as QuoteRequestRow[]).map((row) =>
    mapQuoteRequestRow(row),
  );

  return <QuotesList initialQuotes={initialQuotes} />;
}
