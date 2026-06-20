import { CustomerType, type Customer } from "@/components/customers/types";
import {
  OrderStatus,
  type Order,
  type OrderStatus as OrderStatusType,
} from "@/components/orders/types";
import { ProductCategory, type Product } from "@/components/products/types";

/** All dashboard “today” / calendar filters use Europe/Athens. */
export const APP_TIMEZONE = "Europe/Athens";

export type DbCustomerType = "hospital" | "hotel" | "walk-in";

export type CustomerRow = {
  id: string;
  name: string;
  type: DbCustomerType;
  vat: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  city: string | null;
  postal_code: string | null;
  payment_terms: string | null;
  credit_limit: number | string | null;
  notes: string | null;
  created_at: string;
  updated_at?: string;
};

export type ProductRow = {
  id: string;
  name: string;
  clean_name?: string | null;
  sku: string;
  barcode: string | null;
  category: string | null;
  subcategory?: string | null;
  master_id?: string | null;
  purchase_price: number | string;
  sale_price: number | string;
  stock: number;
  reserved_stock?: number;
  min_stock: number;
  supplier: string | null;
  description: string | null;
  notes: string | null;
  width_cm?: number | string | null;
  height_cm?: number | string | null;
  weight_kg?: number | string | null;
  gsm?: number | string | null;
  thread_count?: number | string | null;
  color?: string | null;
  unit?: string | null;
  material?: string | null;
  quality_grade?: string | null;
  supplier_id?: string | null;
  is_active?: boolean;
  image_url?: string | null;
  created_at: string;
  updated_at?: string;
};

export type OrderRow = {
  id: string;
  order_number: string;
  customer_id: string;
  status: string;
  total: number | string;
  delivery_date: string | null;
  picking_date: string | null;
  reminder_days: number | null;
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
  created_at: string;
  updated_at?: string;
  created_by: string | null;
  customers?:
    | { name: string; city?: string | null }
    | { name: string; city?: string | null }[]
    | null;
  order_items?: { count: number }[] | null;
};

export type OrderItemCountRow = {
  order_id: string;
};

const DB_TYPE_TO_UI: Record<DbCustomerType, Customer["type"]> = {
  hospital: CustomerType.Hospital,
  hotel: CustomerType.Hotel,
  "walk-in": CustomerType.WalkIn,
};

const UI_TYPE_TO_DB: Record<string, DbCustomerType> = {
  Νοσοκομείο: "hospital",
  Ξενοδοχείο: "hotel",
  "Walk-in": "walk-in",
};

export function mapUiCustomerTypeToDb(label: string): DbCustomerType | null {
  return UI_TYPE_TO_DB[label] ?? null;
}

export function mapDbCustomerType(type: string): Customer["type"] {
  if (type in DB_TYPE_TO_UI) {
    return DB_TYPE_TO_UI[type as DbCustomerType];
  }
  return CustomerType.WalkIn;
}

export type CustomerOrderStats = {
  totalOrders: number;
  totalPurchasesEur: number;
  lastOrderDate: string | null;
};

export type CustomerOrderAggregateRow = {
  customer_id: string;
  total: number | string;
  created_at: string;
};

export function aggregateCustomerOrderStats(
  orders: CustomerOrderAggregateRow[],
): Map<string, CustomerOrderStats> {
  const map = new Map<string, CustomerOrderStats>();

  for (const order of orders) {
    const existing = map.get(order.customer_id);
    const orderTotal = toNumber(order.total);

    if (!existing) {
      map.set(order.customer_id, {
        totalOrders: 1,
        totalPurchasesEur: orderTotal,
        lastOrderDate: order.created_at,
      });
      continue;
    }

    existing.totalOrders += 1;
    existing.totalPurchasesEur += orderTotal;
    if (
      order.created_at &&
      (!existing.lastOrderDate || order.created_at > existing.lastOrderDate)
    ) {
      existing.lastOrderDate = order.created_at;
    }
  }

  return map;
}

export function mapCustomerRow(
  row: CustomerRow,
  stats?: CustomerOrderStats,
): Customer {
  return {
    id: row.id,
    company: row.name,
    type: mapDbCustomerType(row.type),
    phone: row.phone?.trim() || "—",
    city: row.city?.trim() || "—",
    lastOrderDate: stats?.lastOrderDate
      ? formatDateEl(stats.lastOrderDate)
      : "—",
    totalPurchasesEur: stats?.totalPurchasesEur ?? 0,
  };
}

function toNumber(value: number | string | null | undefined): number {
  if (value === null || value === undefined) return 0;
  const n = typeof value === "number" ? value : Number.parseFloat(value);
  return Number.isFinite(n) ? n : 0;
}

export function normalizeProductCategory(
  category: string | null | undefined,
): string {
  const value = category?.trim();
  if (value) {
    return value;
  }
  return ProductCategory.Other;
}

export function mapProductRow(row: ProductRow): Product {
  const stock = row.stock ?? 0;
  const reservedStock = row.reserved_stock ?? 0;
  return {
    id: row.id,
    name: row.name,
    cleanName: row.clean_name ?? undefined,
    sku: row.sku,
    barcode: row.barcode?.trim() || "—",
    category: normalizeProductCategory(row.category),
    subcategory: row.subcategory ?? undefined,
    masterId: row.master_id ?? undefined,
    stock,
    reservedStock,
    availableStock: Math.max(stock - reservedStock, 0),
    minStock: row.min_stock ?? 0,
    purchasePrice: toNumber(row.purchase_price),
    salePrice: toNumber(row.sale_price),
    supplier: row.supplier ?? undefined,
    description: row.description ?? undefined,
    widthCm: row.width_cm != null ? toNumber(row.width_cm) : null,
    heightCm: row.height_cm != null ? toNumber(row.height_cm) : null,
    weightKg: row.weight_kg != null ? toNumber(row.weight_kg) : null,
    gsm: row.gsm != null ? toNumber(row.gsm) : null,
    threadCount: row.thread_count != null ? toNumber(row.thread_count) : null,
    unit: row.unit?.trim() || "τεμ",
    material: row.material?.trim() || undefined,
    qualityGrade: row.quality_grade?.trim() || undefined,
    imageUrl: row.image_url ?? null,
    isActive: row.is_active ?? true,
    createdAt: row.created_at,
    supplierId: row.supplier_id ?? undefined,
  };
}

export function normalizeOrderStatus(status: string): OrderStatusType {
  const values = Object.values(OrderStatus) as string[];
  if (values.includes(status)) {
    return status as OrderStatusType;
  }
  return OrderStatus.Processing;
}

export function formatDateEl(iso: string | null | undefined): string {
  if (!iso) return "—";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("el-GR", {
    timeZone: APP_TIMEZONE,
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date);
}

export function formatCurrencyEl(value: number): string {
  return new Intl.NumberFormat("el-GR", {
    style: "currency",
    currency: "EUR",
  }).format(value);
}

export function mapOrderRow(
  row: OrderRow,
  itemCount = 0,
): Order {
  const customerJoin = row.customers;
  const customerRecord = Array.isArray(customerJoin)
    ? customerJoin[0]
    : customerJoin;
  const customerName = customerRecord?.name?.trim();
  const customerCity = customerRecord?.city?.trim();
  const customerLabel =
    customerName && customerCity
      ? `${customerName} (${customerCity})`
      : customerName || "—";

  const embeddedCount = row.order_items?.[0]?.count;
  const count =
    typeof embeddedCount === "number" ? embeddedCount : itemCount;

  const paymentAmountRaw = row.payment_amount;
  const paymentAmount =
    paymentAmountRaw === null || paymentAmountRaw === undefined
      ? null
      : toNumber(paymentAmountRaw);

  return {
    id: row.id,
    orderNumber: row.order_number,
    customer: customerLabel,
    date: formatDateEl(row.created_at),
    status: normalizeOrderStatus(row.status),
    itemCount: count,
    totalEur: toNumber(row.total),
    paymentStatus: row.payment_status ?? "pending",
    paymentProofUrl: row.payment_proof_url ?? null,
    paymentAmount,
    paymentSubmittedAt: row.payment_submitted_at ?? null,
    paymentConfirmedAt: row.payment_confirmed_at ?? null,
    documentType: row.document_type ?? "receipt",
    vatNumber: row.vat_number ?? null,
    billingAddress: row.billing_address ?? null,
  };
}

export function countItemsByOrder(
  rows: OrderItemCountRow[],
): Map<string, number> {
  const map = new Map<string, number>();
  for (const row of rows) {
    map.set(row.order_id, (map.get(row.order_id) ?? 0) + 1);
  }
  return map;
}

export type CustomerEditInitial = {
  name: string;
  typeLabel: string;
  vat: string;
  phone: string;
  email: string;
  address: string;
  city: string;
  postalCode: string;
  paymentTerms: string;
  creditLimit: string;
  notes: string;
};

export function mapCustomerRowToEditInitial(row: CustomerRow): CustomerEditInitial {
  const credit =
    row.credit_limit === null || row.credit_limit === undefined
      ? ""
      : String(row.credit_limit);

  return {
    name: row.name,
    typeLabel: mapDbCustomerType(row.type),
    vat: row.vat?.trim() ?? "",
    phone: row.phone?.trim() ?? "",
    email: row.email?.trim() ?? "",
    address: row.address?.trim() ?? "",
    city: row.city?.trim() ?? "",
    postalCode: row.postal_code?.trim() ?? "",
    paymentTerms: row.payment_terms?.trim() || "30 μέρες",
    creditLimit: credit,
    notes: row.notes?.trim() ?? "",
  };
}

export type ProductEditInitial = {
  name: string;
  cleanName: string;
  masterId: string;
  sku: string;
  barcode: string;
  category: string;
  subcategory: string;
  purchasePrice: string;
  salePrice: string;
  stock: string;
  minStock: string;
  supplierId: string;
  supplierName: string;
  qualityGrade: string;
  material: string;
  description: string;
  notes: string;
  widthCm: string;
  heightCm: string;
  weightKg: string;
  unit: string;
  isActive: boolean;
  colorSelections: { colorId: string; stock: number; isPrimary?: boolean }[];
};

export type QuoteRequestStatus =
  | "pending"
  | "reviewing"
  | "quoted"
  | "accepted"
  | "rejected"
  | "cancelled";

export type QuoteRequestRow = {
  id: string;
  company_name: string;
  contact_name: string;
  email: string;
  phone?: string | null;
  notes?: string | null;
  internal_notes?: string | null;
  status: string;
  user_id?: string | null;
  customer_id?: string | null;
  locale?: string | null;
  quoted_at?: string | null;
  accepted_at?: string | null;
  order_id?: string | null;
  responded_by?: string | null;
  created_at: string;
  updated_at?: string | null;
  quote_request_items?: QuoteRequestItemRow[] | { count: number }[] | null;
};

export type QuoteRequestItemRow = {
  id: string;
  quote_request_id: string;
  product_id?: string | null;
  product_name: string;
  quantity: number;
  color?: string | null;
  dimensions?: string | null;
  material?: string | null;
  notes?: string | null;
  quoted_price?: number | string | null;
  quoted_notes?: string | null;
  products?: { unit?: string | null } | { unit?: string | null }[] | null;
};

export function quoteShortId(id: string): string {
  return id.replace(/-/g, "").slice(0, 8).toUpperCase();
}

export function mapQuoteRequestRow(
  row: QuoteRequestRow,
  itemCount = 0,
): import("@/components/quotes/types").QuoteListItem {
  const embedded = row.quote_request_items?.[0];
  const count =
    embedded && "count" in embedded
      ? embedded.count
      : Array.isArray(row.quote_request_items)
        ? row.quote_request_items.length
        : itemCount;

  return {
    id: row.id,
    shortId: quoteShortId(row.id),
    contactName: row.contact_name?.trim() || "—",
    companyName: row.company_name?.trim() || "—",
    itemCount: count,
    date: formatDateEl(row.created_at),
    status: normalizeQuoteRequestStatus(row.status),
    acceptedAt: row.accepted_at ?? null,
    orderId: row.order_id ?? null,
  };
}

export function normalizeQuoteRequestStatus(
  status: string,
): QuoteRequestStatus {
  const values: QuoteRequestStatus[] = [
    "pending",
    "reviewing",
    "quoted",
    "accepted",
    "rejected",
    "cancelled",
  ];
  if (values.includes(status as QuoteRequestStatus)) {
    return status as QuoteRequestStatus;
  }
  return "pending";
}

export function mapQuoteItemRow(
  row: QuoteRequestItemRow,
): import("@/components/quotes/types").QuoteDetailItem {
  const productJoin = row.products;
  const productRecord = Array.isArray(productJoin) ? productJoin[0] : productJoin;
  const unit = productRecord?.unit?.trim() || "τεμ";

  return {
    id: row.id,
    productId: row.product_id ?? null,
    productName: row.product_name,
    quantity: row.quantity,
    unit,
    notes: row.notes ?? null,
    color: row.color ?? null,
    dimensions: row.dimensions ?? null,
    material: row.material ?? null,
    quotedPrice:
      row.quoted_price != null ? toNumber(row.quoted_price) : null,
  };
}

export function mapQuoteRequestToDetail(
  row: QuoteRequestRow,
): import("@/components/quotes/types").QuoteDetail {
  const items = Array.isArray(row.quote_request_items)
    ? row.quote_request_items
        .filter((item): item is QuoteRequestItemRow => "id" in item)
        .map(mapQuoteItemRow)
    : [];

  return {
    id: row.id,
    shortId: quoteShortId(row.id),
    contactName: row.contact_name?.trim() || "—",
    companyName: row.company_name?.trim() || "—",
    email: row.email?.trim() || "—",
    phone: row.phone?.trim() || null,
    clientNotes: row.notes ?? null,
    internalNotes: row.internal_notes ?? null,
    status: normalizeQuoteRequestStatus(row.status),
    createdAt: row.created_at,
    quotedAt: row.quoted_at ?? null,
    acceptedAt: row.accepted_at ?? null,
    orderId: row.order_id ?? null,
    items,
  };
}

export const QUOTE_LIST_SELECT =
  "*, quote_request_items!quote_request_items_quote_request_id_fkey(id), customers:customer_id(name)";

export const QUOTE_DETAIL_SELECT = `
  *,
  quote_request_items!quote_request_items_quote_request_id_fkey(
    id, quote_request_id, product_id, product_name, quantity,
    color, dimensions, material, notes, quoted_price, quoted_notes,
    products(unit)
  )
`;

export function mapProductRowToEditInitial(
  row: ProductRow,
  colorSelections: { colorId: string; stock: number; isPrimary?: boolean }[] = [],
): ProductEditInitial {
  return {
    name: row.name,
    cleanName: row.clean_name?.trim() ?? "",
    masterId: row.master_id ?? "",
    sku: row.sku,
    barcode: row.barcode?.trim() ?? "",
    category: normalizeProductCategory(row.category),
    subcategory: row.subcategory?.trim() ?? "",
    purchasePrice: String(row.purchase_price ?? 0),
    salePrice: String(row.sale_price ?? 0),
    stock: String(row.stock ?? 0),
    minStock: String(row.min_stock ?? 0),
    supplierId: row.supplier_id ?? "",
    supplierName: row.supplier?.trim() ?? "",
    qualityGrade: row.quality_grade?.trim() ?? "",
    material: row.material?.trim() ?? "",
    description: row.description?.trim() ?? "",
    notes: row.notes?.trim() ?? "",
    widthCm: row.width_cm != null ? String(row.width_cm) : "",
    heightCm: row.height_cm != null ? String(row.height_cm) : "",
    weightKg: row.weight_kg != null ? String(row.weight_kg) : "",
    unit: row.unit?.trim() || "τεμ",
    isActive: row.is_active ?? true,
    colorSelections,
  };
}
