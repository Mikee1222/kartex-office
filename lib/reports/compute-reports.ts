import { getAthensYearMonth } from "@/lib/datetime";
import { APP_TIMEZONE, mapDbCustomerType } from "@/types/database";

export type ReportOrderRow = {
  id: string;
  order_number?: string;
  customer_id: string;
  status: string;
  total: number | string;
  created_at: string;
  assigned_driver_id?: string | null;
  trip_id?: string | null;
  customers?:
    | { id?: string; name: string; type: string }
    | { id?: string; name: string; type: string }[]
    | null;
};

export type ReportOrderItemRow = {
  order_id: string;
  product_id: string | null;
  quantity: number;
  unit_price: number | string;
  products?:
    | { id?: string; name: string; sku?: string | null }
    | { id?: string; name: string; sku?: string | null }[]
    | null;
};

export type ReportsStats = {
  totalRevenue: number;
  averageOrder: number;
  orderCount: number;
  topCustomerByOrders: { name: string; orderCount: number };
};

export type MonthOrderCount = {
  yearMonth: string;
  label: string;
  count: number;
};

export type StatusSlice = {
  status: string;
  count: number;
};

export type TopProductRow = {
  productId: string;
  name: string;
  quantity: number;
  revenue: number;
};

export type TopCustomerRow = {
  customerId: string;
  name: string;
  typeLabel: string;
  orderCount: number;
  totalSpent: number;
};

export type ComputedReports = {
  stats: ReportsStats;
  ordersByMonth: MonthOrderCount[];
  statusBreakdown: StatusSlice[];
  topProducts: TopProductRow[];
  topCustomers: TopCustomerRow[];
};

export function toNumber(value: number | string | null | undefined): number {
  if (value === null || value === undefined) return 0;
  const n = typeof value === "number" ? value : Number.parseFloat(String(value));
  return Number.isFinite(n) ? n : 0;
}

export function normalizeJoin<T>(value: T | T[] | null | undefined): T | null {
  if (!value) return null;
  return Array.isArray(value) ? (value[0] ?? null) : value;
}

function getLast6AthensMonths(): { yearMonth: string; label: string }[] {
  const result: { yearMonth: string; label: string }[] = [];
  const anchor = new Date();

  for (let offset = 5; offset >= 0; offset -= 1) {
    const d = new Date(anchor);
    d.setDate(1);
    d.setMonth(d.getMonth() - offset);
    const yearMonth = getAthensYearMonth(d);
    const label = new Intl.DateTimeFormat("el-GR", {
      timeZone: APP_TIMEZONE,
      month: "short",
    }).format(d);
    result.push({ yearMonth, label });
  }

  return result;
}

export function computeReports(
  orders: ReportOrderRow[],
  orderItems: ReportOrderItemRow[],
  productNameById?: Map<string, string>,
): ComputedReports {
  let totalRevenue = 0;
  const customerOrderCounts = new Map<
    string,
    { name: string; count: number }
  >();
  const customerSpend = new Map<
    string,
    { name: string; type: string; orders: number; total: number }
  >();
  const monthCounts = new Map<string, number>();
  const statusCounts = new Map<string, number>();

  for (const order of orders) {
    const total = toNumber(order.total);
    totalRevenue += total;

    const customer = normalizeJoin(order.customers);
    const customerName = customer?.name?.trim() || "—";
    const customerType = customer?.type ?? "walk-in";

    const prevCount = customerOrderCounts.get(order.customer_id);
    customerOrderCounts.set(order.customer_id, {
      name: customerName,
      count: (prevCount?.count ?? 0) + 1,
    });

    const prevSpend = customerSpend.get(order.customer_id);
    customerSpend.set(order.customer_id, {
      name: customerName,
      type: customerType,
      orders: (prevSpend?.orders ?? 0) + 1,
      total: (prevSpend?.total ?? 0) + total,
    });

    const created = new Date(order.created_at);
    const ym = Number.isNaN(created.getTime())
      ? ""
      : getAthensYearMonth(created);
    if (ym) {
      monthCounts.set(ym, (monthCounts.get(ym) ?? 0) + 1);
    }

    statusCounts.set(order.status, (statusCounts.get(order.status) ?? 0) + 1);
  }

  const orderCount = orders.length;
  const averageOrder = orderCount > 0 ? totalRevenue / orderCount : 0;

  let topCustomerByOrders = { name: "—", orderCount: 0 };
  for (const entry of customerOrderCounts.values()) {
    if (entry.count > topCustomerByOrders.orderCount) {
      topCustomerByOrders = { name: entry.name, orderCount: entry.count };
    }
  }

  const ordersByMonth = getLast6AthensMonths().map(({ yearMonth, label }) => ({
    yearMonth,
    label,
    count: monthCounts.get(yearMonth) ?? 0,
  }));

  const statusBreakdown = [...statusCounts.entries()]
    .map(([status, count]) => ({ status, count }))
    .sort((a, b) => b.count - a.count);

  const productAgg = new Map<
    string,
    { name: string; quantity: number; revenue: number }
  >();

  for (const item of orderItems) {
    const productId = item.product_id ?? `unknown-${item.order_id}`;
    const product = normalizeJoin(item.products);
    const fallbackName =
      item.product_id && productNameById?.get(item.product_id);
    const name =
      product?.name?.trim() ||
      fallbackName ||
      "Άγνωστο προϊόν";
    const qty = item.quantity ?? 0;
    const lineTotal = qty * toNumber(item.unit_price);

    const prev = productAgg.get(productId);
    productAgg.set(productId, {
      name,
      quantity: (prev?.quantity ?? 0) + qty,
      revenue: (prev?.revenue ?? 0) + lineTotal,
    });
  }

  const topProducts = [...productAgg.entries()]
    .map(([productId, row]) => ({
      productId,
      name: row.name,
      quantity: row.quantity,
      revenue: row.revenue,
    }))
    .sort((a, b) => b.quantity - a.quantity)
    .slice(0, 5);

  const topCustomers = [...customerSpend.entries()]
    .map(([customerId, row]) => ({
      customerId,
      name: row.name,
      typeLabel: mapDbCustomerType(row.type),
      orderCount: row.orders,
      totalSpent: row.total,
    }))
    .sort((a, b) => b.totalSpent - a.totalSpent)
    .slice(0, 5);

  return {
    stats: {
      totalRevenue,
      averageOrder,
      orderCount,
      topCustomerByOrders,
    },
    ordersByMonth,
    statusBreakdown,
    topProducts,
    topCustomers,
  };
}
