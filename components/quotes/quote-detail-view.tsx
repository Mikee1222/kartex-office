"use client";

import { FileQuestion, Package, Trash2, Truck } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import * as React from "react";
import { toast } from "sonner";

import { QuoteStatusBadge } from "@/components/quotes/quote-status-badge";
import {
  quoteDisplayNames,
  type QuoteDetail,
  type QuoteDetailItem,
  type QuoteRequestStatus,
} from "@/components/quotes/types";
import {
  ProductDetailBackLink,
  ProductDetailHero,
} from "@/components/products/product-detail-ui";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useNotificationsStore } from "@/lib/notifications-store";
import { createClient } from "@/lib/supabase/client";
import {
  premiumCard,
  premiumDangerButton,
  premiumFormCard,
  premiumGoldButton,
  premiumLabel,
  premiumSecondaryButton,
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

  const { primary: displayName, contact: contactSubtitle, showContact } =
    quoteDisplayNames(quote);

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

  async function handleDelete() {
    if (!confirm("Διαγραφή αυτού του αιτήματος προσφοράς;")) return;
    const supabase = createClient();
    const { error } = await supabase
      .from("quote_requests")
      .delete()
      .eq("id", quote.id);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Αίτημα διαγράφηκε");
    router.push("/quotes");
  }

  const isFinal =
    quote.status === "accepted" ||
    quote.status === "rejected" ||
    quote.status === "cancelled";

  return (
    <div className="mx-auto max-w-5xl space-y-6 pb-12">
      <ProductDetailBackLink href="/quotes" label="Πίσω στα αιτήματα" />

      <ProductDetailHero
        title={displayName}
        icon={<FileQuestion className="size-7" aria-hidden />}
        badges={
          <>
            <span className="rounded-md bg-gold-500/15 px-2.5 py-1 font-mono text-sm font-semibold text-gold-300 ring-1 ring-gold-500/25 backdrop-blur-sm">
              #{quote.shortId}
            </span>
            <QuoteStatusBadge
              status={quote.status}
              className="bg-gold-500/15 text-gold-200 ring-1 ring-gold-500/25"
            />
          </>
        }
        action={
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => void handleDelete()}
            className="h-9 w-9 border-red-300/40 bg-white/5 p-0 text-red-300 hover:bg-red-500/20 hover:text-red-200"
          >
            <Trash2 size={15} />
          </Button>
        }
      />

      <div className={cn(premiumCard, "p-5 sm:p-6")}>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {showContact ? (
            <div>
              <p className={premiumLabel}>Υπεύθυνος</p>
              <p className="mt-1 text-sm font-medium text-navy-900">{contactSubtitle}</p>
            </div>
          ) : null}
          <div>
            <p className={premiumLabel}>Email</p>
            <p className="mt-1 text-sm font-medium text-navy-900">{quote.email}</p>
          </div>
          <div>
            <p className={premiumLabel}>Τηλέφωνο</p>
            <p className="mt-1 text-sm font-medium text-navy-900">
              {quote.phone ?? "—"}
            </p>
          </div>
          <div>
            <p className={premiumLabel}>Ημερομηνία</p>
            <p className="mt-1 text-sm font-medium text-navy-900">
              {formatDateEl(quote.createdAt)}
            </p>
          </div>
          {quote.quotedAt ? (
            <div>
              <p className={premiumLabel}>Προσφορά</p>
              <p className="mt-1 text-sm font-medium text-navy-900">
                {formatDateEl(quote.quotedAt)}
              </p>
            </div>
          ) : null}
        </div>
        {quote.clientNotes ? (
          <div className="mt-5 rounded-xl border border-gray-100 bg-gray-50/60 p-4">
            <p className={premiumLabel}>Σημειώσεις πελάτη</p>
            <p className="mt-1.5 text-sm leading-relaxed text-gray-700">
              {quote.clientNotes}
            </p>
          </div>
        ) : null}
      </div>

      {quote.deliveryMethod ? (
        <div className={cn(premiumCard, "p-5 sm:p-6")}>
          <h3 className="mb-4 flex items-center gap-2 text-sm font-bold text-navy-900">
            <Truck size={16} className="text-gold-500" aria-hidden />
            Παράδοση
          </h3>
          <div className="space-y-2 text-sm leading-relaxed text-gray-700">
            {quote.deliveryRecipientName ? (
              <p>
                <span className="font-medium text-navy-900">Παραλήπτης:</span>{" "}
                {quote.deliveryRecipientName}
              </p>
            ) : null}
            {quote.deliveryMethod === "pickup" ? (
              <p>
                <span className="font-medium text-navy-900">Παραλαβή από πρακτορείο:</span>{" "}
                {quote.pickupAgency ?? "—"}
              </p>
            ) : (
              <p>
                <span className="font-medium text-navy-900">Διεύθυνση:</span>{" "}
                {[quote.deliveryAddress, quote.deliveryCity, quote.deliveryPostalCode]
                  .filter(Boolean)
                  .join(", ") || "—"}
              </p>
            )}
          </div>
        </div>
      ) : null}

      <div className={premiumTableWrap}>
        <div className="border-b border-gray-100 px-5 py-4 sm:px-6">
          <h2 className="text-sm font-bold text-navy-900">Προϊόντα αιτήματος</h2>
          <p className="mt-0.5 text-xs text-gray-400">
            {quote.items.length}{" "}
            {quote.items.length === 1 ? "προϊόν" : "προϊόντα"}
          </p>
        </div>
        <div className="overflow-x-auto">
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
                    <p className="font-medium text-navy-900">{item.productName}</p>
                    {item.color || item.dimensions || item.material ? (
                      <p className="mt-0.5 text-xs text-gray-400">
                        {[item.color, item.dimensions, item.material]
                          .filter(Boolean)
                          .join(" · ")}
                      </p>
                    ) : null}
                  </td>
                  <td className="px-4 py-3 tabular-nums text-navy-900">{item.quantity}</td>
                  <td className="px-4 py-3 text-gray-500">{item.unit}</td>
                  <td className="px-4 py-3 text-gray-500">{item.notes || "—"}</td>
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
        </div>
      </div>

      <div
        className={cn(
          premiumCard,
          "border-gold-500/25 bg-gradient-to-br from-gold-500/[0.07] via-white to-white p-6 sm:p-8",
        )}
      >
        <p className={premiumLabel}>Σύνολο προσφοράς</p>
        <p className="mt-2 text-3xl font-bold tabular-nums tracking-tight text-gold-600 sm:text-4xl">
          {formatCurrencyEl(totalQuoted)}
        </p>
      </div>

      <div className={premiumFormCard}>
        <h2 className="text-sm font-bold text-navy-900">Εσωτερικές σημειώσεις</h2>
        <div className="mt-4">
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
            className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-500/40"
          />
        </div>
      </div>

      {!isFinal ? (
        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            disabled={saving !== null}
            onClick={() => void updateStatus("reviewing")}
            className={cn(premiumSecondaryButton, "disabled:opacity-60")}
          >
            {saving === "reviewing" ? "Αποθήκευση…" : "Σε Εξέταση"}
          </button>
          <button
            type="button"
            disabled={saving !== null}
            onClick={() => void updateStatus("rejected")}
            className={cn(premiumDangerButton, "disabled:opacity-60")}
          >
            {saving === "rejected" ? "Αποθήκευση…" : "Απόρριψη"}
          </button>
          <button
            type="button"
            disabled={saving !== null}
            onClick={() => void updateStatus("quoted")}
            className={cn(premiumGoldButton, "disabled:opacity-60")}
          >
            {saving === "quoted" ? "Αποστολή…" : "Αποστολή Προσφοράς"}
          </button>
        </div>
      ) : quote.status === "accepted" && quote.orderId ? (
        <Button
          type="button"
          variant="outline"
          asChild
          className="border-emerald-200 text-emerald-800 hover:bg-emerald-50"
        >
          <Link href={`/orders/${quote.orderId}`}>
            <Package className="mr-2 size-4" />
            Δείτε την Παραγγελία
          </Link>
        </Button>
      ) : null}
    </div>
  );
}
