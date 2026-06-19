import { notFound } from "next/navigation";

import { QuoteDetailView } from "@/components/quotes/quote-detail-view";
import { createClient } from "@/lib/supabase/server";
import {
  mapQuoteRequestToDetail,
  QUOTE_DETAIL_SELECT,
  type QuoteRequestRow,
} from "@/types/database";

type QuoteDetailPageProps = {
  params: Promise<{ id: string }>;
};

export default async function QuoteDetailPage({ params }: QuoteDetailPageProps) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: quote, error } = await supabase
    .from("quote_requests")
    .select(QUOTE_DETAIL_SELECT)
    .eq("id", id)
    .single();

  if (error || !quote) {
    notFound();
  }

  return (
    <QuoteDetailView quote={mapQuoteRequestToDetail(quote as QuoteRequestRow)} />
  );
}
