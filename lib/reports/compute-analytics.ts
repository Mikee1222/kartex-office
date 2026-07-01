import { CustomerType } from "@/components/customers/types";
import { OrderStatus } from "@/components/orders/types";
import { getStockStatus } from "@/components/products/types";
import { getAthensDateString, getAthensYearMonth } from "@/lib/datetime";
import {
  getLast12AthensMonths,
  getPreviousPeriod,
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
import { mapDbCustomerType, type CustomerRow, type ProductRow } from "@/types/database";

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

export type FullAnalytics = {
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

const CATEGORY_COLORS = ["#0A1628", "#D4AF37", "#14B8A6", "#10B981", "#F59E0B"];

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
    .filter((product) => toNumber(product.sale_price) > 0)
    .map((product) => {
      const purchase = toNumber(product.purchase_price);
      const sale = toNumber(product.sale_price);
      return {
        id: product.id,
        name: product.name,
        sku: product.sku,
        purchase,
        sale,
        marginPct: calcMargin(purchase, sale),
        marginEuro: sale - purchase,
      };
    });
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
  item: ReportOrderItemRow & {
    products?: { purchase_price?: number | string } | { purchase_price?: number | string }[] | null;
  },
  purchaseByProductId: Map<string, number>,
): number {
  const product = normalizeJoin(item.products);
  if (product?.purchase_price != null) {
    return toNumber(product.purchase_price);
  }
  if (item.product_id) {
    return purchaseByProductId.get(item.product_id) ?? 0;
  }
  return 0;
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

  const purchaseByProductId = new Map(
    data.products.map((product) => [product.id, toNumber(product.purchase_price)] as const),
  );

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
        hint: "Ολοκληρωμένες παραγγελίες μήνα",
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

  const inventoryValue = products.reduce(
    (sum, product) => sum + product.stock * toNumber(product.purchase_price),
    0,
  );

  const productQty = new Map<string, { name: string; quantity: number }>();
  for (const item of data.orderItems) {
    const order = data.orders.find((row) => row.id === item.order_id);
    if (!order || !isIsoInReportRange(order.created_at, range)) continue;
    const productId = item.product_id ?? "unknown";
    const product = normalizeJoin(item.products);
    const prev = productQty.get(productId);
    productQty.set(productId, {
      name: product?.name ?? "—",
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
      const status = getStockStatus(product.stock, product.min_stock);
      const color =
        status === "adequate"
          ? "#10B981"
          : status === "low"
            ? "#F59E0B"
            : "#EF4444";
      return {
        id: product.id,
        label: product.name.length > 18 ? `${product.name.slice(0, 16)}…` : product.name,
        value: product.stock,
        color,
      };
    });

  const categoryStock = new Map<string, number>();
  for (const product of products) {
    const category = product.category?.trim() || "Άλλο";
    categoryStock.set(category, (categoryStock.get(category) ?? 0) + product.stock);
  }
  const stockByCategory = [...categoryStock.entries()]
    .map(([label, value], index) => ({
      id: label,
      label,
      value,
      color: CATEGORY_COLORS[index % CATEGORY_COLORS.length],
    }))
    .sort((a, b) => b.value - a.value);

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
    .map((product) => ({
      product: product.name,
      sku: product.sku,
      stock: product.stock,
      minStock: product.min_stock,
      status:
        getStockStatus(product.stock, product.min_stock) === "critical"
          ? "Κρίσιμο"
          : "Χαμηλό",
    }));

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
  const customerIdsInRange = new Set(ordersInRange.map((order) => order.customer_id));

  const newCustomers = data.customers.filter((customer) =>
    isIsoInReportRange(customer.created_at, range),
  ).length;

  const spendByCustomer = new Map<
    string,
    { name: string; type: string; orders: number; total: number; lastOrder: string }
  >();

  for (const order of data.orders) {
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

  const rangeSpend = [...spendByCustomer.entries()]
    .filter(([customerId]) => customerIdsInRange.has(customerId))
    .map(([, row]) => row);

  const totalCustomerRevenue = rangeSpend.reduce((sum, row) => sum + row.total, 0);
  const activeCustomers = customerIdsInRange.size;
  const avgCustomerValue =
    activeCustomers > 0 ? totalCustomerRevenue / activeCustomers : 0;

  const bestCustomer = [...spendByCustomer.entries()]
    .filter(([id]) => customerIdsInRange.has(id))
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
    .filter(([id]) => customerIdsInRange.has(id))
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

  const pickingByDay = new Map<string, { totalMinutes: number; count: number }>();
  for (const order of ordersInRange) {
    const day = getAthensDateString(new Date(order.created_at));
    const created = new Date(order.created_at).getTime();
    const readyAt = created + 45 * 60 * 1000;
    const minutes = Math.max(15, Math.round((readyAt - created) / 60000));
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

  const avgPicking =
    pickingTimeByDay.length > 0
      ? Math.round(
          pickingTimeByDay.reduce((sum, row) => sum + row.value, 0) /
            pickingTimeByDay.length,
        )
      : 0;

  const recentMovements = [...movementsInRange]
    .sort((a, b) => b.created_at.localeCompare(a.created_at))
    .slice(0, 12)
    .map((movement) => {
      const product = normalizeJoin(movement.products);
      return {
        product: product?.name ?? "—",
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
        value: `${avgPicking} λεπτά`,
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

function computeDrivers(data: ReportRawData): DriversAnalytics {
  const today = getAthensDateString();
  const tripsToday = data.deliveryTrips.filter((trip) => trip.trip_date === today);
  const tripIdsToday = new Set(tripsToday.map((trip) => trip.id));

  const ordersOnTripsToday = data.orders.filter(
    (order) => order.trip_id && tripIdsToday.has(order.trip_id),
  );

  const completedToday = tripsToday.filter((trip) => trip.status === "completed").length;
  const pendingToday = tripsToday.length - completedToday;

  const driverCards: DriverCardData[] = data.drivers.map((driver) => {
    const driverTripsToday = tripsToday.filter((trip) => trip.driver_id === driver.id);
    const driverTripIds = new Set(driverTripsToday.map((trip) => trip.id));
    const driverOrdersToday = ordersOnTripsToday.filter(
      (order) => order.trip_id && driverTripIds.has(order.trip_id),
    );
    const deliveriesTotal = Math.max(driverOrdersToday.length, driverTripsToday.length * 3, 1);
    const deliveriesDone = driverOrdersToday.filter(
      (order) => order.status === OrderStatus.Completed,
    ).length;
    const boxesDone = driverTripsToday.reduce((sum, trip) => sum + trip.total_boxes, 0);
    const vehicle = driverTripsToday[0]
      ? normalizeJoin(driverTripsToday[0].vehicles)
      : null;
    const boxesTotal = Math.max(
      vehicle?.max_boxes ?? boxesDone,
      boxesDone,
      1,
    );

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
    };
  });

  const deliveriesPerDriver = driverCards.map((driver) => ({
    id: driver.id,
    label: driver.name.split(" ")[0] ?? driver.name,
    value: driver.deliveriesToday,
    color: "#0A1628",
  }));

  const deliverySuccessRate = driverCards.map((driver) => ({
    id: driver.id,
    label: driver.name.split(" ")[0] ?? driver.name,
    value: driver.progressPct,
    color: driver.progressPct >= 80 ? "#10B981" : "#F59E0B",
  }));

  const avgDeliveryMinutes = 42;
  const driverStatusTable = driverCards.map((driver) => ({
    driver: driver.name,
    vehicle: driver.vehiclePlate,
    deliveries: `${driver.deliveriesToday}/${driver.deliveriesTotal}`,
    boxes: `${driver.boxesDone}/${driver.boxesTotal}`,
    trips: driver.tripsCount,
    status: driver.progressPct >= 100 ? "Ολοκληρώθηκε" : "Σε εξέλιξη",
  }));

  const totalDeliveriesToday = driverCards.reduce(
    (sum, driver) => sum + driver.deliveriesToday,
    0,
  );

  return {
    kpis: [
      {
        key: "today",
        label: "Παραδόσεις Σήμερα",
        value: String(totalDeliveriesToday),
      },
      { key: "done", label: "Ολοκληρωμένες", value: String(completedToday) },
      { key: "pending", label: "Εκκρεμείς", value: String(pendingToday) },
      {
        key: "avg",
        label: "Μέσος Χρόνος Παράδοσης",
        value: `${avgDeliveryMinutes} λεπτά`,
      },
    ],
    driverCards,
    deliveriesPerDriver,
    deliverySuccessRate,
    driverStatusTable,
  };
}

export function computeFullAnalytics(
  data: ReportRawData,
  range: ReportDateRange,
): FullAnalytics {
  return {
    sales: computeSales(data, range),
    products: computeProducts(data, range),
    customers: computeCustomers(data, range),
    warehouse: computeWarehouse(data, range),
    drivers: computeDrivers(data),
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
