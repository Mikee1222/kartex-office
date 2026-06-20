import { type OrderDetail } from "@/components/orders/order-detail-types";
import { type OrderStatus, type PaymentStatus } from "@/components/orders/types";
import { parseStatusHistory } from "@/lib/orders/status-timeline";
import { formatDateEl, mapDbCustomerType, normalizeOrderStatus } from "@/types/database";

type CustomerJoin = {
  id: string;
  name: string;
  vat: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  city: string | null;
  postal_code: string | null;
  payment_terms: string | null;
  type: string;
};

type ProductJoin = {
  id: string;
  name: string;
  sku: string;
};

type OrderItemJoin = {
  id: string;
  product_id: string | null;
  quantity: number;
  quantity_delivered?: number | null;
  unit_price: number | string;
  total: number | string;
  products: ProductJoin | ProductJoin[] | null;
};

/** Shared Supabase select for order detail / edit pages. */
export const ORDER_DETAIL_SELECT = `
  *,
  customers (
    id, name, vat, phone, email,
    address, city, postal_code,
    payment_terms, type
  ),
  order_items (
    id, product_id, quantity, quantity_delivered, unit_price, total,
    products (id, name, sku)
  ),
  delivery_trips (
    id,
    trip_number,
    trip_date,
    driver_id,
    driver_name,
    vehicles ( plate, model )
  )
`;

type TripJoin = {
  id: string;
  trip_number: number;
  trip_date: string;
  driver_id: string;
  driver_name: string;
  vehicles?: { plate: string; model: string | null } | { plate: string; model: string | null }[] | null;
};

export type OrderEditFormData = {
  orderNumber: string;
  status: OrderStatus;
  deliveryDate: string;
  paymentTerms: string;
  priority: string;
  notes: string;
  internalNotes: string;
};

export type OrderDetailQueryRow = {
  id: string;
  order_number: string;
  status: string;
  total: number | string;
  delivery_date: string | null;
  payment_terms: string | null;
  payment_status?: string | null;
  payment_proof_url?: string | null;
  payment_amount?: number | string | null;
  payment_submitted_at?: string | null;
  payment_confirmed_at?: string | null;
  document_type?: string | null;
  vat_number?: string | null;
  billing_address?: string | null;
  priority: string | null;
  notes: string | null;
  internal_notes: string | null;
  is_reserved?: boolean | null;
  reserved_until?: string | null;
  assigned_driver_id?: string | null;
  assigned_driver_name?: string | null;
  vehicle_id?: string | null;
  trip_id?: string | null;
  boxes_count?: number | null;
  boxes_notes?: string | null;
  status_history?: unknown;
  created_at: string;
  customers: CustomerJoin | CustomerJoin[] | null;
  order_items: OrderItemJoin[] | null;
  delivery_trips?: TripJoin | TripJoin[] | null;
};

function mapTripJoin(
  trips: OrderDetailQueryRow["delivery_trips"],
): OrderDetail["trip"] {
  if (!trips) return null;
  const row = pickOne(trips);
  if (!row) return null;
  const vehicle = pickOne(row.vehicles);
  return {
    id: row.id,
    tripNumber: row.trip_number,
    tripDate: row.trip_date,
    driverId: row.driver_id,
    driverName: row.driver_name?.trim() || "—",
    vehiclePlate: vehicle?.plate?.trim() || null,
  };
}

function toNumber(value: number | string | null | undefined): number {
  if (value === null || value === undefined) return 0;
  const n = typeof value === "number" ? value : Number.parseFloat(String(value));
  return Number.isFinite(n) ? n : 0;
}

function pickOne<T>(value: T | T[] | null | undefined): T | null {
  if (!value) return null;
  return Array.isArray(value) ? (value[0] ?? null) : value;
}

function formatCustomerAddress(customer: CustomerJoin): string {
  const line2 = [customer.city, customer.postal_code]
    .filter((part) => part?.trim())
    .join(" ");
  const parts = [customer.address?.trim(), line2].filter(Boolean);
  return parts.length > 0 ? parts.join(", ") : "—";
}

export function mapSupabaseOrderToDetail(row: OrderDetailQueryRow): OrderDetail {
  const customer = pickOne(row.customers);
  const status = normalizeOrderStatus(row.status);

  const items = (row.order_items ?? []).map((line) => {
    const product = pickOne(line.products);
    const unitPrice = toNumber(line.unit_price);
    const quantity = line.quantity ?? 0;
    const quantityDelivered = line.quantity_delivered ?? 0;
    const quantityPending = Math.max(quantity - quantityDelivered, 0);
    const lineTotal = Math.round(unitPrice * quantity * 100) / 100;
    return {
      id: line.id,
      productId: line.product_id,
      product: product?.name?.trim() || "—",
      quantity,
      quantityDelivered,
      quantityPending,
      unitPrice,
      total: lineTotal,
    };
  });

  const subtotalFromLines = items.reduce(
    (sum, item) => sum + item.unitPrice * item.quantity,
    0,
  );
  const subtotal = Math.round(subtotalFromLines * 100) / 100;
  const total = toNumber(row.total);
  const vatRate = 0.24;
  const vatAmount =
    subtotal > 0
      ? Math.round(subtotal * vatRate * 100) / 100
      : Math.round((total / (1 + vatRate)) * vatRate * 100) / 100;

  return {
    id: row.id,
    orderNumber: row.order_number,
    status,
    customer: {
      name: customer?.name?.trim() || "—",
      phone: customer?.phone?.trim() || "—",
      email: customer?.email?.trim() || "—",
      address: customer ? formatCustomerAddress(customer) : "—",
    },
    items,
    subtotal,
    vatRate,
    total: total > 0 ? total : Math.round((subtotal + vatAmount) * 100) / 100,
    date: formatDateEl(row.created_at),
    seller: "—",
    paymentMethod: row.payment_terms?.trim() || "—",
    paymentStatus: (row.payment_status ?? "pending") as PaymentStatus,
    paymentProofUrl: row.payment_proof_url ?? null,
    paymentAmount:
      row.payment_amount === null || row.payment_amount === undefined
        ? null
        : toNumber(row.payment_amount),
    paymentSubmittedAt: row.payment_submitted_at ?? null,
    paymentConfirmedAt: row.payment_confirmed_at ?? null,
    documentType: row.document_type ?? "receipt",
    vatNumber: row.vat_number ?? null,
    billingAddress: row.billing_address ?? null,
    deliveryDate: row.delivery_date
      ? formatDateEl(`${row.delivery_date}T12:00:00Z`)
      : "—",
    deliveryDateRaw: row.delivery_date,
    isReserved: Boolean(row.is_reserved),
    reservedUntil: row.reserved_until
      ? formatDateEl(`${row.reserved_until}T12:00:00Z`)
      : null,
    statusHistory: parseStatusHistory(row.status_history),
    assignedDriverId: row.assigned_driver_id ?? null,
    assignedDriverName: row.assigned_driver_name?.trim() || null,
    vehicleId: row.vehicle_id ?? null,
    trip: mapTripJoin(row.delivery_trips),
    boxesCount:
      row.boxes_count != null && Number.isFinite(row.boxes_count)
        ? row.boxes_count
        : null,
    boxesNotes: row.boxes_notes?.trim() || null,
    notes: {
      internal: row.internal_notes?.trim() || "",
      client: row.notes?.trim() || "",
    },
  };
}

export function mapSupabaseOrderToEditForm(row: OrderDetailQueryRow): OrderEditFormData {
  return {
    orderNumber: row.order_number,
    status: normalizeOrderStatus(row.status),
    deliveryDate: row.delivery_date ?? "",
    paymentTerms: row.payment_terms?.trim() || "30 μέρες",
    priority: row.priority?.trim() || "Κανονική",
    notes: row.notes?.trim() || "",
    internalNotes: row.internal_notes?.trim() || "",
  };
}

/** Expose customer type label for wizard (optional). */
export function customerTypeLabel(dbType: string): string {
  return mapDbCustomerType(dbType);
}

export type OrderPdfData = {
  orderNumber: string;
  date: string;
  deliveryDate: string;
  documentType: string;
  customer: {
    name: string;
    address: string;
    city: string;
    phone: string;
    email: string;
    vat: string;
  };
  items: {
    sku: string;
    product: string;
    quantity: number;
    unitPrice: number;
    lineTotal: number;
    discountPercent: number;
  }[];
  subtotal: number;
  vatRate: number;
  vatAmount: number;
  total: number;
  totalQuantity: number;
  paymentTerms: string;
  notes: string;
};

export function mapSupabaseOrderToPdf(row: OrderDetailQueryRow): OrderPdfData {
  const detail = mapSupabaseOrderToDetail(row);
  const customer = pickOne(row.customers);
  const vatAmount = Math.round(detail.subtotal * detail.vatRate * 100) / 100;

  const cityLine = [customer?.city?.trim(), customer?.postal_code?.trim()]
    .filter(Boolean)
    .join(" ");

  const items = (row.order_items ?? []).map((line) => {
    const product = pickOne(line.products);
    const unitPrice = toNumber(line.unit_price);
    const quantity = line.quantity ?? 0;
    const lineTotal = Math.round(unitPrice * quantity * 100) / 100;
    return {
      sku: product?.sku?.trim() || "—",
      product: product?.name?.trim() || "—",
      quantity,
      unitPrice,
      lineTotal,
      discountPercent: 0,
    };
  });

  const totalQuantity = items.reduce((sum, item) => sum + item.quantity, 0);

  return {
    orderNumber: detail.orderNumber,
    date: detail.date,
    deliveryDate: row.delivery_date
      ? formatDateEl(`${row.delivery_date}T12:00:00Z`)
      : "—",
    documentType: "Δελτίο Αποστολής",
    customer: {
      name: detail.customer.name,
      address: customer?.address?.trim() || "—",
      city: cityLine || "—",
      phone: detail.customer.phone,
      email: detail.customer.email,
      vat: customer?.vat?.trim() || "—",
    },
    items,
    subtotal: detail.subtotal,
    vatRate: detail.vatRate,
    vatAmount,
    total: detail.total,
    totalQuantity,
    paymentTerms: row.payment_terms?.trim() || detail.paymentMethod,
    notes: detail.notes.client?.trim() || "—",
  };
}
