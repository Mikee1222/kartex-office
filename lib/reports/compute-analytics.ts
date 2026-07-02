import { CustomerType } from "@/components/customers/types";
import { OrderStatus } from "@/components/orders/types";
import { ProductCategory, getStockStatus } from "@/components/products/types";
import { getAthensDateString, getAthensYearMonth } from "@/lib/datetime";
import {
  getLast12AthensMonths,
  getPreviousPeriod,
  isDateInReportRange,
  isIsoInReportRange,
  resolveReportDateRange,
  type ReportDateRange,
} from "@/lib/reports/date-range";
import {
  normalizeJoin,
  toNumber,
  type ReportOrderItemRow,
  type ReportOrderRow,
} from "@/lib/reports/compute-reports";
import type { OverviewMetrics } from "@/lib/reports/fetch-overview-metrics";
import {
  resolveReportProductMeta,
  type ReportProductJoin,
} from "@/lib/reports/product-meta";
import { mapDbCustomerType, type CustomerRow, type ProductRow } from "@/types/database";

export const LAST_12_MONTHS_LABEL = "Τελευταίοι 12 Μήνες";
const INSUFFICIENT_DATA = "Δεν υπάρχουν αρκετά δεδομένα ακόμα";

export type ReportKpi = {
  key: string;
  label: string;
  value: string;
  tone?: "default" | "danger" | "success" | "warning";
  hint?: string;
};

export type ChartPoint = {
  id: string;
  label: string;
  value: number;
  value2?: number;
  color?: string;
};

export type ReportTableRow = Record<string, string | number>;

export type DriverCardData = {
  id: string;
  name: string;
  vehiclePlate: string;
  deliveriesToday: number;
  deliveriesTotal: number;
  progressPct: number;
  boxesDone: number;
  boxesTotal: number;
  tripsCount: number;
  statusLabel: string;
};

export type InventoryMovementRow = {
  id: string;
  type: string;
  quantity: number;
  reason: string | null;
  created_at: string;
  products?: { name: string } | { name: string }[] | null;
};

export type DeliveryTripRow = {
  id: string;
  driver_id: string;
  driver_name: string;
  trip_date: string;
  status: string;
  total_boxes: number;
  departed_at: string | null;
  returned_at: string | null;
  vehicles?:
    | { plate: string; max_boxes: number }
    | { plate: string; max_boxes: number }[]
    | null;
};

export type DriverOption = {
  id: string;
  name: string;
  vehiclePlate: string | null;
};

export type ColorSalesRow = {
  colorId: string;
  name: string;
  hexCode: string;
  quantity: number;
};

export type ReportRawData = {
  orders: ReportOrderRow[];
  orderItems: (ReportOrderItemRow & {
    color_id?: string | null;
    product_colors?:
      | { id: string; name: string; hex_code: string }
      | { id: string; name: string; hex_code: string }[]
      | null;
  })[];
  products: ProductRow[];
  customers: CustomerRow[];
  inventoryMovements: InventoryMovementRow[];
  deliveryTrips: DeliveryTripRow[];
  drivers: DriverOption[];
  overview?: OverviewMetrics | null;
};

export type SalesAnalytics = {
  kpis: ReportKpi[];
  revenueByMonth: ChartPoint[];
  ordersByStatus: ChartPoint[];
  revenueByCustomerType: ChartPoint[];
  topOrders: ReportTableRow[];
};

export type ProductsAnalytics = {
  kpis: ReportKpi[];
  stockLevels: ChartPoint[];
  stockByCategory: ChartPoint[];
  colorDistribution: ChartPoint[];
  lowStockProducts: ReportTableRow[];
  topProductsByVolume: ReportTableRow[];
};

export type CustomersAnalytics = {
  kpis: ReportKpi[];
  customersByType: ChartPoint[];
  revenueByCity: ChartPoint[];
  customerGrowth: ChartPoint[];
  topCustomers: ReportTableRow[];
};

export type WarehouseAnalytics = {
  kpis: ReportKpi[];
  orderFunnel: ChartPoint[];
  pickingTimeByDay: ChartPoint[];
  stockMovements: ChartPoint[];
  recentMovements: ReportTableRow[];
};

export type DriversAnalytics = {
  kpis: ReportKpi[];
  driverCards: DriverCardData[];
  deliveriesPerDriver: ChartPoint[];
  deliverySuccessRate: ChartPoint[];
  driverStatusTable: ReportTableRow[];
};

export type ProfitMonthPoint = {
  label: string;
  revenue: number;
  cost: number;
  profit: number;
};

export type PriceReviewProductRow = {
  productId: string;
  product: string;
  marginPct: number;
  purchase: number;
  sale: number;
  suggestedPrice: number;
};

export type ProfitabilityAnalytics = {
  kpis: ReportKpi[];
  marginByProduct: ChartPoint[];
  monthlyGrossProfit: ProfitMonthPoint[];
  marginDistribution: ChartPoint[];
  topProfitableProducts: ReportTableRow[];
  priceReviewProducts: PriceReviewProductRow[];
  customerProfitability: ReportTableRow[];
};

export type OverviewAnalytics = {
  kpis: ReportKpi[];
};

export type FullAnalytics = {
  overview: OverviewAnalytics;
  sales: SalesAnalytics;
  products: ProductsAnalytics;
  customers: CustomersAnalytics;
  warehouse: WarehouseAnalytics;
  drivers: DriversAnalytics;
  profitability: ProfitabilityAnalytics;
};

const CUSTOMER_TYPE_COLORS: Record<string, string> = {
  [CustomerType.Hospital]: "#0A1628",
  [CustomerType.Hotel]: "#D4AF37",
  [CustomerType.WalkIn]: "#14B8A6",
};

const STATUS_COLORS = [
  "#0A1628",
  "#D4AF37",
  "#10B981",
  "#F59E0B",
  "#EF4444",
  "#6366F1",
  "#64748B",
];

const CATEGORY_COLORS = [
  "#0A1628", "#D4AF37", "#14B8A6", "#10B981", "#F59E0B",
  "#6366F1", "#EC4899", "#8B5CF6", "#06B6D4", "#84CC16",
  "#F97316", "#64748B", "#EF4444", "#3B82F6",
];

const MASTER_CATEGORY_ORDER = Object.values(ProductCategory);

function productRowMeta(product: ProductRow) {
  return resolveReportProductMeta({
    name: product.name,
    clean_name: product.clean_name,
    category: product.category,
    master_id: product.master_id,
    purchase_price: product.purchase_price,
    sale_price: product.sale_price,
    internal_price_eur: product.internal_price_eur,
    product_masters: product.product_masters,
  });
}

function itemProductMeta(item: ReportOrderItemRow) {
  return resolveReportProductMeta(
    normalizeJoin(item.products) as ReportProductJoin | null,
  );
}

export function calcMargin(purchase: number, sale: number): number {
  return sale > 0 ? ((sale - purchase) / sale) * 100 : 0;
}

function marginBarColor(margin: number): string {
  if (margin > 30) return "#10B981";
  if (margin > 15) return "#F59E0B";
  return "#EF4444";
}

function marginKpiTone(margin: number): ReportKpi["tone"] {
  if (margin > 30) return "success";
  if (margin > 15) return "warning";
  return "danger";
}

function formatMarginPct(margin: number): string {
  return `${margin.toFixed(1)}%`;
}

function formatEuro(value: number): string {
  return value.toLocaleString("el-GR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

type ProductMarginRow = {
  id: string;
  name: string;
  sku: string;
  purchase: number;
  sale: number;
  marginPct: number;
  marginEuro: number;
};

function buildProductMargins(products: ProductRow[]): ProductMarginRow[] {
  return products
    .map((product) => {
      const meta = productRowMeta(product);
      return {
        id: product.id,
        name: meta.displayName,
        sku: product.sku,
        purchase: meta.purchasePrice,
        sale: meta.salePrice,
        marginPct: calcMargin(meta.purchasePrice, meta.salePrice),
        marginEuro: meta.salePrice - meta.purchasePrice,
      };
    })
    .filter((row) => row.sale > 0);
}

function getCompletedOrderIds(
  orders: ReportOrderRow[],
  range: ReportDateRange,
): Set<string> {
  return new Set(
    orders
      .filter(
        (order) =>
          order.status === OrderStatus.Completed &&
          isIsoInReportRange(order.created_at, range),
      )
      .map((order) => order.id),
  );
}

function getItemPurchasePrice(
  item: ReportOrderItemRow,
  purchaseByProductId: Map<string, number>,
): number {
  const meta = itemProductMeta(item);
  if (meta.purchasePrice > 0) return meta.purchasePrice;
  if (item.product_id) {
    return purchaseByProductId.get(item.product_id) ?? 0;
  }
  return 0;
}

function getProductPurchaseById(products: ProductRow[]): Map<string, number> {
  return new Map(
    products.map((product) => {
      const meta = productRowMeta(product);
      return [product.id, meta.purchasePrice] as const;
    }),
  );
}

function calcGrossProfitFromItems(
  items: ReportRawData["orderItems"],
  orderIds: Set<string>,
  purchaseByProductId: Map<string, number>,
): number {
  return items.reduce((sum, item) => {
    if (!orderIds.has(item.order_id)) return sum;
    const purchase = getItemPurchasePrice(item, purchaseByProductId);
    const unitPrice = toNumber(item.unit_price);
    return sum + item.quantity * (unitPrice - purchase);
  }, 0);
}

function qtyByProductThisMonth(
  items: ReportRawData["orderItems"],
  orderIds: Set<string>,
): Map<string, number> {
  const qty = new Map<string, number>();
  for (const item of items) {
    if (!orderIds.has(item.order_id) || !item.product_id) continue;
    qty.set(item.product_id, (qty.get(item.product_id) ?? 0) + item.quantity);
  }
  return qty;
}

function computeProfitability(data: ReportRawData, range: ReportDateRange): ProfitabilityAnalytics {
  const monthRange = resolveReportDateRange("month");
  const completedMonthOrderIds = getCompletedOrderIds(data.orders, monthRange);
  const completedRangeOrderIds = getCompletedOrderIds(data.orders, range);

  const purchaseByProductId = getProductPurchaseById(data.products);

  const productMargins = buildProductMargins(data.products);
  const avgMargin =
    productMargins.length > 0
      ? productMargins.reduce((sum, row) => sum + row.marginPct, 0) / productMargins.length
      : 0;

  const totalGrossProfit = calcGrossProfitFromItems(
    data.orderItems,
    completedMonthOrderIds,
    purchaseByProductId,
  );

  const sortedByMargin = [...productMargins].sort((a, b) => b.marginPct - a.marginPct);
  const bestProduct = sortedByMargin[0];
  const worstProduct = sortedByMargin[sortedByMargin.length - 1];

  const marginByProduct = sortedByMargin.slice(0, 15).map((row) => ({
    id: row.id,
    label: row.name.length > 20 ? `${row.name.slice(0, 18)}…` : row.name,
    value: Math.round(row.marginPct * 10) / 10,
    color: marginBarColor(row.marginPct),
  }));

  const monthlyGrossProfit = getLast12AthensMonths().map(({ yearMonth, label }) => {
    const monthOrderIds = new Set(
      data.orders
        .filter((order) => {
          if (order.status !== OrderStatus.Completed) return false;
          const parsed = new Date(order.created_at);
          return (
            !Number.isNaN(parsed.getTime()) && getAthensYearMonth(parsed) === yearMonth
          );
        })
        .map((order) => order.id),
    );

    let revenue = 0;
    let cost = 0;
    for (const item of data.orderItems) {
      if (!monthOrderIds.has(item.order_id)) continue;
      const purchase = getItemPurchasePrice(item, purchaseByProductId);
      const unitPrice = toNumber(item.unit_price);
      revenue += item.quantity * unitPrice;
      cost += item.quantity * purchase;
    }

    return {
      label,
      revenue: Math.round(revenue * 100) / 100,
      cost: Math.round(cost * 100) / 100,
      profit: Math.round((revenue - cost) * 100) / 100,
    };
  });

  const marginDistribution = [
    {
      id: "margin-high",
      label: "Υψηλό (>40%)",
      value: productMargins.filter((row) => row.marginPct > 40).length,
      color: "#10B981",
    },
    {
      id: "margin-medium",
      label: "Μεσαίο (20-40%)",
      value: productMargins.filter(
        (row) => row.marginPct >= 20 && row.marginPct <= 40,
      ).length,
      color: "#3B82F6",
    },
    {
      id: "margin-low",
      label: "Χαμηλό (10-20%)",
      value: productMargins.filter(
        (row) => row.marginPct >= 10 && row.marginPct < 20,
      ).length,
      color: "#F59E0B",
    },
    {
      id: "margin-very-low",
      label: "Πολύ Χαμηλό (<10%)",
      value: productMargins.filter((row) => row.marginPct < 10).length,
      color: "#EF4444",
    },
  ];

  const monthQtyByProduct = qtyByProductThisMonth(
    data.orderItems,
    completedMonthOrderIds,
  );

  const topProfitableProducts = sortedByMargin.slice(0, 10).map((row) => {
    const qty = monthQtyByProduct.get(row.id) ?? 0;
    const monthProfit = qty * row.marginEuro;
    return {
      product: `${row.name} (${row.sku})`,
      purchase: formatEuro(row.purchase),
      sale: formatEuro(row.sale),
      marginEuro: formatEuro(row.marginEuro),
      marginPct: formatMarginPct(row.marginPct),
      marginTone: marginKpiTone(row.marginPct) ?? "default",
      salesQty: qty,
      monthProfit: formatEuro(monthProfit),
    };
  });

  const priceReviewProducts = productMargins
    .filter((row) => row.marginPct < 15)
    .sort((a, b) => a.marginPct - b.marginPct)
    .map((row) => ({
      productId: row.id,
      product: `${row.name} (${row.sku})`,
      marginPct: Math.round(row.marginPct * 10) / 10,
      purchase: row.purchase,
      sale: row.sale,
      suggestedPrice: Math.round((row.purchase / (1 - 0.3)) * 100) / 100,
    }));

  const customerProfit = new Map<
    string,
    { name: string; type: string; revenue: number; cost: number }
  >();

  for (const item of data.orderItems) {
    if (!completedRangeOrderIds.has(item.order_id)) continue;
    const order = data.orders.find((row) => row.id === item.order_id);
    if (!order) continue;
    const customer = normalizeJoin(order.customers);
    const purchase = getItemPurchasePrice(item, purchaseByProductId);
    const unitPrice = toNumber(item.unit_price);
    const lineRevenue = item.quantity * unitPrice;
    const lineCost = item.quantity * purchase;
    const prev = customerProfit.get(order.customer_id);
    customerProfit.set(order.customer_id, {
      name: customer?.name ?? prev?.name ?? "—",
      type: customer?.type ?? prev?.type ?? "walk-in",
      revenue: (prev?.revenue ?? 0) + lineRevenue,
      cost: (prev?.cost ?? 0) + lineCost,
    });
  }

  const customerProfitability = [...customerProfit.entries()]
    .map(([customerId, row]) => {
      const profit = row.revenue - row.cost;
      const margin = row.revenue > 0 ? (profit / row.revenue) * 100 : 0;
      return {
        customerId,
        customer: row.name,
        type: mapDbCustomerType(row.type),
        revenue: row.revenue,
        cost: row.cost,
        profit,
        marginPct: margin,
      };
    })
    .sort((a, b) => b.profit - a.profit)
    .map((row) => ({
      customerId: row.customerId,
      customer: row.customer,
      type: row.type,
      revenue: formatEuro(row.revenue),
      cost: formatEuro(row.cost),
      profit: formatEuro(row.profit),
      marginPct: formatMarginPct(row.marginPct),
    }));

  return {
    kpis: [
      {
        key: "avgMargin",
        label: "Μέσο Περιθώριο Κέρδους",
        value: formatMarginPct(avgMargin),
        tone: marginKpiTone(avgMargin),
      },
      {
        key: "grossProfit",
        label: "Συνολικό Μικτό Κέρδος (€)",
        value: `€${formatEuro(totalGrossProfit)}`,
        hint: "Ολοκληρωμένες παραγγελίες μήνα · κόστος από τιμή αγοράς ή εσωτερική αναφορά",
      },
      {
        key: "bestProduct",
        label: "Καλύτερο Προϊόν (margin)",
        value: bestProduct
          ? `${bestProduct.name} (${formatMarginPct(bestProduct.marginPct)})`
          : "—",
        tone: bestProduct ? "success" : "default",
      },
      {
        key: "worstProduct",
        label: "Χειρότερο Προϊόν (margin)",
        value: worstProduct
          ? `${worstProduct.name} (${formatMarginPct(worstProduct.marginPct)})`
          : "—",
        tone: worstProduct ? "danger" : "default",
      },
    ],
    marginByProduct,
    monthlyGrossProfit,
    marginDistribution,
    topProfitableProducts,
    priceReviewProducts,
    customerProfitability,
  };
}

function filterOrdersByRange(orders: ReportOrderRow[], range: ReportDateRange) {
  return orders.filter((order) => isIsoInReportRange(order.created_at, range));
}

function sumOrderRevenue(orders: ReportOrderRow[]): number {
  return orders.reduce((sum, order) => sum + toNumber(order.total), 0);
}

function growthPct(current: number, previous: number): number {
  if (previous <= 0) return current > 0 ? 100 : 0;
  return Math.round(((current - previous) / previous) * 100);
}

function computeSales(data: ReportRawData, range: ReportDateRange): SalesAnalytics {
  const ordersInRange = filterOrdersByRange(data.orders, range);
  const prevRange = getPreviousPeriod(range);
  const prevOrders = filterOrdersByRange(data.orders, prevRange);

  const totalRevenue = sumOrderRevenue(ordersInRange);
  const prevRevenue = sumOrderRevenue(prevOrders);
  const orderCount = ordersInRange.length;
  const averageOrder = orderCount > 0 ? totalRevenue / orderCount : 0;
  const growth = growthPct(totalRevenue, prevRevenue);

  const revenueByMonth = getLast12AthensMonths().map(({ yearMonth, label }) => {
    const monthOrders = data.orders.filter((order) => {
      const parsed = new Date(order.created_at);
      return (
        !Number.isNaN(parsed.getTime()) && getAthensYearMonth(parsed) === yearMonth
      );
    });
    return {
      id: yearMonth,
      label,
      value: Math.round(sumOrderRevenue(monthOrders) * 100) / 100,
    };
  });

  const statusCounts = new Map<string, number>();
  for (const order of ordersInRange) {
    statusCounts.set(order.status, (statusCounts.get(order.status) ?? 0) + 1);
  }
  const ordersByStatus = [...statusCounts.entries()]
    .map(([label, value], index) => ({
      id: label,
      label,
      value,
      color: STATUS_COLORS[index % STATUS_COLORS.length],
    }))
    .sort((a, b) => b.value - a.value);

  const revenueByType = new Map<string, number>();
  for (const order of ordersInRange) {
    const customer = normalizeJoin(order.customers);
    const typeLabel = mapDbCustomerType(customer?.type ?? "walk-in");
    revenueByType.set(
      typeLabel,
      (revenueByType.get(typeLabel) ?? 0) + toNumber(order.total),
    );
  }
  const revenueByCustomerType = [
    CustomerType.Hospital,
    CustomerType.Hotel,
    CustomerType.WalkIn,
  ].map((label) => ({
    id: label,
    label,
    value: Math.round((revenueByType.get(label) ?? 0) * 100) / 100,
    color: CUSTOMER_TYPE_COLORS[label],
  }));

  const topOrders = [...ordersInRange]
    .sort((a, b) => toNumber(b.total) - toNumber(a.total))
    .slice(0, 10)
    .map((order) => {
      const customer = normalizeJoin(order.customers);
      return {
        orderNumber: order.order_number ?? order.id.slice(0, 8).toUpperCase(),
        customer: customer?.name ?? "—",
        status: order.status,
        total: Math.round(toNumber(order.total) * 100) / 100,
        date: getAthensDateString(new Date(order.created_at)),
      };
    });

  return {
    kpis: [
      {
        key: "revenue",
        label: "Συνολικά Έσοδα (€)",
        value: `€${totalRevenue.toLocaleString("el-GR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      },
      {
        key: "avg",
        label: "Μέση Αξία Παραγγελίας (€)",
        value: `€${averageOrder.toLocaleString("el-GR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      },
      {
        key: "count",
        label: "Παραγγελίες",
        value: String(orderCount),
      },
      {
        key: "growth",
        label: "Ρυθμός Ανάπτυξης",
        value: `${growth >= 0 ? "+" : ""}${growth}%`,
        tone: growth >= 0 ? "success" : "danger",
        hint: "vs προηγ. περίοδο",
      },
    ],
    revenueByMonth,
    ordersByStatus,
    revenueByCustomerType,
    topOrders,
  };
}

function computeProducts(data: ReportRawData, range: ReportDateRange): ProductsAnalytics {
  const products = data.products;
  const lowStock = products.filter(
    (product) => getStockStatus(product.stock, product.min_stock) !== "adequate",
  );

  const inventoryValue = products.reduce((sum, product) => {
    const meta = productRowMeta(product);
    return sum + product.stock * meta.purchasePrice;
  }, 0);

  const productQty = new Map<string, { name: string; quantity: number }>();
  for (const item of data.orderItems) {
    const order = data.orders.find((row) => row.id === item.order_id);
    if (!order || !isIsoInReportRange(order.created_at, range)) continue;
    const meta = itemProductMeta(item);
    const groupKey = meta.masterKey;
    const prev = productQty.get(groupKey);
    productQty.set(groupKey, {
      name: meta.displayName,
      quantity: (prev?.quantity ?? 0) + (item.quantity ?? 0),
    });
  }

  const topByVolume = [...productQty.values()]
    .sort((a, b) => b.quantity - a.quantity)
    .slice(0, 10);

  const mostPopular = topByVolume[0]?.name ?? "—";

  const stockLevels = [...products]
    .sort((a, b) => a.stock - b.stock)
    .slice(0, 20)
    .map((product) => {
      const meta = productRowMeta(product);
      const status = getStockStatus(product.stock, product.min_stock);
      const color =
        status === "adequate"
          ? "#10B981"
          : status === "low"
            ? "#F59E0B"
            : "#EF4444";
      return {
        id: product.id,
        label:
          meta.displayName.length > 18
            ? `${meta.displayName.slice(0, 16)}…`
            : meta.displayName,
        value: product.stock,
        color,
      };
    });

  const categoryStock = new Map<string, number>();
  for (const product of products) {
    const category = productRowMeta(product).category;
    categoryStock.set(category, (categoryStock.get(category) ?? 0) + product.stock);
  }
  const stockByCategory = MASTER_CATEGORY_ORDER.map((label, index) => ({
    id: label,
    label,
    value: categoryStock.get(label) ?? 0,
    color: CATEGORY_COLORS[index % CATEGORY_COLORS.length],
  })).filter((row) => row.value > 0);

  const colorSales = new Map<string, ColorSalesRow>();
  for (const item of data.orderItems) {
    const order = data.orders.find((row) => row.id === item.order_id);
    if (!order || !isIsoInReportRange(order.created_at, range)) continue;
    if (!item.color_id) continue;
    const color = normalizeJoin(item.product_colors);
    const prev = colorSales.get(item.color_id);
    colorSales.set(item.color_id, {
      colorId: item.color_id,
      name: color?.name ?? prev?.name ?? "—",
      hexCode: color?.hex_code ?? prev?.hexCode ?? "#64748B",
      quantity: (prev?.quantity ?? 0) + (item.quantity ?? 0),
    });
  }
  const colorDistribution = [...colorSales.values()]
    .sort((a, b) => b.quantity - a.quantity)
    .slice(0, 8)
    .map((row) => ({
      id: row.colorId,
      label: row.name,
      value: row.quantity,
      color: row.hexCode,
    }));

  const lowStockProducts = [...products]
    .filter((product) => getStockStatus(product.stock, product.min_stock) !== "adequate")
    .sort((a, b) => a.stock - b.stock)
    .slice(0, 15)
    .map((product) => {
      const meta = productRowMeta(product);
      return {
      product: meta.displayName,
      sku: product.sku,
      stock: product.stock,
      minStock: product.min_stock,
      status:
        getStockStatus(product.stock, product.min_stock) === "critical"
          ? "Κρίσιμο"
          : "Χαμηλό",
    };});

  return {
    kpis: [
      { key: "skus", label: "Συνολικά SKUs", value: String(products.length) },
      {
        key: "low",
        label: "Χαμηλό Απόθεμα",
        value: String(lowStock.length),
        tone: lowStock.length > 0 ? "danger" : "default",
      },
      {
        key: "value",
        label: "Συνολική Αξία Αποθέματος (€)",
        value: `€${inventoryValue.toLocaleString("el-GR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      },
      {
        key: "popular",
        label: "Πιο Δημοφιλές Προϊόν",
        value: mostPopular,
      },
    ],
    stockLevels,
    stockByCategory,
    colorDistribution,
    lowStockProducts,
    topProductsByVolume: topByVolume.map((row, index) => ({
      rank: index + 1,
      product: row.name,
      quantity: row.quantity,
    })),
  };
}

function computeCustomers(data: ReportRawData, range: ReportDateRange): CustomersAnalytics {
  const ordersInRange = filterOrdersByRange(data.orders, range);

  const newCustomers = data.customers.filter((customer) =>
    isIsoInReportRange(customer.created_at, range),
  ).length;

  const spendByCustomer = new Map<
    string,
    { name: string; type: string; orders: number; total: number; lastOrder: string }
  >();

  for (const order of ordersInRange) {
    const customer = normalizeJoin(order.customers);
    const prev = spendByCustomer.get(order.customer_id);
    spendByCustomer.set(order.customer_id, {
      name: customer?.name ?? prev?.name ?? "—",
      type: customer?.type ?? prev?.type ?? "walk-in",
      orders: (prev?.orders ?? 0) + 1,
      total: (prev?.total ?? 0) + toNumber(order.total),
      lastOrder:
        !prev?.lastOrder || order.created_at > prev.lastOrder
          ? order.created_at
          : prev.lastOrder,
    });
  }

  const rangeSpend = [...spendByCustomer.values()];

  const totalCustomerRevenue = rangeSpend.reduce((sum, row) => sum + row.total, 0);
  const activeCustomers = spendByCustomer.size;
  const avgCustomerValue =
    activeCustomers > 0 ? totalCustomerRevenue / activeCustomers : 0;

  const bestCustomer = [...spendByCustomer.entries()]
    .sort((a, b) => b[1].total - a[1].total)[0];

  const typeCounts = new Map<string, number>();
  for (const customer of data.customers) {
    const label = mapDbCustomerType(customer.type);
    typeCounts.set(label, (typeCounts.get(label) ?? 0) + 1);
  }
  const customersByType = [
    CustomerType.Hospital,
    CustomerType.Hotel,
    CustomerType.WalkIn,
  ].map((label) => ({
    id: label,
    label,
    value: typeCounts.get(label) ?? 0,
    color: CUSTOMER_TYPE_COLORS[label],
  }));

  const cityRevenue = new Map<string, number>();
  for (const order of ordersInRange) {
    const customerRow = data.customers.find((c) => c.id === order.customer_id);
    const city = customerRow?.city?.trim() || "Άγνωστη";
    cityRevenue.set(city, (cityRevenue.get(city) ?? 0) + toNumber(order.total));
  }
  const revenueByCity = [...cityRevenue.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([label, value]) => ({
      id: label,
      label,
      value: Math.round(value * 100) / 100,
    }));

  const growthMonths = getLast12AthensMonths();
  const customerGrowth = growthMonths.map(({ yearMonth, label }) => {
    const count = data.customers.filter((customer) => {
      const parsed = new Date(customer.created_at);
      return (
        !Number.isNaN(parsed.getTime()) && getAthensYearMonth(parsed) === yearMonth
      );
    }).length;
    return { id: yearMonth, label, value: count };
  });

  const topCustomers = [...spendByCustomer.entries()]
    .sort((a, b) => b[1].total - a[1].total)
    .slice(0, 10)
    .map(([customerId, row]) => ({
      customerId,
      customer: row.name,
      type: mapDbCustomerType(row.type),
      orders: row.orders,
      total: Math.round(row.total * 100) / 100,
      lastOrder: getAthensDateString(new Date(row.lastOrder)),
    }));

  return {
    kpis: [
      { key: "active", label: "Ενεργοί Πελάτες", value: String(activeCustomers) },
      { key: "new", label: "Νέοι Περίοδος", value: String(newCustomers) },
      {
        key: "avg",
        label: "Μέση Αξία Πελάτη (€)",
        value: `€${avgCustomerValue.toLocaleString("el-GR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      },
      {
        key: "best",
        label: "Καλύτερος Πελάτης",
        value: bestCustomer?.[1].name ?? "—",
      },
    ],
    customersByType,
    revenueByCity,
    customerGrowth,
    topCustomers,
  };
}

const FUNNEL_STAGES: { label: string; statuses: string[] }[] = [
  { label: "Επιβεβαιώθηκε", statuses: [OrderStatus.Confirmed] },
  {
    label: "Picking",
    statuses: [OrderStatus.Processing, OrderStatus.Scheduled, OrderStatus.Reserved],
  },
  { label: "Έτοιμο", statuses: [OrderStatus.ReadyForShipment] },
  { label: "Αποστολή", statuses: [OrderStatus.Shipped, OrderStatus.PartialShipment] },
  { label: "Παραδόθηκε", statuses: [OrderStatus.Completed] },
];

function computeWarehouse(data: ReportRawData, range: ReportDateRange): WarehouseAnalytics {
  const ordersInRange = filterOrdersByRange(data.orders, range);
  const today = getAthensDateString();

  const pendingStatuses = [
    OrderStatus.Processing,
    OrderStatus.Scheduled,
    OrderStatus.Confirmed,
    OrderStatus.ReadyForShipment,
    OrderStatus.Reserved,
  ];
  const pendingOrders = ordersInRange.filter((order) =>
    pendingStatuses.includes(order.status as (typeof pendingStatuses)[number]),
  ).length;

  const todayOrders = data.orders.filter((order) =>
    isIsoInReportRange(order.created_at, {
      preset: "today",
      startDate: today,
      endDate: today,
      label: "Σήμερα",
    }),
  ).length;

  const returns = ordersInRange.filter(
    (order) => order.status === OrderStatus.Cancelled,
  ).length;

  const orderFunnel = FUNNEL_STAGES.map((stage, index) => ({
    id: stage.label,
    label: stage.label,
    value: ordersInRange.filter((order) => stage.statuses.includes(order.status)).length,
    color: STATUS_COLORS[index % STATUS_COLORS.length],
  }));

  const itemsByOrder = new Map<string, ReportRawData["orderItems"]>();
  for (const item of data.orderItems) {
    const list = itemsByOrder.get(item.order_id) ?? [];
    list.push(item);
    itemsByOrder.set(item.order_id, list);
  }

  const pickingByDay = new Map<string, { totalMinutes: number; count: number }>();
  for (const order of ordersInRange) {
    const orderItems = itemsByOrder.get(order.id) ?? [];
    const pickedTimes = orderItems
      .map((item) => item.picked_at)
      .filter((value): value is string => Boolean(value))
      .map((iso) => new Date(iso).getTime())
      .filter((time) => !Number.isNaN(time));
    if (pickedTimes.length === 0) continue;
    const created = new Date(order.created_at).getTime();
    if (Number.isNaN(created)) continue;
    const lastPicked = Math.max(...pickedTimes);
    const minutes = Math.round((lastPicked - created) / 60000);
    if (minutes <= 0 || minutes > 48 * 60) continue;
    const day = getAthensDateString(new Date(order.created_at));
    const prev = pickingByDay.get(day);
    pickingByDay.set(day, {
      totalMinutes: (prev?.totalMinutes ?? 0) + minutes,
      count: (prev?.count ?? 0) + 1,
    });
  }
  const pickingTimeByDay = [...pickingByDay.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-14)
    .map(([day, row]) => ({
      id: day,
      label: day.slice(5),
      value: row.count > 0 ? Math.round(row.totalMinutes / row.count) : 0,
    }));

  const movementsInRange = data.inventoryMovements.filter((movement) =>
    isIsoInReportRange(movement.created_at, range),
  );
  const movementWeeks = new Map<string, { inQty: number; outQty: number }>();
  for (const movement of movementsInRange) {
    const day = getAthensDateString(new Date(movement.created_at));
    const weekStart = day;
    const prev = movementWeeks.get(weekStart) ?? { inQty: 0, outQty: 0 };
    if (movement.type === "in") prev.inQty += movement.quantity;
    else if (movement.type === "out") prev.outQty += movement.quantity;
    movementWeeks.set(weekStart, prev);
  }
  const stockMovements = [...movementWeeks.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-8)
    .map(([date, row]) => ({
      id: date,
      label: date.slice(5),
      value: row.inQty,
      value2: row.outQty,
    }));

  const pickingSamples = [...pickingByDay.values()].reduce((sum, row) => sum + row.count, 0);
  const avgPicking =
    pickingSamples > 0
      ? Math.round(
          pickingTimeByDay.reduce((sum, row) => sum + row.value, 0) /
            Math.max(pickingTimeByDay.length, 1),
        )
      : null;

  const recentMovements = [...movementsInRange]
    .sort((a, b) => b.created_at.localeCompare(a.created_at))
    .slice(0, 12)
    .map((movement) => {
      const product = normalizeJoin(movement.products);
      const meta = resolveReportProductMeta(
        product as ReportProductJoin | null,
        product?.name ?? "—",
      );
      return {
        product: meta.displayName,
        type:
          movement.type === "in"
            ? "Εισερχόμενο"
            : movement.type === "out"
              ? "Εξερχόμενο"
              : "Διόρθωση",
        quantity: movement.quantity,
        reason: movement.reason ?? "—",
        date: getAthensDateString(new Date(movement.created_at)),
      };
    });

  return {
    kpis: [
      { key: "pending", label: "Εκκρεμείς Παραγγελίες", value: String(pendingOrders) },
      {
        key: "picking",
        label: "Μέσος Χρόνος Picking",
        value: avgPicking != null ? `${avgPicking} λεπτά` : INSUFFICIENT_DATA,
        hint:
          avgPicking != null
            ? "Από δημιουργία παραγγελίας έως τελευταίο picked_at"
            : undefined,
      },
      { key: "today", label: "Παραγγελίες Σήμερα", value: String(todayOrders) },
      {
        key: "returns",
        label: "Ακυρώσεις",
        value: String(returns),
        tone: returns > 0 ? "danger" : "default",
      },
    ],
    orderFunnel,
    pickingTimeByDay,
    stockMovements,
    recentMovements,
  };
}

function tripDurationMinutes(trip: DeliveryTripRow): number | null {
  if (!trip.departed_at || !trip.returned_at) return null;
  const start = new Date(trip.departed_at).getTime();
  const end = new Date(trip.returned_at).getTime();
  if (Number.isNaN(start) || Number.isNaN(end) || end <= start) return null;
  const minutes = Math.round((end - start) / 60000);
  return minutes > 0 && minutes <= 24 * 60 ? minutes : null;
}

function computeDrivers(data: ReportRawData, range: ReportDateRange): DriversAnalytics {
  const today = getAthensDateString();
  const tripsInRange = data.deliveryTrips.filter((trip) =>
    isDateInReportRange(trip.trip_date, range),
  );
  const tripsToday = data.deliveryTrips.filter((trip) => trip.trip_date === today);
  const tripIdsInRange = new Set(tripsInRange.map((trip) => trip.id));
  const tripIdsToday = new Set(tripsToday.map((trip) => trip.id));

  const ordersOnTrips = data.orders.filter(
    (order) => order.trip_id && tripIdsInRange.has(order.trip_id),
  );
  const ordersOnTripsToday = data.orders.filter(
    (order) => order.trip_id && tripIdsToday.has(order.trip_id),
  );

  const completedTrips = tripsInRange.filter((trip) => trip.status === "completed");
  const pendingTrips = tripsInRange.length - completedTrips.length;

  const durationSamples = tripsInRange
    .map((trip) => tripDurationMinutes(trip))
    .filter((value): value is number => value != null);
  const avgDeliveryMinutes =
    durationSamples.length > 0
      ? Math.round(durationSamples.reduce((sum, v) => sum + v, 0) / durationSamples.length)
      : null;

  const driverCards: DriverCardData[] = data.drivers.map((driver) => {
    const driverTripsToday = tripsToday.filter((trip) => trip.driver_id === driver.id);
    const driverTripIds = new Set(driverTripsToday.map((trip) => trip.id));
    const driverOrdersToday = ordersOnTripsToday.filter(
      (order) => order.trip_id && driverTripIds.has(order.trip_id),
    );
    const deliveriesTotal = driverOrdersToday.length;
    const deliveriesDone = driverOrdersToday.filter(
      (order) => order.status === OrderStatus.Completed,
    ).length;
    const boxesDone = driverTripsToday.reduce((sum, trip) => sum + trip.total_boxes, 0);
    const vehicle = driverTripsToday[0] ? normalizeJoin(driverTripsToday[0].vehicles) : null;
    const boxesTotal = Math.max(vehicle?.max_boxes ?? 0, boxesDone, 1);
    const activeTrips = driverTripsToday.filter((trip) => trip.status !== "completed").length;

    return {
      id: driver.id,
      name: driver.name,
      vehiclePlate: driver.vehiclePlate ?? vehicle?.plate ?? "—",
      deliveriesToday: deliveriesDone,
      deliveriesTotal,
      progressPct:
        deliveriesTotal > 0 ? Math.round((deliveriesDone / deliveriesTotal) * 100) : 0,
      boxesDone,
      boxesTotal,
      tripsCount: driverTripsToday.length,
      statusLabel:
        driverTripsToday.length === 0
          ? "Χωρίς δρομολόγιο"
          : activeTrips > 0
            ? "Σε δρόμο"
            : deliveriesTotal > 0 && deliveriesDone === deliveriesTotal
              ? "Ολοκληρώθηκε"
              : "Σε εξέλιξη",
    };
  });

  const rangeStatsByDriver = new Map<string, { deliveries: number; completed: number; label: string }>();
  for (const driver of data.drivers) {
    rangeStatsByDriver.set(driver.id, {
      deliveries: 0,
      completed: 0,
      label: driver.name.split(" ")[0] ?? driver.name,
    });
  }
  for (const order of ordersOnTrips) {
    const trip = tripsInRange.find((row) => row.id === order.trip_id);
    if (!trip) continue;
    const stats = rangeStatsByDriver.get(trip.driver_id);
    if (!stats) continue;
    stats.deliveries += 1;
    if (order.status === OrderStatus.Completed) stats.completed += 1;
  }

  const deliveriesPerDriver = [...rangeStatsByDriver.entries()]
    .filter(([, stats]) => stats.deliveries > 0)
    .map(([id, stats]) => ({
      id,
      label: stats.label,
      value: stats.deliveries,
      color: "#0A1628",
    }))
    .sort((a, b) => b.value - a.value);

  const deliverySuccessRate = [...rangeStatsByDriver.entries()]
    .filter(([, stats]) => stats.deliveries > 0)
    .map(([id, stats]) => {
      const pct = stats.deliveries > 0 ? Math.round((stats.completed / stats.deliveries) * 100) : 0;
      return { id, label: stats.label, value: pct, color: pct >= 80 ? "#10B981" : "#F59E0B" };
    })
    .sort((a, b) => b.value - a.value);

  const driverStatusTable = driverCards
    .filter((driver) => driver.tripsCount > 0)
    .map((driver) => ({
      driver: driver.name,
      vehicle: driver.vehiclePlate,
      deliveries: `${driver.deliveriesToday}/${driver.deliveriesTotal}`,
      boxes: `${driver.boxesDone}/${driver.boxesTotal}`,
      trips: driver.tripsCount,
      status: driver.statusLabel,
    }));

  const totalDeliveries = driverCards.reduce((sum, driver) => sum + driver.deliveriesToday, 0);
  const totalOrdersOnTrips = ordersOnTrips.length;
  const completedOrdersOnTrips = ordersOnTrips.filter((o) => o.status === OrderStatus.Completed).length;
  const successPct =
    totalOrdersOnTrips > 0 ? Math.round((completedOrdersOnTrips / totalOrdersOnTrips) * 100) : 0;

  return {
    kpis: [
      {
        key: "today",
        label: "Παραδόσεις Περιόδου",
        value: String(totalDeliveries),
        hint: range.label,
      },
      { key: "done", label: "Ολοκληρωμένα Δρομολόγια", value: String(completedTrips.length) },
      { key: "pending", label: "Εκκρεμή Δρομολόγια", value: String(pendingTrips) },
      {
        key: "success",
        label: "Επιτυχία Παραδόσεων (%)",
        value: totalOrdersOnTrips > 0 ? `${successPct}%` : INSUFFICIENT_DATA,
      },
      {
        key: "avg",
        label: "Μέσος Χρόνος Παράδοσης",
        value: avgDeliveryMinutes != null ? `${avgDeliveryMinutes} λεπτά` : INSUFFICIENT_DATA,
        hint: avgDeliveryMinutes != null ? "Από departed_at έως returned_at" : undefined,
      },
    ],
    driverCards: driverCards.filter((d) => d.tripsCount > 0),
    deliveriesPerDriver,
    deliverySuccessRate,
    driverStatusTable,
  };
}

function computeOverview(
  metrics: OverviewMetrics | null | undefined,
  range: ReportDateRange,
): OverviewAnalytics {
  if (!metrics) {
    return {
      kpis: [
        { key: "sessions", label: "Συνεδρίες Website", value: "—" },
        { key: "conversion", label: "Conversion Rate Website", value: "—" },
        { key: "referrer", label: "Κορυφαία Πηγή", value: "—" },
        { key: "dolphin", label: "Dolphin AI", value: "—" },
        { key: "quoteConv", label: "Προσφορά → Παραγγελία", value: "—" },
        { key: "onTime", label: "Παράδοση εγκαίρως", value: "—" },
      ],
    };
  }

  return {
    kpis: [
      {
        key: "sessions",
        label: "Συνεδρίες Website",
        value: metrics.sessions.toLocaleString("el-GR"),
        hint: range.label,
      },
      {
        key: "conversion",
        label: "Conversion Rate Website",
        value: `${metrics.conversionRatePct}%`,
        hint: "Συνεδρίες με αίτημα προσφοράς",
      },
      {
        key: "referrer",
        label: "Κορυφαία Πηγή",
        value: metrics.topReferrer,
        hint: range.label,
      },
      {
        key: "dolphin",
        label: "Dolphin AI",
        value: `${metrics.dolphinConversations} συνομιλίες`,
        hint: `${metrics.dolphinTokens.toLocaleString("el-GR")} tokens συνολικά`,
      },
      {
        key: "quoteConv",
        label: "Προσφορά → Παραγγελία",
        value: `${metrics.quoteConversionPct}%`,
        hint: `${metrics.quotesConverted}/${metrics.quotesTotal} αιτήματα`,
      },
      {
        key: "onTime",
        label: "Παράδοση εγκαίρως",
        value:
          metrics.deliveryOnTimePct != null
            ? `${metrics.deliveryOnTimePct}%`
            : INSUFFICIENT_DATA,
        hint:
          metrics.deliveryOnTimePct != null
            ? `${metrics.deliveryEligible} παραδόσεις με ημερομηνία`
            : "Απαιτούνται ≥3 ολοκληρωμένες παραδόσεις",
        tone:
          metrics.deliveryOnTimePct != null && metrics.deliveryOnTimePct >= 90
            ? "success"
            : metrics.deliveryOnTimePct != null && metrics.deliveryOnTimePct < 75
              ? "warning"
              : "default",
      },
    ],
  };
}

export function computeFullAnalytics(
  data: ReportRawData,
  range: ReportDateRange,
): FullAnalytics {
  return {
    overview: computeOverview(data.overview, range),
    sales: computeSales(data, range),
    products: computeProducts(data, range),
    customers: computeCustomers(data, range),
    warehouse: computeWarehouse(data, range),
    drivers: computeDrivers(data, range),
    profitability: computeProfitability(data, range),
  };
}

export function exportTableToCsv(
  filename: string,
  columns: { key: string; label: string }[],
  rows: ReportTableRow[],
) {
  const header = columns.map((column) => column.label).join(",");
  const body = rows
    .map((row) =>
      columns
        .map((column) => {
          const value = row[column.key];
          const text = value == null ? "" : String(value);
          return `"${text.replace(/"/g, '""')}"`;
        })
        .join(","),
    )
    .join("\n");
  const blob = new Blob([`\uFEFF${header}\n${body}`], {
    type: "text/csv;charset=utf-8;",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}
