"use client";

import {
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
  Eye,
  FileQuestion,
  MessageSquare,
  Package,
  XCircle,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import * as React from "react";
import { toast } from "sonner";

import { DataError } from "@/components/dashboard/data-error";
import { QuoteStatusBadge } from "@/components/quotes/quote-status-badge";
import {
  matchesQuoteFilterTab,
  QUOTE_FILTER_TABS,
  type QuoteFilterTab,
  type QuoteListItem,
  type QuoteRequestStatus,
} from "@/components/quotes/types";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";
import { Skeleton } from "@/components/ui/skeleton";
import { useNotificationsStore } from "@/lib/notifications-store";
import { createClient } from "@/lib/supabase/client";
import { mapQuoteRequestRow, type QuoteRequestRow } from "@/types/database";
import { cn } from "@/lib/utils";

const ITEMS_PER_PAGE = 10;

type QuotesListProps = {
  initialQuotes: QuoteListItem[];
};

function statusColor(status: QuoteRequestStatus) {
  switch (status) {
    case "pending":
    case "reviewing":
      return {
        border: "#FCD34D",
        bg: "#FFFBEB",
        icon: <Clock size={14} className="text-amber-500" />,
      };
    case "quoted":
      return {
        border: "#93C5FD",
        bg: "#EFF6FF",
        icon: <MessageSquare size={14} className="text-blue-500" />,
      };
    case "accepted":
      return {
        border: "#6EE7B7",
        bg: "#ECFDF5",
        icon: <CheckCircle2 size={14} className="text-emerald-500" />,
      };
    case "rejected":
    case "cancelled":
      return {
        border: "#FCA5A5",
        bg: "#FEF2F2",
        icon: <XCircle size={14} className="text-red-400" />,
      };
    default:
      return { border: "#E5E7EB", bg: "#F9FAFB", icon: null };
  }
}

export function QuotesList({ initialQuotes }: QuotesListProps) {
  const router = useRouter();
  const bumpQuotes = useNotificationsStore((state) => state.bumpQuotes);
  const [quotes, setQuotes] = React.useState<QuoteListItem[]>(initialQuotes);
  const [activeTab, setActiveTab] = React.useState<QuoteFilterTab>("all");
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [fetchKey, setFetchKey] = React.useState(0);
  const [currentPage, setCurrentPage] = React.useState(1);
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
      .select(
        "*, quote_request_items!quote_request_items_quote_request_id_fkey(count)",
      )
      .order("created_at", { ascending: false });

    if (fetchError) {
      setError(fetchError.message);
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
    setCurrentPage(1);
  }, [activeTab]);

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
          setQuotes((current) =>
            current.some((quote) => quote.id === mapped.id)
              ? current
              : [mapped, ...current],
          );
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

            return existing
              ? current.map((quote) =>
                  quote.id === row.id ? mapped : quote,
                )
              : [mapped, ...current];
          });

          if (row.status === "accepted" && oldRow.status !== "accepted") {
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
    () =>
      quotes.filter((quote) =>
        matchesQuoteFilterTab(quote.status, activeTab),
      ),
    [quotes, activeTab],
  );

  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));
  const paginated = filtered.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE,
  );

  const pendingCount = quotes.filter(
    (quote) => quote.status === "pending" || quote.status === "reviewing",
  ).length;
  const quotedCount = quotes.filter((quote) => quote.status === "quoted").length;
  const acceptedCount = quotes.filter(
    (quote) => quote.status === "accepted",
  ).length;

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <PageHeader
        title="Αιτήματα Προσφοράς"
        subtitle="Αιτήματα από το B2B portal — προσθέστε τιμές και απαντήστε στους πελάτες."
      />

      <div className="grid grid-cols-3 gap-4">
        <div className="flex items-center gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4">
          <Clock size={22} className="shrink-0 text-amber-500" />
          <div>
            <div className="text-2xl font-bold text-amber-700">
              {pendingCount}
            </div>
            <div className="text-xs font-semibold uppercase tracking-wide text-amber-500">
              Εκκρεμή
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3 rounded-2xl border border-blue-200 bg-blue-50 p-4">
          <MessageSquare size={22} className="shrink-0 text-blue-500" />
          <div>
            <div className="text-2xl font-bold text-blue-700">{quotedCount}</div>
            <div className="text-xs font-semibold uppercase tracking-wide text-blue-500">
              Απεστάλησαν
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
          <CheckCircle2 size={22} className="shrink-0 text-emerald-500" />
          <div>
            <div className="text-2xl font-bold text-emerald-700">
              {acceptedCount}
            </div>
            <div className="text-xs font-semibold uppercase tracking-wide text-emerald-500">
              Αποδεκτά
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-2" role="tablist">
        {QUOTE_FILTER_TABS.map((tab) => {
          const count =
            tab.id === "all"
              ? quotes.length
              : quotes.filter((quote) =>
                  matchesQuoteFilterTab(quote.status, tab.id),
                ).length;
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={isActive}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-all",
                isActive
                  ? "bg-kartex-gold text-white shadow-sm"
                  : "border border-border text-muted-foreground hover:bg-muted",
              )}
            >
              {tab.label}
              <span
                className={cn(
                  "rounded-full px-1.5 py-0.5 text-xs font-bold",
                  isActive
                    ? "bg-white/20 text-white"
                    : "bg-muted text-muted-foreground",
                )}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {error ? (
        <DataError message={error} onRetry={() => setFetchKey((key) => key + 1)} />
      ) : null}

      {loading ? (
        <div className="grid gap-4 md:grid-cols-2">
          {Array.from({ length: 6 }).map((_, index) => (
            <Skeleton key={index} className="h-36 rounded-2xl" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl border border-border bg-card p-12 text-center">
          <FileQuestion
            size={40}
            className="mx-auto mb-3 text-muted-foreground/40"
          />
          <p className="font-medium text-muted-foreground">
            {quotes.length === 0
              ? "Δεν υπάρχουν αιτήματα προσφοράς"
              : "Δεν βρέθηκαν αποτελέσματα"}
          </p>
          <p className="mt-1 text-sm text-muted-foreground/60">
            {quotes.length === 0
              ? "Όταν ένας πελάτης υποβάλει αίτημα από το portal, θα εμφανιστεί εδώ."
              : "Δοκιμάστε άλλο φίλτρο."}
          </p>
        </div>
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-2">
            {paginated.map((quote) => {
              const { border, bg, icon } = statusColor(quote.status);
              const isHighlighted = highlightedIds.has(quote.id);
              const isAccepted = acceptedHighlightIds.has(quote.id);

              return (
                <div
                  key={quote.id}
                  className={cn(
                    "cursor-pointer overflow-hidden rounded-2xl border bg-card transition-all duration-200 hover:shadow-md",
                    isHighlighted && "ring-2 ring-amber-400",
                    isAccepted && "ring-2 ring-emerald-400",
                  )}
                  style={{ borderColor: border }}
                  onClick={() => router.push(`/quotes/${quote.id}`)}
                >
                  <div className="px-5 py-4" style={{ background: bg }}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {icon}
                        <QuoteStatusBadge status={quote.status} />
                      </div>
                      <span className="font-mono text-xs text-muted-foreground">
                        #{quote.shortId}
                      </span>
                    </div>
                  </div>

                  <div className="px-5 py-4">
                    <div className="mb-3 flex items-start justify-between gap-3">
                      <div>
                        <div className="text-base font-bold leading-tight text-kartex-navy">
                          {quote.companyName || "—"}
                        </div>
                        <div className="mt-0.5 text-sm text-muted-foreground">
                          {quote.contactName || "—"}
                        </div>
                      </div>
                      <div className="shrink-0 text-right">
                        <div className="text-xs text-muted-foreground">
                          {quote.date}
                        </div>
                        <div className="mt-0.5 text-sm font-semibold text-kartex-navy">
                          {quote.itemCount}{" "}
                          {quote.itemCount === 1 ? "προϊόν" : "προϊόντα"}
                        </div>
                      </div>
                    </div>

                    <div
                      className="flex items-center gap-2 border-t border-border/50 pt-3"
                      onClick={(event) => event.stopPropagation()}
                    >
                      {quote.status === "accepted" && quote.orderId ? (
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          asChild
                          className="h-8 flex-1 border-emerald-200 text-xs text-emerald-700 hover:bg-emerald-50"
                        >
                          <Link href={`/orders/${quote.orderId}`}>
                            <Package size={13} className="mr-1" />
                            Δείτε Παραγγελία
                          </Link>
                        </Button>
                      ) : null}
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        asChild
                        className="h-8 flex-1 border-kartex-gold/30 text-xs text-kartex-navy hover:bg-kartex-gold/5"
                      >
                        <Link href={`/quotes/${quote.id}`}>
                          <Eye size={13} className="mr-1" />
                          {quote.status === "pending" ||
                          quote.status === "reviewing"
                            ? "Προσθήκη Τιμών"
                            : "Προβολή"}
                        </Link>
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {totalPages > 1 ? (
            <div className="flex items-center justify-between">
              <div className="text-sm text-muted-foreground">
                Εμφάνιση {(currentPage - 1) * ITEMS_PER_PAGE + 1}–
                {Math.min(currentPage * ITEMS_PER_PAGE, filtered.length)} από{" "}
                {filtered.length}
              </div>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage((page) => page - 1)}
                  className="h-8 w-8 p-0"
                >
                  <ChevronLeft size={16} />
                </Button>
                {Array.from({ length: totalPages }, (_, index) => index + 1).map(
                  (page) => (
                    <Button
                      key={page}
                      type="button"
                      size="sm"
                      variant={currentPage === page ? "default" : "outline"}
                      onClick={() => setCurrentPage(page)}
                      className={cn(
                        "h-8 w-8 p-0 text-xs",
                        currentPage === page &&
                          "border-kartex-gold bg-kartex-gold text-white hover:bg-kartex-gold/90",
                      )}
                    >
                      {page}
                    </Button>
                  ),
                )}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage((page) => page + 1)}
                  className="h-8 w-8 p-0"
                >
                  <ChevronRight size={16} />
                </Button>
              </div>
            </div>
          ) : null}
        </>
      )}
    </div>
  );
}
