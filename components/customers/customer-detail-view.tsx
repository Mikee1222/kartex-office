import { ArrowLeft, Pencil, ShoppingCart } from "lucide-react";
import Link from "next/link";

import { CustomerSourceBadge } from "@/components/customers/customer-source-badge";
import { CustomerTypeBadge } from "@/components/customers/customer-type-badge";
import { OrderStatusBadge } from "@/components/orders/order-status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  premiumGoldButton,
  premiumStatCard,
  premiumTableHead,
  premiumTableRow,
  premiumTableWrap,
} from "@/lib/ui/premium-styles";
import {
  formatCurrencyEl,
  formatDateEl,
  mapDbCustomerSource,
  mapDbCustomerType,
  normalizeOrderStatus,
  type CustomerRow,
} from "@/types/database";
import { cn } from "@/lib/utils";

export type CustomerOrderRow = {
  id: string;
  order_number: string;
  status: string;
  total: number | string;
  delivery_date: string | null;
  created_at: string;
};

export type CustomerDetailData = {
  customer: CustomerRow;
  orders: CustomerOrderRow[];
  stats: {
    totalOrders: number;
    totalPurchasesEur: number;
    lastOrderDate: string | null;
  };
};

type CustomerDetailViewProps = {
  customerId: string;
  data: CustomerDetailData;
};

function toNumber(value: number | string | null | undefined): number {
  if (value === null || value === undefined) return 0;
  const n = typeof value === "number" ? value : Number.parseFloat(String(value));
  return Number.isFinite(n) ? n : 0;
}

function DetailField({
  label,
  value,
  className,
}: {
  label: string;
  value: string;
  className?: string;
}) {
  return (
    <div className={className}>
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <p className="mt-0.5 text-sm text-foreground">{value}</p>
    </div>
  );
}

export function CustomerDetailView({ customerId, data }: CustomerDetailViewProps) {
  const { customer, orders, stats } = data;
  const typeLabel = mapDbCustomerType(customer.type);
  const sourceLabel = mapDbCustomerSource(customer.source);
  const creditLimit = toNumber(customer.credit_limit);

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <Link
        href="/customers"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-kartex-navy"
      >
        <ArrowLeft className="size-4" aria-hidden />
        Πελάτες
      </Link>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-2">
          <h1 className="text-2xl font-semibold tracking-tight text-kartex-navy">
            {customer.name}
          </h1>
          <div className="flex flex-wrap items-center gap-2">
            <CustomerTypeBadge type={typeLabel} />
            <CustomerSourceBadge source={sourceLabel} />
          </div>
        </div>
        <Button
          asChild
          className={cn(premiumGoldButton, "shrink-0")}
        >
          <Link href={`/customers/${customerId}/edit`}>
            <Pencil className="size-4" />
            Επεξεργασία
          </Link>
        </Button>
      </div>

      <section className="grid gap-4 sm:grid-cols-3">
        <article className={cn(premiumStatCard, "p-5")}>
          <p className="text-[28px] font-semibold leading-none text-navy-900">
            {stats.totalOrders}
          </p>
          <p className="mt-1 text-sm text-gray-400">Παραγγελίες</p>
        </article>
        <article className={cn(premiumStatCard, "p-5")}>
          <p className="text-[28px] font-semibold leading-none text-navy-900">
            {formatCurrencyEl(stats.totalPurchasesEur)}
          </p>
          <p className="mt-1 text-sm text-gray-400">Σύνολο αγορών</p>
        </article>
        <article className={cn(premiumStatCard, "p-5")}>
          <p className="text-[28px] font-semibold leading-none text-navy-900">
            {stats.lastOrderDate ? formatDateEl(stats.lastOrderDate) : "—"}
          </p>
          <p className="mt-1 text-sm text-gray-400">Τελευταία παραγγελία</p>
        </article>
      </section>

      <Card className="border-border/80 shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg text-kartex-navy">Στοιχεία επικοινωνίας</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <DetailField label="ΑΦΜ" value={customer.vat?.trim() || "—"} />
          <DetailField label="Τηλέφωνο" value={customer.phone?.trim() || "—"} />
          <DetailField label="Email" value={customer.email?.trim() || "—"} />
          <DetailField label="Πόλη" value={customer.city?.trim() || "—"} />
          <DetailField
            label="Διεύθυνση"
            value={customer.address?.trim() || "—"}
            className="sm:col-span-2"
          />
          <DetailField
            label="Τρόποι πληρωμής"
            value={customer.payment_terms?.trim() || "—"}
          />
          <DetailField
            label="Πιστωτικό όριο"
            value={formatCurrencyEl(creditLimit)}
          />
          {customer.notes?.trim() ? (
            <DetailField
              label="Σημειώσεις"
              value={customer.notes.trim()}
              className="sm:col-span-2"
            />
          ) : null}
        </CardContent>
      </Card>

      <Card className={premiumTableWrap}>
        <CardHeader className="border-b border-gray-100">
          <CardTitle className="flex items-center gap-2 text-lg text-kartex-navy">
            <ShoppingCart className="size-5 text-gold-500" aria-hidden />
            Παραγγελίες
          </CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto p-0">
          {orders.length === 0 ? (
            <p className="px-6 py-10 text-center text-sm text-muted-foreground">
              Δεν υπάρχουν παραγγελίες για αυτόν τον πελάτη.
            </p>
          ) : (
            <table className="w-full min-w-[640px] text-sm">
              <thead>
                <tr className={premiumTableHead}>
                  <th className="px-4 py-3 sm:px-6">Αριθμός</th>
                  <th className="px-4 py-3">Κατάσταση</th>
                  <th className="px-4 py-3">Ποσό</th>
                  <th className="px-4 py-3">Παράδοση</th>
                  <th className="px-4 py-3 sm:pr-6">Ημ/νία</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => (
                  <tr key={order.id} className={premiumTableRow}>
                    <td className="px-4 py-3 sm:px-6">
                      <Link
                        href={`/orders/${order.id}`}
                        className="font-mono font-semibold text-navy-900 transition-colors hover:text-gold-500"
                      >
                        {order.order_number}
                      </Link>
                    </td>
                    <td className="px-4 py-3">
                      <OrderStatusBadge
                        status={normalizeOrderStatus(order.status)}
                      />
                    </td>
                    <td className="px-4 py-3 font-semibold tabular-nums text-navy-900">
                      {formatCurrencyEl(toNumber(order.total))}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {formatDateEl(order.delivery_date)}
                    </td>
                    <td className="px-4 py-3 sm:pr-6 text-muted-foreground">
                      {formatDateEl(order.created_at)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
