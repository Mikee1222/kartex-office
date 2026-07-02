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
  Trash2,
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
  quoteDisplayNames,
  type QuoteFilterTab,
  type QuoteListItem,
  type QuoteRequestStatus,
} from "@/components/quotes/types";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";
import { Skeleton } from "@/components/ui/skeleton";
import { useNotificationsStore } from "@/lib/notifications-store";
import { createClient } from "@/lib/supabase/client";
import {
  premiumFilterTabActive,
  premiumFilterTabActiveGold,
  premiumFilterTabInactive,
  premiumPageSubtitle,
  premiumStatCard,
} from "@/lib/ui/premium-styles";
import { mapQuoteRequestRow, type QuoteRequestRow } from "@/types/database";
import { cn } from "@/lib/utils";

const ITEMS_PER_PAGE = 10;

type QuotesListProps = {
  initialQuotes: QuoteListItem[];
};

function quoteInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0] ?? ""}${parts[1][0] ?? ""}`.toUpperCase();
}

function statusAccent(status: QuoteRequestStatus): {
  icon: React.ReactNode;
  avatarClass: string;
} {
  switch (status) {
    case "pending":
    case "reviewing":
      return {
        icon: <Clock size={14} className="text-amber-500" aria-hidden />,
        avatarClass: "bg-amber-50 text-amber-700",
      };
    case "quoted":
      return {
        icon: <MessageSquare size={14} className="text-blue-500" aria-hidden />,
        avatarClass: "bg-blue-50 text-blue-700",
      };
    case "accepted":
      return {
        icon: <CheckCircle2 size={14} className="text-emerald-500" aria-hidden />,
        avatarClass: "bg-emerald-50 text-emerald-700",
      };
    case "rejected":
    case "cancelled":
      return {
        icon: <XCircle size={14} className="text-red-400" aria-hidden />,
        avatarClass: "bg-red-50 text-red-600",
      };
    default:
      return {
        icon: null,
        avatarClass: "bg-gray-50 text-gray-600",
      };
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

  async function handleDelete(quoteId: string, e: React.MouseEvent) {
    e.stopPropagation();
    if (!confirm("Διαγραφή αυτού του αιτήματος;")) return;
    const supabase = createClient();
    const { error } = await supabase
      .from("quote_requests")
      .delete()
      .eq("id", quoteId);
    if (error) {
      toast.error(error.message);
      return;
    }
    setQuotes((c) => c.filter((q) => q.id !== quoteId));
    toast.success("Αίτημα διαγράφηκε");
  }

  const statCards = [
    {
      label: "Εκκρεμή",
      value: pendingCount,
      icon: Clock,
      tone: "text-amber-600",
      border: "border-amber-200/60",
    },
    {
      label: "Απεστάλησαν",
      value: quotedCount,
      icon: MessageSquare,
      tone: "text-blue-600",
      border: "border-blue-200/60",
    },
    {
      label: "Αποδεκτά",
      value: acceptedCount,
      icon: CheckCircle2,
      tone: "text-emerald-600",
      border: "border-emerald-200/60",
    },
  ] as const;

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <PageHeader
        title="Αιτήματα Προσφοράς"
        subtitle={
          <span className={premiumPageSubtitle}>
            Αιτήματα από το B2B portal — προσθέστε τιμές και απαντήστε στους πελάτες.
          </span>
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {statCards.map((stat) => (
          <article
            key={stat.label}
            className={cn(premiumStatCard, "flex items-center gap-4 p-5", stat.border)}
          >
            <span
              className={cn(
                "flex size-11 shrink-0 items-center justify-center rounded-xl bg-white shadow-sm",
                stat.tone,
              )}
            >
              <stat.icon size={20} aria-hidden />
            </span>
            <div>
              <p className={cn("text-3xl font-semibold tabular-nums leading-none", stat.tone)}>
                {stat.value}
              </p>
              <p className="mt-1 text-xs font-semibold uppercase tracking-wide text-gray-400">
                {stat.label}
              </p>
            </div>
          </article>
        ))}
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
                "inline-flex items-center gap-2",
                isActive
                  ? tab.id === "all"
                    ? premiumFilterTabActive
                    : premiumFilterTabActiveGold
                  : premiumFilterTabInactive,
              )}
            >
              {tab.label}
              <span
                className={cn(
                  "rounded-full px-1.5 py-0.5 text-xs font-bold tabular-nums",
                  isActive
                    ? tab.id === "all"
                      ? "bg-white/15 text-white"
                      : "bg-gold-500/10 text-gold-600"
                    : "bg-gray-100 text-gray-500",
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
        <div className="space-y-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <Skeleton key={index} className="h-28 rounded-2xl" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className={cn(premiumStatCard, "px-8 py-12 text-center")}>
          <FileQuestion
            size={40}
            className="mx-auto mb-3 text-gray-300"
            aria-hidden
          />
          <p className="font-semibold text-navy-900">
            {quotes.length === 0
              ? "Δεν υπάρχουν αιτήματα προσφοράς"
              : "Δεν βρέθηκαν αποτελέσματα"}
          </p>
          <p className="mt-1 text-sm text-gray-400">
            {quotes.length === 0
              ? "Όταν ένας πελάτης υποβάλει αίτημα από το portal, θα εμφανιστεί εδώ."
              : "Δοκιμάστε άλλο φίλτρο."}
          </p>
        </div>
      ) : (
        <>
          <div className="space-y-3">
            {paginated.map((quote) => {
              const { primary, showContact, contact } = quoteDisplayNames(quote);
              const { icon, avatarClass } = statusAccent(quote.status);
              const isHighlighted = highlightedIds.has(quote.id);
              const isAccepted = acceptedHighlightIds.has(quote.id);

              return (
                <div
                  key={quote.id}
                  className={cn(
                    "group cursor-pointer rounded-2xl border border-gray-200/80 bg-white p-5 shadow-sm transition-all duration-200 hover:border-gold-500/30 hover:shadow-md",
                    isHighlighted && "border-amber-300 ring-2 ring-amber-400/60",
                    isAccepted && "border-emerald-300 ring-2 ring-emerald-400/60",
                  )}
                  onClick={() => router.push(`/quotes/${quote.id}`)}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex min-w-0 items-start gap-4">
                      <span
                        className={cn(
                          "flex size-11 shrink-0 items-center justify-center rounded-xl text-sm font-bold transition-colors group-hover:bg-gold-500/10",
                          avatarClass,
                        )}
                      >
                        {quoteInitials(primary)}
                      </span>

                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-mono text-sm font-bold text-gold-600">
                            #{quote.shortId}
                          </span>
                          <span className="inline-flex items-center gap-1.5">
                            {icon}
                            <QuoteStatusBadge status={quote.status} />
                          </span>
                        </div>
                        <p className="mt-1 text-base font-semibold leading-tight text-navy-900">
                          {primary}
                        </p>
                        {showContact ? (
                          <p className="mt-0.5 text-sm text-gray-500">{contact}</p>
                        ) : null}
                        <p className="mt-1 text-xs text-gray-400">
                          {quote.date} · {quote.itemCount}{" "}
                          {quote.itemCount === 1 ? "προϊόν" : "προϊόντα"}
                        </p>
                      </div>
                    </div>

                    <div
                      className="flex shrink-0 items-center gap-2"
                      onClick={(event) => event.stopPropagation()}
                    >
                      {quote.status === "accepted" && quote.orderId ? (
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          asChild
                          className="hidden h-8 border-emerald-200 text-xs text-emerald-700 hover:bg-emerald-50 sm:inline-flex"
                        >
                          <Link href={`/orders/${quote.orderId}`}>
                            <Package size={13} className="mr-1" />
                            Παραγγελία
                          </Link>
                        </Button>
                      ) : null}
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        asChild
                        className="h-8 border-gold-500/30 text-xs text-navy-900 hover:bg-gold-500/5"
                      >
                        <Link href={`/quotes/${quote.id}`}>
                          <Eye size={13} className="mr-1" />
                          {quote.status === "pending" ||
                          quote.status === "reviewing"
                            ? "Προσθήκη Τιμών"
                            : "Προβολή"}
                        </Link>
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={(e) => void handleDelete(quote.id, e)}
                        className="h-8 w-8 shrink-0 border-red-200 p-0 text-red-500 hover:bg-red-50"
                      >
                        <Trash2 size={13} />
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {totalPages > 1 ? (
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-400">
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
                          "border-gold-500 bg-gold-500 text-navy-900 hover:bg-gold-400",
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
