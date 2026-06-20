"use client";

import {
  AlertCircle,
  CheckCircle2,
  Circle,
  Clock,
  CreditCard,
  Download,
  Package,
  Pencil,
  Printer,
  Truck,
  XCircle,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import * as React from "react";
import { toast } from "sonner";

import { OrderStatus } from "@/components/orders/types";

import {
  type OrderDetail,
  type OrderTripInfo,
} from "@/components/orders/order-detail-types";
import { PartialDeliveryModal } from "@/components/orders/partial-delivery-modal";
import { OrderStatusDropdown } from "@/components/orders/order-status-dropdown";
import { OrderStatusTimeline } from "@/components/orders/order-status-timeline";
import { WarehouseStatusCard } from "@/components/orders/warehouse-status-card";
import { fetchOrderDetailById } from "@/lib/orders/fetch-order-detail-client";
import { fetchBoxPhotos, type OrderBoxPhoto } from "@/lib/orders/order-photos";
import { DriverAssignmentSection } from "@/components/orders/driver-assignment-section";
import { updateOrderStatus } from "@/lib/orders/update-order-status";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { premiumCard, premiumGoldButton, premiumLabel } from "@/lib/ui/premium-styles";
import { premiumSelect } from "@/lib/ui/form-styles";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { formatDateEl } from "@/types/database";
import { cn } from "@/lib/utils";

type OrderDetailViewProps = {
  orderId: string;
  initialOrder: OrderDetail;
};

function formatEur(value: number) {
  return new Intl.NumberFormat("el-GR", {
    style: "currency",
    currency: "EUR",
  }).format(value);
}

const WAREHOUSE_VISIBLE_STATUSES: OrderStatus[] = [
  OrderStatus.Confirmed,
  OrderStatus.ReadyForShipment,
];

export function OrderDetailView({ orderId, initialOrder }: OrderDetailViewProps) {
  const router = useRouter();
  const [order, setOrder] = React.useState(initialOrder);
  const [boxPhotos, setBoxPhotos] = React.useState<OrderBoxPhoto[]>([]);
  const [loadingPhotos, setLoadingPhotos] = React.useState(false);
  const [internalNotes, setInternalNotes] = React.useState(order.notes.internal);
  const [clientNotes, setClientNotes] = React.useState(order.notes.client);
  const [cancelling, setCancelling] = React.useState(false);
  const [cancelError, setCancelError] = React.useState<string | null>(null);
  const [confirmingPayment, setConfirmingPayment] = React.useState(false);
  const [isLive, setIsLive] = React.useState(false);

  const showWarehouseStatus =
    WAREHOUSE_VISIBLE_STATUSES.includes(order.status) ||
    order.boxesCount != null ||
    Boolean(order.boxesNotes?.trim()) ||
    boxPhotos.length > 0;

  React.useEffect(() => {
    setOrder(initialOrder);
    setInternalNotes(initialOrder.notes.internal);
    setClientNotes(initialOrder.notes.client);
  }, [initialOrder]);

  const refreshOrder = React.useCallback(async () => {
    const next = await fetchOrderDetailById(orderId);
    if (!next) return;
    setOrder(next);
    setInternalNotes(next.notes.internal);
    setClientNotes(next.notes.client);
  }, [orderId]);

  const refreshBoxPhotos = React.useCallback(async () => {
    setLoadingPhotos(true);
    const photos = await fetchBoxPhotos(orderId);
    setBoxPhotos(photos);
    setLoadingPhotos(false);
  }, [orderId]);

  React.useEffect(() => {
    void refreshBoxPhotos();
  }, [refreshBoxPhotos]);

  React.useEffect(() => {
    const supabase = createClient();
    setIsLive(false);

    const channel = supabase
      .channel(`order-${orderId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "orders",
          filter: `id=eq.${orderId}`,
        },
        (payload) => {
          const oldRow = payload.old as Record<string, unknown> | undefined;
          const newRow = payload.new as Record<string, unknown>;
          void refreshOrder();
          void refreshBoxPhotos();

          const warehouseChanged =
            oldRow?.boxes_count !== newRow?.boxes_count ||
            oldRow?.boxes_notes !== newRow?.boxes_notes;
          if (warehouseChanged && oldRow?.status === newRow?.status) {
            toast.success("Η αποθήκη ενημέρωσε την παραγγελία");
          }
        },
      )
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "order_photos",
          filter: `order_id=eq.${orderId}`,
        },
        () => {
          void refreshBoxPhotos();
          toast.success("Νέα φωτογραφία από την αποθήκη");
        },
      )
      .subscribe((status) => {
        if (status === "SUBSCRIBED") {
          setIsLive(true);
        }
      });

    return () => {
      setIsLive(false);
      void supabase.removeChannel(channel);
    };
  }, [orderId, refreshOrder, refreshBoxPhotos]);

  function handleOrderUpdated() {
    void refreshOrder();
    router.refresh();
  }

  async function handleConfirmPayment() {
    setConfirmingPayment(true);
    const supabase = createClient();
    const { error } = await supabase
      .from("orders")
      .update({
        payment_status: "confirmed",
        payment_confirmed_at: new Date().toISOString(),
      })
      .eq("id", orderId);

    setConfirmingPayment(false);

    if (error) {
      toast.error(error.message);
      return;
    }

    toast.success("Η πληρωμή επιβεβαιώθηκε!");
    handleOrderUpdated();
  }

  const subtotal = order.items.reduce((sum, item) => sum + item.total, 0);
  const vat = Math.round(subtotal * 0.24 * 100) / 100;
  const grandTotal = Math.round((subtotal + vat) * 100) / 100;

  async function handleCancelOrder() {
    if (
      !window.confirm(
        `Ακύρωση παραγγελίας ${order.orderNumber}; Η κατάσταση θα γίνει «Ακυρώθηκε».`,
      )
    ) {
      return;
    }

    setCancelError(null);
    setCancelling(true);

    const { error } = await updateOrderStatus({
      orderId,
      newStatus: OrderStatus.Cancelled,
      statusHistory: order.statusHistory,
    });

    if (error) {
      setCancelError(error);
      setCancelling(false);
      return;
    }

    setCancelling(false);
    router.refresh();
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6 print:space-y-4">
      <nav
        aria-label="Διαδρομή"
        className="flex items-center gap-1.5 text-sm print:hidden"
      >
        <Link
          href="/orders"
          className="text-gray-400 transition-colors hover:text-navy-900"
        >
          Παραγγελίες
        </Link>
        <span className="text-gray-300">/</span>
        <span className="font-mono font-semibold text-navy-900">
          {order.orderNumber}
        </span>
      </nav>

      <div className="flex flex-col gap-4 print:hidden lg:flex-row lg:items-start lg:justify-between">
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="font-mono text-3xl font-semibold tracking-tight text-navy-900 sm:text-4xl">
              {order.orderNumber}
            </h1>
            {isLive ? (
              <span
                className="inline-flex items-center gap-1.5 rounded-full border border-red-200 bg-red-50 px-2.5 py-1 text-xs font-semibold text-red-700"
                title="Σύνδεση live με Supabase"
              >
                <Circle
                  className="size-2.5 shrink-0 animate-pulse fill-red-500 text-red-500"
                  aria-hidden
                />
                Live
              </span>
            ) : null}
          </div>
          <OrderStatusDropdown
            orderId={orderId}
            status={order.status}
            statusHistory={order.statusHistory}
            assignedDriverName={order.assignedDriverName}
            onStatusChanged={handleOrderUpdated}
          />
          {order.assignedDriverName ? (
            <p className="flex items-center gap-2 text-sm font-medium text-kartex-navy">
              <Truck className="size-4 shrink-0 text-kartex-gold" aria-hidden />
              Οδηγός: {order.assignedDriverName}
            </p>
          ) : null}
        </div>
        <div className="flex flex-wrap gap-2">
          <WorkflowHeaderActions
            order={order}
            orderId={orderId}
            onUpdated={handleOrderUpdated}
          />
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push(`/orders/${order.id}/edit`)}
          >
            <Pencil className="size-4" />
            Επεξεργασία
          </Button>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => window.print()}
            >
              <Printer className="mr-2 h-4 w-4" />
              Εκτύπωση
            </Button>
            <Button variant="outline" size="sm" asChild>
              <a
                href={`/api/orders/${order.id}/pdf`}
                download={`${order.orderNumber}.pdf`}
              >
                <Download className="mr-2 h-4 w-4" />
                PDF
              </a>
            </Button>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="text-destructive hover:bg-destructive/10"
            disabled={cancelling || order.status === OrderStatus.Cancelled}
            onClick={() => void handleCancelOrder()}
          >
            <XCircle className="size-4" />
            {cancelling ? "Ακύρωση…" : "Ακύρωση"}
          </Button>
        </div>
      </div>

      {cancelError ? (
        <p
          className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive print:hidden"
          role="alert"
        >
          {cancelError}
        </p>
      ) : null}

      <div className="hidden print:block">
        <h1 className="text-2xl font-bold text-kartex-navy">{order.orderNumber}</h1>
        <p className="text-sm text-muted-foreground">{order.date}</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-5">
        <div className="space-y-6 lg:col-span-3">
          <CustomerCard customer={order.customer} />
          <ItemsCard order={order} />
          {showWarehouseStatus ? (
            <WarehouseStatusCard
              boxesCount={order.boxesCount}
              boxesNotes={order.boxesNotes}
              photos={boxPhotos}
              loadingPhotos={loadingPhotos}
            />
          ) : null}
          <DeliverySection order={order} orderId={orderId} />
          <SummaryCard
            subtotal={subtotal}
            vatAmount={vat}
            grandTotal={grandTotal}
          />
        </div>

        <div className="space-y-6 lg:col-span-2">
          <InfoCard order={order} />
          {(order.paymentStatus || order.paymentProofUrl) ? (
            <PaymentCard
              order={order}
              confirming={confirmingPayment}
              onConfirmPayment={() => void handleConfirmPayment()}
            />
          ) : null}
          {order.trip ? <TripCard trip={order.trip} /> : null}
          <DriverAssignmentSection
            order={order}
            orderId={orderId}
            onUpdated={handleOrderUpdated}
          />
          <Card className="border-border/80 shadow-sm print:hidden">
            <CardHeader>
              <CardTitle className="text-lg text-kartex-navy">
                Χρονοδιάγραμμα
              </CardTitle>
              <CardDescription>Κατάσταση εκτέλεσης παραγγελίας</CardDescription>
            </CardHeader>
            <CardContent>
              <OrderStatusTimeline
                status={order.status}
                statusHistory={order.statusHistory}
              />
            </CardContent>
          </Card>
          <NotesCard
            orderId={orderId}
            internalNotes={internalNotes}
            clientNotes={clientNotes}
            onInternalChange={setInternalNotes}
            onClientChange={setClientNotes}
          />
        </div>
      </div>
    </div>
  );
}

function TripCard({ trip }: { trip: OrderTripInfo }) {
  const tripDateLabel = formatDateEl(`${trip.tripDate}T12:00:00Z`);
  const tripsHref = `/trips?date=${encodeURIComponent(trip.tripDate)}&driver=${encodeURIComponent(trip.driverId)}`;

  return (
    <Card className="border-border/80 shadow-sm print:hidden">
      <CardHeader>
        <CardTitle className="text-lg text-kartex-navy">Δρομολόγιο</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2 text-sm">
        <p className="flex items-center gap-1.5 font-semibold text-kartex-navy">
          <Package className="size-4 shrink-0 text-muted-foreground" aria-hidden />
          Δρομολόγιο #{trip.tripNumber}
        </p>
        <InfoRow label="Οδηγός" value={trip.driverName} />
        <InfoRow
          label="Όχημα"
          value={trip.vehiclePlate?.trim() || "—"}
        />
        <InfoRow label="Ημερομηνία" value={tripDateLabel} />
        <Link
          href={tripsHref}
          className="inline-block pt-1 font-medium text-kartex-gold hover:underline"
        >
          Δείτε δρομολόγιο →
        </Link>
      </CardContent>
    </Card>
  );
}

function CustomerCard({ customer }: { customer: OrderDetail["customer"] }) {
  return (
    <Card className="border-border/80 shadow-sm">
      <CardHeader>
        <CardTitle className="text-lg text-kartex-navy">Πελάτης</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-3 sm:grid-cols-2">
        <InfoRow label="Όνομα" value={customer.name} />
        <InfoRow label="Τηλέφωνο" value={customer.phone} />
        <InfoRow label="Email" value={customer.email} className="sm:col-span-2" />
        <InfoRow label="Διεύθυνση" value={customer.address} className="sm:col-span-2" />
      </CardContent>
    </Card>
  );
}

function ItemsCard({ order }: { order: OrderDetail }) {
  return (
    <Card className="border-border/80 shadow-sm">
      <CardHeader>
        <CardTitle className="text-lg text-kartex-navy">Προϊόντα</CardTitle>
      </CardHeader>
      <CardContent className="overflow-x-auto p-0 sm:p-6 sm:pt-0">
        {order.items.length === 0 ? (
          <p className="px-4 py-8 text-center text-sm text-muted-foreground sm:px-6">
            Δεν υπάρχουν γραμμές παραγγελίας.
          </p>
        ) : (
          <table className="w-full min-w-[480px] text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/40 text-left">
                <th className="px-4 py-3 font-medium text-muted-foreground sm:px-6">
                  Προϊόν
                </th>
                <th className="px-4 py-3 font-medium text-muted-foreground">
                  Ποσότητα
                </th>
                <th className="px-4 py-3 font-medium text-muted-foreground">
                  Παραδόθηκε
                </th>
                <th className="px-4 py-3 font-medium text-muted-foreground">
                  Εκκρεμεί
                </th>
                <th className="px-4 py-3 font-medium text-muted-foreground">Τιμή</th>
                <th className="px-4 py-3 font-medium text-muted-foreground sm:pr-6">
                  Σύνολο
                </th>
              </tr>
            </thead>
            <tbody>
              {order.items.map((item) => (
                <tr
                  key={item.id}
                  className="border-b border-border/60 last:border-0"
                >
                  <td className="px-4 py-3 sm:px-6">{item.product}</td>
                  <td className="px-4 py-3 tabular-nums">{item.quantity}</td>
                  <td className="px-4 py-3 tabular-nums text-emerald-700">
                    {item.quantityDelivered}
                  </td>
                  <td className="px-4 py-3 tabular-nums text-warning">
                    {item.quantityPending}
                  </td>
                  <td className="px-4 py-3 tabular-nums">
                    {formatEur(item.unitPrice)}
                  </td>
                  <td className="px-4 py-3 font-medium tabular-nums sm:pr-6">
                    {formatEur(item.total)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </CardContent>
    </Card>
  );
}

function SummaryCard({
  subtotal,
  vatAmount,
  grandTotal,
}: {
  subtotal: number;
  vatAmount: number;
  grandTotal: number;
}) {
  const vatRate = 0.24;

  return (
    <Card className="border-border/80 shadow-sm">
      <CardContent className="space-y-2 p-6">
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Υποσύνολο</span>
          <span className="tabular-nums">{formatEur(subtotal)}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">
            ΦΠΑ {Math.round(vatRate * 100)}%
          </span>
          <span className="tabular-nums">{formatEur(vatAmount)}</span>
        </div>
        <div className="flex justify-between border-t border-border pt-3 text-base font-semibold text-kartex-navy">
          <span>Σύνολο</span>
          <span className="tabular-nums">{formatEur(grandTotal)}</span>
        </div>
      </CardContent>
    </Card>
  );
}

function InfoCard({ order }: { order: OrderDetail }) {
  return (
    <Card className="border-border/80 shadow-sm">
      <CardHeader>
        <CardTitle className="text-lg text-kartex-navy">Πληροφορίες</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-3">
        <InfoRow label="Ημερομηνία" value={order.date} />
        <InfoRow label="Πωλητής" value={order.seller} />
        <InfoRow label="Τρόπος πληρωμής" value={order.paymentMethod} />
        <InfoRow label="Ημ. Παράδοσης" value={order.deliveryDate} />
        {order.isReserved ? (
          <InfoRow
            label="Δέσμευση έως"
            value={order.reservedUntil ?? "—"}
          />
        ) : null}
      </CardContent>
    </Card>
  );
}

function PaymentCard({
  order,
  confirming,
  onConfirmPayment,
}: {
  order: OrderDetail;
  confirming: boolean;
  onConfirmPayment: () => void;
}) {
  return (
    <Card className={cn(premiumCard, "print:hidden")}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg text-navy-900">
          <CreditCard className="size-5 text-kartex-gold" />
          Πληρωμή
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="mb-4 flex items-center justify-between gap-4">
          <div>
            <div className="mb-1 text-sm text-muted-foreground">Κατάσταση</div>
            {order.paymentStatus === "pending" ? (
              <span className="flex items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-sm font-semibold text-amber-600">
                <Clock size={13} />
                Αναμονή Πληρωμής
              </span>
            ) : null}
            {order.paymentStatus === "submitted" ? (
              <span className="flex items-center gap-1.5 rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-sm font-semibold text-blue-600">
                <AlertCircle size={13} />
                Απόδειξη Υποβλήθηκε
              </span>
            ) : null}
            {order.paymentStatus === "confirmed" ? (
              <span className="flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-sm font-semibold text-emerald-600">
                <CheckCircle2 size={13} />
                Πληρώθηκε
              </span>
            ) : null}
          </div>
          {order.paymentStatus === "submitted" ? (
            <Button
              type="button"
              className="bg-emerald-600 text-white hover:bg-emerald-700"
              disabled={confirming}
              onClick={onConfirmPayment}
            >
              <CheckCircle2 className="size-4" />
              {confirming ? "Επιβεβαίωση…" : "Επιβεβαίωση Πληρωμής"}
            </Button>
          ) : null}
        </div>

        {order.documentType ? (
          <div className="flex items-center justify-between border-b border-border/50 py-2">
            <span className="text-sm text-muted-foreground">Παραστατικό</span>
            <span
              className={cn(
                "flex items-center gap-1.5 rounded-full border px-3 py-1 text-sm font-semibold",
                order.documentType === "invoice"
                  ? "border-blue-200 bg-blue-50 text-blue-700"
                  : "border-gray-200 bg-gray-50 text-gray-700",
              )}
            >
              {order.documentType === "invoice" ? "📄 Τιμολόγιο" : "🧾 Απόδειξη"}
            </span>
          </div>
        ) : null}

        {order.vatNumber ? (
          <div className="flex items-center justify-between border-b border-border/50 py-2">
            <span className="text-sm text-muted-foreground">ΑΦΜ</span>
            <span className="font-mono text-sm font-semibold text-navy-900">
              {order.vatNumber}
            </span>
          </div>
        ) : null}

        {order.billingAddress ? (
          <div className="flex items-center justify-between border-b border-border/50 py-2">
            <span className="text-sm text-muted-foreground">Διεύθυνση Έδρας</span>
            <span className="text-sm font-medium text-navy-900">
              {order.billingAddress}
            </span>
          </div>
        ) : null}

        {order.paymentAmount != null && order.documentType !== "invoice" ? (
          <InfoRow
            label="Ποσό πληρωμής"
            value={formatEur(order.paymentAmount)}
            className="mb-4"
          />
        ) : null}

        {order.paymentAmount != null && order.documentType === "invoice" ? (
          <div className="mt-3 space-y-1.5 rounded-xl border border-blue-100 bg-blue-50 p-3">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Καθαρή αξία</span>
              <span className="font-medium">
                {(order.paymentAmount / 1.24).toFixed(2)}€
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">ΦΠΑ 24%</span>
              <span className="font-medium">
                {(order.paymentAmount - order.paymentAmount / 1.24).toFixed(2)}€
              </span>
            </div>
            <div className="mt-1 flex justify-between border-t border-blue-200 pt-1.5 text-sm font-bold">
              <span className="text-navy-900">Σύνολο</span>
              <span className="text-kartex-gold">
                {order.paymentAmount.toFixed(2)}€
              </span>
            </div>
          </div>
        ) : null}

        {order.paymentSubmittedAt ? (
          <InfoRow
            label="Υποβλήθηκε"
            value={formatDateEl(order.paymentSubmittedAt)}
            className="mb-4"
          />
        ) : null}

        {order.paymentConfirmedAt ? (
          <InfoRow
            label="Επιβεβαιώθηκε"
            value={formatDateEl(order.paymentConfirmedAt)}
            className="mb-4"
          />
        ) : null}

        {order.paymentProofUrl ? (
          <div>
            <div className="mb-2 text-sm font-medium text-muted-foreground">
              Απόδειξη Πληρωμής
            </div>
            <a href={order.paymentProofUrl} target="_blank" rel="noreferrer">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={order.paymentProofUrl}
                alt="Payment proof"
                className="max-h-64 cursor-pointer rounded-xl border border-border object-contain transition-opacity hover:opacity-90"
              />
            </a>
            <div className="mt-1 text-xs text-muted-foreground">
              Κάντε κλικ για μεγέθυνση
            </div>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}

function WorkflowHeaderActions({
  order,
  orderId,
  onUpdated,
}: {
  order: OrderDetail;
  orderId: string;
  onUpdated: () => void;
}) {
  const [pending, setPending] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  if (order.status !== OrderStatus.Confirmed) return null;

  async function markReadyForShipment() {
    setError(null);
    setPending(true);
    const { error: updateError } = await updateOrderStatus({
      orderId,
      newStatus: OrderStatus.ReadyForShipment,
      statusHistory: order.statusHistory,
    });

    setPending(false);
    if (updateError) {
      setError(updateError);
      return;
    }
    onUpdated();
  }

  return (
    <>
      <Button
        type="button"
        size="sm"
        className={premiumGoldButton}
        disabled={pending}
        onClick={() => void markReadyForShipment()}
      >
        {pending ? "Αποθήκευση…" : "Έτοιμο για Αποστολή"}
      </Button>
      {error ? (
        <p className="w-full basis-full text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : null}
    </>
  );
}

function DeliverySection({
  order,
  orderId,
}: {
  order: OrderDetail;
  orderId: string;
}) {
  const router = useRouter();
  const [modalOpen, setModalOpen] = React.useState(false);
  const hasPending = order.items.some((item) => item.quantityPending > 0);

  if (!hasPending && order.status === OrderStatus.Completed) {
    return null;
  }

  return (
    <>
      <Card className="border-border/80 shadow-sm print:hidden">
        <CardHeader>
          <CardTitle className="text-lg text-kartex-navy">Παράδοση</CardTitle>
          <CardDescription>
            Καταχώρηση μερικής ή ολικής παράδοσης προϊόντων.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {hasPending ? (
            <Button
              type="button"
              className={premiumGoldButton}
              onClick={() => setModalOpen(true)}
            >
              Καταχώρηση Μερικής Παράδοσης
            </Button>
          ) : (
            <p className="text-sm text-[#64748B]">
              Όλα τα προϊόντα έχουν παραδοθεί.
            </p>
          )}
        </CardContent>
      </Card>

      <PartialDeliveryModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        orderId={orderId}
        isReserved={order.isReserved}
        items={order.items}
        onSuccess={() => router.refresh()}
      />
    </>
  );
}

function NotesCard({
  orderId,
  internalNotes,
  clientNotes,
  onInternalChange,
  onClientChange,
}: {
  orderId: string;
  internalNotes: string;
  clientNotes: string;
  onInternalChange: (value: string) => void;
  onClientChange: (value: string) => void;
}) {
  const [saving, setSaving] = React.useState(false);

  async function handleSave() {
    setSaving(true);
    const supabase = createClient();
    const { error } = await supabase
      .from("orders")
      .update({
        notes: clientNotes.trim() || null,
        internal_notes: internalNotes.trim() || null,
      })
      .eq("id", orderId);

    setSaving(false);

    if (error) {
      toast.error(error.message || "Αποτυχία αποθήκευσης σημειώσεων.");
      return;
    }

    toast.success("Οι σημειώσεις αποθηκεύτηκαν.");
  }

  return (
    <Card className="border-border/80 shadow-sm print:hidden">
      <CardHeader>
        <CardTitle className="text-lg text-kartex-navy">Σημειώσεις</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="internal-notes">Εσωτερικές</Label>
          <textarea
            id="internal-notes"
            rows={3}
            value={internalNotes}
            onChange={(e) => onInternalChange(e.target.value)}
            placeholder="Σημειώσεις για την ομάδα…"
            className={textareaClassName}
            disabled={saving}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="client-notes">Πελάτη</Label>
          <textarea
            id="client-notes"
            rows={3}
            value={clientNotes}
            onChange={(e) => onClientChange(e.target.value)}
            placeholder="Οδηγίες παράδοσης, ειδικές απαιτήσεις…"
            className={textareaClassName}
            disabled={saving}
          />
        </div>
        <Button
          type="button"
          size="sm"
          className={premiumGoldButton}
          disabled={saving}
          onClick={() => void handleSave()}
        >
          {saving ? "Αποθήκευση…" : "Αποθήκευση"}
        </Button>
      </CardContent>
    </Card>
  );
}

function InfoRow({
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

const textareaClassName =
  "flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50";
