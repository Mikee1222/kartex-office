"use client";

import { Eye, FileQuestion, Package } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import * as React from "react";
import { toast } from "sonner";

import { DataError } from "@/components/dashboard/data-error";
import { EmptyState } from "@/components/dashboard/empty-state";
import { QuoteStatusBadge } from "@/components/quotes/quote-status-badge";
import {
  matchesQuoteFilterTab,
  QUOTE_FILTER_TABS,
  type QuoteFilterTab,
  type QuoteListItem,
} from "@/components/quotes/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { Skeleton } from "@/components/ui/skeleton";
import { useNotificationsStore } from "@/lib/notifications-store";
import { createClient } from "@/lib/supabase/client";
import {
  premiumFilterTabActive,
  premiumFilterTabInactive,
  premiumTableHead,
  premiumTableRow,
  premiumTableWrap,
} from "@/lib/ui/premium-styles";
import { mapQuoteRequestRow, type QuoteRequestRow } from "@/types/database";
import { cn } from "@/lib/utils";

type QuotesListProps = {
  initialQuotes: QuoteListItem[];
};

function QuotesTableSkeleton() {
  return (
    <div className={cn(premiumTableWrap, "space-y-3 p-4 sm:p-6")}>
      {Array.from({ length: 6 }).map((_, index) => (
        <Skeleton key={index} className="h-12 w-full" />
      ))}
    </div>
  );
}

export function QuotesList({ initialQuotes }: QuotesListProps) {
  const router = useRouter();
  const bumpQuotes = useNotificationsStore((state) => state.bumpQuotes);
  const [quotes, setQuotes] = React.useState<QuoteListItem[]>(initialQuotes);
  const [activeTab, setActiveTab] = React.useState<QuoteFilterTab>("all");
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [fetchKey, setFetchKey] = React.useState(0);
  const [highlightedIds, setHighlightedIds] = React.useState<Set<string>>(
    () => new Set(),
  );
  const [acceptedHighlightIds, setAcceptedHighlightIds] = React.useState<
    Set<string>
  >(() => new Set());

  const addTemporaryHighlight = React.useCallback(
    (
      id: string,
      setter: React.Dispatch<React.SetStateAction<Set<string>>>,
    ) => {
      setter((current) => new Set(current).add(id));
      window.setTimeout(() => {
        setter((current) => {
          const next = new Set(current);
          next.delete(id);
          return next;
        });
      }, 4000);
    },
    [],
  );

  const loadQuotes = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    const supabase = createClient();
    const { data, error: fetchError } = await supabase
      .from("quote_requests")
      .select("*, quote_request_items!quote_request_items_quote_request_id_fkey(count)")
      .order("created_at", { ascending: false });

    if (fetchError) {
      setError(fetchError.message || "Αποτυχία φόρτωσης αιτημάτων προσφοράς.");
      setQuotes([]);
      setLoading(false);
      return;
    }

    setQuotes((data as QuoteRequestRow[]).map((row) => mapQuoteRequestRow(row)));
    setLoading(false);
  }, []);

  React.useEffect(() => {
    if (fetchKey === 0) return;
    void loadQuotes();
  }, [fetchKey, loadQuotes]);

  React.useEffect(() => {
    const supabase = createClient();

    const channel = supabase
      .channel("quote-requests-changes")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "quote_requests",
        },
        (payload) => {
          const row = payload.new as QuoteRequestRow;
          const mapped = mapQuoteRequestRow({
            ...row,
            quote_request_items: [{ count: 0 }],
          });
          setQuotes((current) => {
            if (current.some((quote) => quote.id === mapped.id)) return current;
            return [mapped, ...current];
          });
          addTemporaryHighlight(mapped.id, setHighlightedIds);
          bumpQuotes();
          toast.success("Νέο αίτημα προσφοράς!");
        },
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "quote_requests",
        },
        (payload) => {
          const row = payload.new as QuoteRequestRow;
          const oldRow = payload.old as Partial<QuoteRequestRow>;
          const wasAccepted = oldRow.status === "accepted";
          const isAccepted = row.status === "accepted";

          setQuotes((current) => {
            const existing = current.find((quote) => quote.id === row.id);
            const mapped = mapQuoteRequestRow(
              {
                ...row,
                quote_request_items: existing
                  ? [{ count: existing.itemCount }]
                  : [{ count: 0 }],
              },
              existing?.itemCount ?? 0,
            );

            if (!existing) {
              return [mapped, ...current];
            }

            return current.map((quote) =>
              quote.id === row.id ? mapped : quote,
            );
          });

          if (isAccepted && !wasAccepted) {
            addTemporaryHighlight(row.id, setAcceptedHighlightIds);
            bumpQuotes();
            toast.success("✓ Ο πελάτης αποδέχτηκε την προσφορά!");
          }
        },
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [addTemporaryHighlight, bumpQuotes]);

  const filtered = React.useMemo(
    () => quotes.filter((quote) => matchesQuoteFilterTab(quote.status, activeTab)),
    [quotes, activeTab],
  );

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <PageHeader
        title="Αιτήματα Προσφοράς"
        subtitle="Αιτήματα από το B2B portal — προσθέστε τιμές και απαντήστε στους πελάτες."
      />

      <div
        className="flex flex-wrap gap-2"
        role="tablist"
        aria-label="Φίλτρο κατάστασης"
      >
        {QUOTE_FILTER_TABS.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={isActive}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                isActive ? premiumFilterTabActive : premiumFilterTabInactive,
              )}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {error ? (
        <DataError message={error} onRetry={() => setFetchKey((k) => k + 1)} />
      ) : null}

      {loading ? <QuotesTableSkeleton /> : null}

      {!loading && !error ? (
        <Card className={premiumTableWrap}>
          <CardContent className="overflow-x-auto p-0">
            <table className="w-full min-w-[960px] text-sm">
              <thead>
                <tr className={premiumTableHead}>
                  <th className="px-4 py-3 sm:px-6">#ID</th>
                  <th className="px-4 py-3">Πελάτης</th>
                  <th className="px-4 py-3">Εταιρεία</th>
                  <th className="px-4 py-3">Προϊόντα</th>
                  <th className="px-4 py-3">Ημερομηνία</th>
                  <th className="px-4 py-3">Κατάσταση</th>
                  <th className="px-4 py-3 text-right sm:pr-6">Ενέργειες</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-0">
                      <EmptyState
                        icon={FileQuestion}
                        title={
                          quotes.length === 0
                            ? "Δεν υπάρχουν αιτήματα προσφοράς"
                            : "Δεν βρέθηκαν αποτελέσματα"
                        }
                        description={
                          quotes.length === 0
                            ? "Όταν ένας πελάτης υποβάλει αίτημα από το portal, θα εμφανιστεί εδώ."
                            : "Δοκιμάστε άλλο φίλτρο κατάστασης."
                        }
                        className="py-10"
                      />
                    </td>
                  </tr>
                ) : (
                  filtered.map((quote) => (
                    <tr
                      key={quote.id}
                      className={cn(
                        premiumTableRow,
                        "cursor-pointer transition-colors",
                        highlightedIds.has(quote.id) && "bg-amber-50/80",
                        acceptedHighlightIds.has(quote.id) && "bg-emerald-50/80",
                      )}
                      onClick={() => router.push(`/quotes/${quote.id}`)}
                    >
                      <td className="px-4 py-3 font-mono text-xs text-muted-foreground sm:px-6">
                        #{quote.shortId}
                      </td>
                      <td className="px-4 py-3 font-medium text-kartex-navy">
                        {quote.contactName}
                      </td>
                      <td className="px-4 py-3 text-foreground">
                        {quote.companyName}
                      </td>
                      <td className="px-4 py-3 tabular-nums text-muted-foreground">
                        {quote.itemCount}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {quote.date}
                      </td>
                      <td className="px-4 py-3">
                        <QuoteStatusBadge status={quote.status} />
                      </td>
                      <td
                        className="px-4 py-3 text-right sm:pr-6"
                        onClick={(event) => event.stopPropagation()}
                      >
                        <div className="flex flex-wrap items-center justify-end gap-2">
                          {quote.status === "accepted" && quote.orderId ? (
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              asChild
                              className="border-emerald-200 text-emerald-800 hover:bg-emerald-50"
                            >
                              <Link href={`/orders/${quote.orderId}`}>
                                <Package className="mr-1.5 size-4" />
                                Δείτε την Παραγγελία
                              </Link>
                            </Button>
                          ) : null}
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            asChild
                            className="border-gray-200"
                          >
                            <Link href={`/quotes/${quote.id}`}>
                              <Eye className="mr-1.5 size-4" />
                              Προβολή
                            </Link>
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
