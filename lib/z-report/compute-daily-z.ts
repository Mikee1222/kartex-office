import type { SupabaseClient } from "@supabase/supabase-js";

import { OrderStatus } from "@/components/orders/types";
import { getAthensDateString, isIsoOnAthensDay } from "@/lib/datetime";
import { mapDbCustomerType } from "@/types/database";

import type {
  CategoryBreakdownItem,
  CustomerTypeBreakdownItem,
  DailyZComputation,
} from "./types";

const VAT_RATE = 0.24;

function toNumber(value: number | string | null | undefined): number {
  if (value === null || value === undefined) return 0;
  const n = typeof value === "number" ? value : Number.parseFloat(String(value));
  return Number.isFinite(n) ? n : 0;
}

function splitVatFromGross(gross: number): { net: number; vat: number } {
  if (gross <= 0) return { net: 0, vat: 0 };
  const vat = (gross * VAT_RATE) / (1 + VAT_RATE);
  const net = gross - vat;
  return { net, vat };
}

function normalizeJoin<T>(value: T | T[] | null | undefined): T | null {
  if (!value) return null;
  return Array.isArray(value) ? (value[0] ?? null) : value;
}

type OrderForZ = {
  id: string;
  status: string;
  total: number | string;
  created_at: string;
  customer_id: string;
  customers?:
    | { type: string; name?: string }
    | { type: string; name?: string }[]
    | null;
};

type OrderItemForZ = {
  order_id: string;
  quantity: number;
  unit_price: number | string;
  products?:
    | { category: string | null; name?: string }
    | { category: string | null; name?: string }[]
    | null;
};

export async function computeDailyZReport(
  supabase: SupabaseClient,
  reportDate = getAthensDateString(),
): Promise<DailyZComputation> {
  const { data: orders, error: ordersError } = await supabase
    .from("orders")
    .select("id, status, total, created_at, customer_id, customers(type, name)");

  if (ordersError) {
    throw new Error(ordersError.message);
  }

  const dayOrders = (orders ?? []).filter((row) =>
    isIsoOnAthensDay((row as OrderForZ).created_at, reportDate),
  ) as OrderForZ[];

  const activeOrders = dayOrders.filter(
    (o) => o.status !== OrderStatus.Cancelled,
  );
  const cancelledOrders = dayOrders.filter(
    (o) => o.status === OrderStatus.Cancelled,
  );

  let totalRevenue = 0;
  let totalVat = 0;
  let netAmount = 0;

  const customerTypeMap = new Map<
    string,
    { typeLabel: string; orderCount: number; revenue: number; vat: number; net: number }
  >();

  for (const order of activeOrders) {
    const gross = toNumber(order.total);
    const { net, vat } = splitVatFromGross(gross);
    totalRevenue += gross;
    totalVat += vat;
    netAmount += net;

    const customer = normalizeJoin(order.customers);
    const dbType = customer?.type ?? "walk-in";
    const typeLabel = mapDbCustomerType(dbType);
    const existing = customerTypeMap.get(dbType) ?? {
      typeLabel,
      orderCount: 0,
      revenue: 0,
      vat: 0,
      net: 0,
    };
    existing.orderCount += 1;
    existing.revenue += gross;
    existing.vat += vat;
    existing.net += net;
    customerTypeMap.set(dbType, existing);
  }

  const orderIds = activeOrders.map((o) => o.id);
  const categoryMap = new Map<
    string,
    { orderCount: number; revenue: number; vat: number; net: number }
  >();

  if (orderIds.length > 0) {
    const { data: items, error: itemsError } = await supabase
      .from("order_items")
      .select("order_id, quantity, unit_price, products(category, name)")
      .in("order_id", orderIds);

    if (itemsError) {
      throw new Error(itemsError.message);
    }

    for (const item of (items ?? []) as OrderItemForZ[]) {
      const product = normalizeJoin(item.products);
      const category = product?.category?.trim() || "Άλλα";
      const lineGross = toNumber(item.quantity) * toNumber(item.unit_price);
      const { net, vat } = splitVatFromGross(lineGross);
      const existing = categoryMap.get(category) ?? {
        orderCount: 0,
        revenue: 0,
        vat: 0,
        net: 0,
      };
      existing.orderCount += 1;
      existing.revenue += lineGross;
      existing.vat += vat;
      existing.net += net;
      categoryMap.set(category, existing);
    }
  }

  const categoryBreakdown: CategoryBreakdownItem[] = [...categoryMap.entries()]
    .map(([category, stats]) => ({
      category,
      orderCount: stats.orderCount,
      revenue: round2(stats.revenue),
      vat: round2(stats.vat),
      net: round2(stats.net),
    }))
    .sort((a, b) => b.revenue - a.revenue);

  const customerTypeBreakdown: CustomerTypeBreakdownItem[] = [
    ...customerTypeMap.entries(),
  ]
    .map(([type, stats]) => ({
      type,
      typeLabel: stats.typeLabel,
      orderCount: stats.orderCount,
      revenue: round2(stats.revenue),
      vat: round2(stats.vat),
      net: round2(stats.net),
    }))
    .sort((a, b) => b.revenue - a.revenue);

  return {
    reportDate,
    totalOrders: activeOrders.length,
    cancelledOrders: cancelledOrders.length,
    totalRevenue: round2(totalRevenue),
    totalVat: round2(totalVat),
    netAmount: round2(netAmount),
    categoryBreakdown,
    customerTypeBreakdown,
  };
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}
