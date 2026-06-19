"use client";

import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import * as React from "react";
import { toast } from "sonner";

import { QuoteStatusBadge } from "@/components/quotes/quote-status-badge";
import type { QuoteDetail, QuoteDetailItem, QuoteRequestStatus } from "@/components/quotes/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useNotificationsStore } from "@/lib/notifications-store";
import { createClient } from "@/lib/supabase/client";
import {
  premiumGoldButton,
  premiumTableHead,
  premiumTableRow,
  premiumTableWrap,
} from "@/lib/ui/premium-styles";
import { formatCurrencyEl, formatDateEl } from "@/types/database";
import { cn } from "@/lib/utils";

type QuoteDetailViewProps = {
  quote: QuoteDetail;
};

type ItemPriceState = Record<string, string>;

function parsePrice(value: string): number | null {
  const trimmed = value.trim();
  if (!trimmed) return null;
  const n = Number.parseFloat(trimmed.replace(",", "."));
  return Number.isFinite(n) && n >= 0 ? n : null;
}

export function QuoteDetailView({ quote: initialQuote }: QuoteDetailViewProps) {
  const router = useRouter();
  const bumpQuotes = useNotificationsStore((state) => state.bumpQuotes);
  const [quote, setQuote] = React.useState(initialQuote);
  const [internalNotes, setInternalNotes] = React.useState(
    initialQuote.internalNotes ?? "",
  );
  const [itemPrices, setItemPrices] = React.useState<ItemPriceState>(() => {
    const initial: ItemPriceState = {};
    for (const item of initialQuote.items) {
      initial[item.id] =
        item.quotedPrice != null ? String(item.quotedPrice) : "";
    }
    return initial;
  });
  const [saving, setSaving] = React.useState<QuoteRequestStatus | null>(null);

  React.useEffect(() => {
    setQuote(initialQuote);
    setInternalNotes(initialQuote.internalNotes ?? "");
    const next: ItemPriceState = {};
    for (const item of initialQuote.items) {
      next[item.id] = item.quotedPrice != null ? String(item.quotedPrice) : "";
    }
    setItemPrices(next);
  }, [initialQuote]);

  const totalQuoted = React.useMemo(() => {
    return quote.items.reduce((sum: number, item: QuoteDetailItem) => {
      const price = parsePrice(itemPrices[item.id] ?? "");
      if (price === null) return sum;
      return sum + price * item.quantity;
    }, 0);
  }, [quote.items, itemPrices]);

  async function updateStatus(targetStatus: QuoteRequestStatus) {
    if (targetStatus === "quoted") {
      const missingPrice = quote.items.some(
        (item) => parsePrice(itemPrices[item.id] ?? "") === null,
      );
      if (missingPrice) {
        toast.error("Συμπληρώστε τιμή μονάδας για όλα τα προϊόντα πριν την αποστολή.");
        return;
      }
    }

    setSaving(targetStatus);
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (targetStatus === "quoted") {
      for (const item of quote.items) {
        const price = parsePrice(itemPrices[item.id] ?? "");
        const { error: itemError } = await supabase
          .from("quote_request_items")
          .update({ quoted_price: price })
          .eq("id", item.id);

        if (itemError) {
          setSaving(null);
          toast.error(itemError.message || "Αποτυχία αποθήκευσης τιμών.");
          return;
        }
      }
    }

    const patch: Record<string, unknown> = {
      status: targetStatus,
      internal_notes: internalNotes.trim() || null,
    };

    if (targetStatus === "quoted") {
      patch.quoted_at = new Date().toISOString();
      patch.responded_by = user?.id ?? null;
    }

    const { error } = await supabase
      .from("quote_requests")
      .update(patch)
      .eq("id", quote.id);

    setSaving(null);

    if (error) {
      toast.error(error.message || "Αποτυχία ενημέρωσης αιτήματος.");
      return;
    }

    const messages: Record<QuoteRequestStatus, string> = {
      pending: "Το αίτημα ενημερώθηκε.",
      reviewing: "Το αίτημα τέθηκε σε εξέταση.",
      quoted: "Η προσφορά στάλθηκε στον πελάτη.",
      accepted: "Το αίτημα ενημερώθηκε.",
      rejected: "Το αίτημα απορρίφθηκε.",
      cancelled: "Το αίτημα ακυρώθηκε.",
    };

    toast.success(messages[targetStatus]);
    setQuote((current) => ({
      ...current,
      status: targetStatus,
      internalNotes: internalNotes.trim() || null,
      quotedAt:
        targetStatus === "quoted" ? new Date().toISOString() : current.quotedAt,
      items:
        targetStatus === "quoted"
          ? current.items.map((item) => ({
              ...item,
              quotedPrice: parsePrice(itemPrices[item.id] ?? ""),
            }))
          : current.items,
    }));
    bumpQuotes();
    router.refresh();
  }

  const isFinal =
    quote.status === "accepted" ||
    quote.status === "rejected" ||
    quote.status === "cancelled";

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <Link
        href="/quotes"
        className="inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-kartex-navy"
      >
        <ArrowLeft className="size-4" />
        Πίσω στα αιτήματα
      </Link>

      <div className="rounded-2xl bg-gradient-to-br from-navy-900 to-navy-950 p-6 text-white shadow-lg sm:p-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-medium uppercase tracking-widest text-gold-400">
              Αίτημα #{quote.shortId}
            </p>
            <h1 className="mt-2 text-2xl font-bold sm:text-3xl">
              {quote.companyName}
            </h1>
            <p className="mt-1 text-white/70">{quote.contactName}</p>
          </div>
          <QuoteStatusBadge
            status={quote.status}
            className="bg-white/10 text-white ring-white/20"
          />
        </div>
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <p className="text-xs uppercase tracking-wide text-white/50">Email</p>
            <p className="mt-1 text-sm">{quote.email}</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wide text-white/50">Τηλέφωνο</p>
            <p className="mt-1 text-sm">{quote.phone ?? "—"}</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wide text-white/50">Ημερομηνία</p>
            <p className="mt-1 text-sm">{formatDateEl(quote.createdAt)}</p>
          </div>
          {quote.quotedAt ? (
            <div>
              <p className="text-xs uppercase tracking-wide text-white/50">Προσφορά</p>
              <p className="mt-1 text-sm">{formatDateEl(quote.quotedAt)}</p>
            </div>
          ) : null}
        </div>
        {quote.clientNotes ? (
          <div className="mt-4 rounded-xl bg-white/5 p-4">
            <p className="text-xs uppercase tracking-wide text-white/50">
              Σημειώσεις πελάτη
            </p>
            <p className="mt-1 text-sm text-white/90">{quote.clientNotes}</p>
          </div>
        ) : null}
      </div>

      <Card className={premiumTableWrap}>
        <CardHeader>
          <CardTitle className="text-lg text-kartex-navy">Προϊόντα αιτήματος</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto p-0">
          <table className="w-full min-w-[720px] text-sm">
            <thead>
              <tr className={premiumTableHead}>
                <th className="px-4 py-3 sm:px-6">Προϊόν</th>
                <th className="px-4 py-3">Ποσότητα</th>
                <th className="px-4 py-3">Μονάδα</th>
                <th className="px-4 py-3">Σημειώσεις</th>
                <th className="px-4 py-3 sm:pr-6">Τιμή μονάδας (€)</th>
              </tr>
            </thead>
            <tbody>
              {quote.items.map((item) => (
                <tr key={item.id} className={premiumTableRow}>
                  <td className="px-4 py-3 sm:px-6">
                    <p className="font-medium text-kartex-navy">{item.productName}</p>
                    {item.color || item.dimensions || item.material ? (
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {[item.color, item.dimensions, item.material]
                          .filter(Boolean)
                          .join(" · ")}
                      </p>
                    ) : null}
                  </td>
                  <td className="px-4 py-3 tabular-nums">{item.quantity}</td>
                  <td className="px-4 py-3 text-muted-foreground">{item.unit}</td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {item.notes || "—"}
                  </td>
                  <td className="px-4 py-3 sm:pr-6">
                    <Input
                      type="number"
                      min={0}
                      step="0.01"
                      inputMode="decimal"
                      value={itemPrices[item.id] ?? ""}
                      onChange={(event) =>
                        setItemPrices((current) => ({
                          ...current,
                          [item.id]: event.target.value,
                        }))
                      }
                      disabled={isFinal || saving !== null}
                      className="max-w-[140px]"
                      placeholder="0,00"
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>

      <Card className="border-border/80 shadow-sm">
        <CardContent className="flex flex-wrap items-center justify-between gap-4 p-6">
          <div>
            <p className="text-sm text-muted-foreground">Σύνολο προσφοράς</p>
            <p className="text-2xl font-bold tabular-nums text-kartex-navy">
              {formatCurrencyEl(totalQuoted)}
            </p>
          </div>
        </CardContent>
      </Card>

      <Card className="border-border/80 shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg text-kartex-navy">Εσωτερικές σημειώσεις</CardTitle>
        </CardHeader>
        <CardContent>
          <Label htmlFor="internal-notes" className="sr-only">
            Εσωτερικές σημειώσεις
          </Label>
          <textarea
            id="internal-notes"
            rows={3}
            value={internalNotes}
            onChange={(event) => setInternalNotes(event.target.value)}
            disabled={isFinal || saving !== null}
            placeholder="Σημειώσεις για την ομάδα…"
            className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-500/40"
          />
        </CardContent>
      </Card>

      {!isFinal ? (
        <div className="flex flex-wrap gap-3">
          <Button
            type="button"
            variant="outline"
            disabled={saving !== null}
            onClick={() => void updateStatus("reviewing")}
          >
            {saving === "reviewing" ? "Αποθήκευση…" : "Σε Εξέταση"}
          </Button>
          <Button
            type="button"
            variant="outline"
            className="border-red-200 text-red-700 hover:bg-red-50"
            disabled={saving !== null}
            onClick={() => void updateStatus("rejected")}
          >
            {saving === "rejected" ? "Αποθήκευση…" : "Απόρριψη"}
          </Button>
          <Button
            type="button"
            className={cn(premiumGoldButton)}
            disabled={saving !== null}
            onClick={() => void updateStatus("quoted")}
          >
            {saving === "quoted" ? "Αποστολή…" : "Αποστολή Προσφοράς"}
          </Button>
        </div>
      ) : null}
    </div>
  );
}
