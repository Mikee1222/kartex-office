"use client";

import { BarChart3 } from "lucide-react";
import * as React from "react";

import { DataError } from "@/components/dashboard/data-error";
import {
  CustomersReportTab,
  DriversReportTab,
  ProductsReportTab,
  ProfitabilityReportTab,
  SalesReportTab,
  WarehouseReportTab,
} from "@/components/reports/report-tab-panels";
import {
  ReportTabBar,
  ReportToolbar,
  type ReportTabId,
} from "@/components/reports/report-toolbar";
import { PageHeader } from "@/components/ui/page-header";
import {
  computeFullAnalytics,
  exportTableToCsv,
  type FullAnalytics,
  type ReportRawData,
} from "@/lib/reports/compute-analytics";
import type { ReportOrderRow } from "@/lib/reports/compute-reports";
import {
  resolveReportDateRange,
  type ReportDatePreset,
} from "@/lib/reports/date-range";
import { getAthensDateString } from "@/lib/datetime";
import { createClient } from "@/lib/supabase/client";
import type { CustomerRow, ProductRow } from "@/types/database";

const EMPTY_ANALYTICS: FullAnalytics = {
  sales: {
    kpis: [],
    revenueByMonth: [],
    ordersByStatus: [],
    revenueByCustomerType: [],
    topOrders: [],
  },
  products: {
    kpis: [],
    stockLevels: [],
    stockByCategory: [],
    colorDistribution: [],
    lowStockProducts: [],
    topProductsByVolume: [],
  },
  customers: {
    kpis: [],
    customersByType: [],
    revenueByCity: [],
    customerGrowth: [],
    topCustomers: [],
  },
  warehouse: {
    kpis: [],
    orderFunnel: [],
    pickingTimeByDay: [],
    stockMovements: [],
    recentMovements: [],
  },
  drivers: {
    kpis: [],
    driverCards: [],
    deliveriesPerDriver: [],
    deliverySuccessRate: [],
    driverStatusTable: [],
  },
  profitability: {
    kpis: [],
    marginByProduct: [],
    monthlyGrossProfit: [],
    marginDistribution: [],
    topProfitableProducts: [],
    priceReviewProducts: [],
    customerProfitability: [],
  },
};

const REFRESH_MS = 5 * 60 * 1000;

function getExportConfig(tab: ReportTabId, analytics: FullAnalytics) {
  switch (tab) {
    case "sales":
      return {
        filename: "pwliseis.csv",
        columns: [
          { key: "orderNumber", label: "Παραγγελία" },
          { key: "customer", label: "Πελάτης" },
          { key: "status", label: "Κατάσταση" },
          { key: "total", label: "Σύνολο" },
          { key: "date", label: "Ημερομηνία" },
        ],
        rows: analytics.sales.topOrders,
      };
    case "products":
      return {
        filename: "proionta.csv",
        columns: [
          { key: "product", label: "Προϊόν" },
          { key: "sku", label: "SKU" },
          { key: "stock", label: "Απόθεμα" },
          { key: "minStock", label: "Ελάχιστο" },
          { key: "status", label: "Κατάσταση" },
        ],
        rows: analytics.products.lowStockProducts,
      };
    case "customers":
      return {
        filename: "pelates.csv",
        columns: [
          { key: "customer", label: "Πελάτης" },
          { key: "type", label: "Τύπος" },
          { key: "orders", label: "Παραγγελίες" },
          { key: "total", label: "Σύνολο" },
          { key: "lastOrder", label: "Τελευταία Παραγγελία" },
        ],
        rows: analytics.customers.topCustomers,
      };
    case "warehouse":
      return {
        filename: "apothiki.csv",
        columns: [
          { key: "product", label: "Προϊόν" },
          { key: "type", label: "Τύπος" },
          { key: "quantity", label: "Ποσότητα" },
          { key: "reason", label: "Λόγος" },
          { key: "date", label: "Ημερομηνία" },
        ],
        rows: analytics.warehouse.recentMovements,
      };
    case "drivers":
      return {
        filename: "odigoi.csv",
        columns: [
          { key: "driver", label: "Οδηγός" },
          { key: "vehicle", label: "Όχημα" },
          { key: "deliveries", label: "Παραδόσεις" },
          { key: "boxes", label: "Κιβώτια" },
          { key: "trips", label: "Δρομολόγια" },
          { key: "status", label: "Κατάσταση" },
        ],
        rows: analytics.drivers.driverStatusTable,
      };
    case "profitability":
      return {
        filename: "kerdophoria.csv",
        columns: [
          { key: "product", label: "Προϊόν" },
          { key: "purchase", label: "Τιμή Αγοράς" },
          { key: "sale", label: "Τιμή Πώλησης" },
          { key: "marginEuro", label: "Περιθώριο" },
          { key: "marginPct", label: "Margin %" },
          { key: "salesQty", label: "Πωλήσεις" },
          { key: "monthProfit", label: "Κέρδος Μήνα" },
        ],
        rows: analytics.profitability.topProfitableProducts,
      };
  }
}

export function ReportsView() {
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [fetchKey, setFetchKey] = React.useState(0);
  const [rawData, setRawData] = React.useState<ReportRawData | null>(null);
  const [activeTab, setActiveTab] = React.useState<ReportTabId>("sales");
  const [preset, setPreset] = React.useState<ReportDatePreset>("month");
  const [customStart, setCustomStart] = React.useState(getAthensDateString());
  const [customEnd, setCustomEnd] = React.useState(getAthensDateString());
  const printRef = React.useRef<HTMLDivElement>(null);

  const loadData = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    const supabase = createClient();

    const [
      ordersResult,
      productsResult,
      itemsResult,
      customersResult,
      movementsResult,
      tripsResult,
      driversResponse,
    ] = await Promise.all([
      supabase
        .from("orders")
        .select(
          "id, order_number, customer_id, status, total, created_at, assigned_driver_id, trip_id, customers(id, name, type, city)",
        )
        .order("created_at", { ascending: false }),
      supabase.from("products").select("*"),
      supabase
        .from("order_items")
        .select(
          "order_id, product_id, quantity, unit_price, color_id, products(id, name, sku, purchase_price), product_colors(id, name, hex_code)",
        ),
      supabase.from("customers").select("*"),
      supabase
        .from("inventory_movements")
        .select("id, type, quantity, reason, created_at, products(name)")
        .order("created_at", { ascending: false })
        .limit(200),
      supabase
        .from("delivery_trips")
        .select(
          "id, driver_id, driver_name, trip_date, status, total_boxes, departed_at, returned_at, vehicles(plate, max_boxes)",
        )
        .order("trip_date", { ascending: false })
        .limit(400),
      fetch("/api/drivers"),
    ]);

    if (ordersResult.error || productsResult.error || itemsResult.error) {
      setError(
        ordersResult.error?.message ||
          productsResult.error?.message ||
          itemsResult.error?.message ||
          "Αποτυχία φόρτωσης αναφορών.",
      );
      setLoading(false);
      return;
    }

    let drivers: ReportRawData["drivers"] = [];
    if (driversResponse.ok) {
      const driversJson = (await driversResponse.json()) as {
        drivers?: { id: string; name: string; vehiclePlate?: string | null }[];
      };
      drivers = (driversJson.drivers ?? []).map((driver) => ({
        id: driver.id,
        name: driver.name,
        vehiclePlate: driver.vehiclePlate ?? null,
      }));
    }

    setRawData({
      orders: (ordersResult.data ?? []) as ReportOrderRow[],
      orderItems: (itemsResult.data ?? []) as unknown as ReportRawData["orderItems"],
      products: (productsResult.data ?? []) as ProductRow[],
      customers: (customersResult.data ?? []) as CustomerRow[],
      inventoryMovements: movementsResult.data ?? [],
      deliveryTrips: tripsResult.data ?? [],
      drivers,
    });
    setLoading(false);
  }, []);

  React.useEffect(() => {
    void loadData();
  }, [loadData, fetchKey]);

  React.useEffect(() => {
    const timer = window.setInterval(() => {
      setFetchKey((key) => key + 1);
    }, REFRESH_MS);
    return () => window.clearInterval(timer);
  }, []);

  const range = React.useMemo(
    () => resolveReportDateRange(preset, customStart, customEnd),
    [preset, customStart, customEnd],
  );

  const analytics = React.useMemo(() => {
    if (!rawData) return EMPTY_ANALYTICS;
    return computeFullAnalytics(rawData, range);
  }, [rawData, range]);

  function handleExport() {
    const config = getExportConfig(activeTab, analytics);
    exportTableToCsv(config.filename, config.columns, config.rows);
  }

  function handlePrint() {
    window.print();
  }

  return (
    <div ref={printRef} className="mx-auto max-w-7xl space-y-6 print:space-y-4">
      <PageHeader
        title="Αναφορές"
        subtitle="Αναλυτικά στοιχεία πωλήσεων, αποθέματος, πελατών και δρομολογίων."
      />
      <p className="-mt-2 flex items-center gap-2 text-sm text-kartex-muted print:hidden">
        <BarChart3 className="size-4 text-kartex-gold" aria-hidden />
        Αυτόματη ανανέωση κάθε 5 λεπτά
      </p>

      <ReportToolbar
        preset={preset}
        customStart={customStart}
        customEnd={customEnd}
        onPresetChange={setPreset}
        onCustomStartChange={setCustomStart}
        onCustomEndChange={setCustomEnd}
        onExport={handleExport}
        onPrint={handlePrint}
        onRefresh={() => setFetchKey((key) => key + 1)}
        refreshing={loading}
      />

      <ReportTabBar activeTab={activeTab} onChange={setActiveTab} />

      {error ? (
        <DataError message={error} onRetry={() => setFetchKey((key) => key + 1)} />
      ) : null}

      {!error ? (
        <>
          {activeTab === "sales" ? (
            <SalesReportTab analytics={analytics} loading={loading} />
          ) : null}
          {activeTab === "products" ? (
            <ProductsReportTab analytics={analytics} loading={loading} />
          ) : null}
          {activeTab === "customers" ? (
            <CustomersReportTab analytics={analytics} loading={loading} />
          ) : null}
          {activeTab === "warehouse" ? (
            <WarehouseReportTab analytics={analytics} loading={loading} />
          ) : null}
          {activeTab === "drivers" ? (
            <DriversReportTab analytics={analytics} loading={loading} />
          ) : null}
          {activeTab === "profitability" ? (
            <ProfitabilityReportTab analytics={analytics} loading={loading} />
          ) : null}
        </>
      ) : null}
    </div>
  );
}
