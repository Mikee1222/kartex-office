"use client";

import type { FullAnalytics } from "@/lib/reports/compute-analytics";
import {
  DonutChart,
  DriverCardsGrid,
  DualAreaChart,
  FunnelChart,
  HorizontalBarChart,
  LineTrendChart,
  MarginPercentBarChart,
  MonthlyGrossProfitChart,
  ProfitabilityTables,
  ReportKpiRow,
  ReportTable,
  RevenueAreaChart,
  VerticalBarChart,
} from "@/components/reports/report-ui";

type TabPanelProps = {
  analytics: FullAnalytics;
  loading: boolean;
};

export function SalesReportTab({ analytics, loading }: TabPanelProps) {
  const { sales } = analytics;
  return (
    <div className="space-y-6">
      <ReportKpiRow kpis={sales.kpis} loading={loading} />
      <div className="grid gap-4 lg:grid-cols-3">
        <RevenueAreaChart data={sales.revenueByMonth} loading={loading} />
        <DonutChart
          title="Παραγγελίες ανά Κατάσταση"
          data={sales.ordersByStatus}
          loading={loading}
        />
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <VerticalBarChart
          title="Έσοδα ανά Τύπο Πελάτη"
          data={sales.revenueByCustomerType}
          loading={loading}
          valuePrefix="€"
        />
        <ReportTable
          title="Top 10 Παραγγελίες (αξία)"
          loading={loading}
          columns={[
            { key: "orderNumber", label: "Παραγγελία" },
            { key: "customer", label: "Πελάτης" },
            { key: "status", label: "Κατάσταση" },
            { key: "total", label: "Σύνολο (€)", align: "right" },
            { key: "date", label: "Ημερομηνία" },
          ]}
          rows={sales.topOrders}
        />
      </div>
    </div>
  );
}

export function ProductsReportTab({ analytics, loading }: TabPanelProps) {
  const { products } = analytics;
  return (
    <div className="space-y-6">
      <ReportKpiRow kpis={products.kpis} loading={loading} />
      <div className="grid gap-4 lg:grid-cols-3">
        <HorizontalBarChart
          title="Επίπεδα Αποθέματος (Top 20)"
          data={products.stockLevels}
          loading={loading}
        />
        <DonutChart
          title="Απόθεμα ανά Κατηγορία"
          data={products.stockByCategory}
          loading={loading}
        />
      </div>
      <VerticalBarChart
        title="Διανομή Χρωμάτων (πωλήσεις)"
        data={products.colorDistribution}
        loading={loading}
      />
      <div className="grid gap-4 xl:grid-cols-2">
        <ReportTable
          title="Προϊόντα με χαμηλό απόθεμα"
          loading={loading}
          columns={[
            { key: "product", label: "Προϊόν" },
            { key: "sku", label: "SKU" },
            { key: "stock", label: "Απόθεμα", align: "right" },
            { key: "minStock", label: "Ελάχιστο", align: "right" },
            { key: "status", label: "Κατάσταση" },
          ]}
          rows={products.lowStockProducts}
        />
        <ReportTable
          title="Top 10 Προϊόντα (όγκος πωλήσεων)"
          loading={loading}
          columns={[
            { key: "rank", label: "#", align: "right" },
            { key: "product", label: "Προϊόν" },
            { key: "quantity", label: "Ποσότητα", align: "right" },
          ]}
          rows={products.topProductsByVolume}
        />
      </div>
    </div>
  );
}

export function CustomersReportTab({ analytics, loading }: TabPanelProps) {
  const { customers } = analytics;
  return (
    <div className="space-y-6">
      <ReportKpiRow kpis={customers.kpis} loading={loading} />
      <div className="grid gap-4 lg:grid-cols-3">
        <DonutChart
          title="Πελάτες ανά Τύπο"
          data={customers.customersByType}
          loading={loading}
        />
        <VerticalBarChart
          title="Έσοδα ανά Πόλη (Top 10)"
          data={customers.revenueByCity}
          loading={loading}
          valuePrefix="€"
        />
        <LineTrendChart
          title="Αύξηση Πελατών (νέοι/μήνα)"
          data={customers.customerGrowth}
          loading={loading}
        />
      </div>
      <ReportTable
        title="Top 10 Πελάτες (έσοδα)"
        loading={loading}
        columns={[
          { key: "customer", label: "Πελάτης" },
          { key: "type", label: "Τύπος" },
          { key: "orders", label: "Παραγγελίες", align: "right" },
          { key: "total", label: "Σύνολο (€)", align: "right" },
          { key: "lastOrder", label: "Τελευταία Παραγγελία" },
        ]}
        rows={customers.topCustomers}
      />
    </div>
  );
}

export function WarehouseReportTab({ analytics, loading }: TabPanelProps) {
  const { warehouse } = analytics;
  return (
    <div className="space-y-6">
      <ReportKpiRow kpis={warehouse.kpis} loading={loading} />
      <div className="grid gap-4 lg:grid-cols-3">
        <FunnelChart
          title="Ροή Παραγγελιών"
          data={warehouse.orderFunnel}
          loading={loading}
        />
        <VerticalBarChart
          title="Χρόνος Picking ανά Ημέρα (λεπτά)"
          data={warehouse.pickingTimeByDay}
          loading={loading}
        />
        <DualAreaChart
          title="Κινήσεις Αποθέματος"
          data={warehouse.stockMovements}
          loading={loading}
        />
      </div>
      <ReportTable
        title="Πρόσφατες κινήσεις αποθέματος"
        loading={loading}
        columns={[
          { key: "product", label: "Προϊόν" },
          { key: "type", label: "Τύπος" },
          { key: "quantity", label: "Ποσότητα", align: "right" },
          { key: "reason", label: "Λόγος" },
          { key: "date", label: "Ημερομηνία" },
        ]}
        rows={warehouse.recentMovements}
      />
    </div>
  );
}

export function DriversReportTab({ analytics, loading }: TabPanelProps) {
  const { drivers } = analytics;
  return (
    <div className="space-y-6">
      <ReportKpiRow kpis={drivers.kpis} loading={loading} />
      <DriverCardsGrid drivers={drivers.driverCards} loading={loading} />
      <div className="grid gap-4 lg:grid-cols-2">
        <VerticalBarChart
          title="Παραδόσεις ανά Οδηγό"
          data={drivers.deliveriesPerDriver}
          loading={loading}
        />
        <VerticalBarChart
          title="Ποσοστό Επιτυχίας (%)"
          data={drivers.deliverySuccessRate}
          loading={loading}
          valuePrefix=""
        />
      </div>
      <ReportTable
        title="Κατάσταση παραδόσεων σήμερα"
        loading={loading}
        columns={[
          { key: "driver", label: "Οδηγός" },
          { key: "vehicle", label: "Όχημα" },
          { key: "deliveries", label: "Παραδόσεις" },
          { key: "boxes", label: "Κιβώτια" },
          { key: "trips", label: "Δρομολόγια", align: "right" },
          { key: "status", label: "Κατάσταση" },
        ]}
        rows={drivers.driverStatusTable}
      />
    </div>
  );
}

export function ProfitabilityReportTab({ analytics, loading }: TabPanelProps) {
  const { profitability } = analytics;
  return (
    <div className="space-y-6">
      <ReportKpiRow kpis={profitability.kpis} loading={loading} />
      <div className="grid gap-4 lg:grid-cols-3">
        <MarginPercentBarChart
          title="Profit Margin ανά Προϊόν (Top 15)"
          data={profitability.marginByProduct}
          loading={loading}
        />
        <DonutChart
          title="Κατανομή Margin"
          data={profitability.marginDistribution}
          loading={loading}
        />
      </div>
      <MonthlyGrossProfitChart
        data={profitability.monthlyGrossProfit}
        loading={loading}
      />
      <ProfitabilityTables
        topProfitableProducts={profitability.topProfitableProducts}
        priceReviewProducts={profitability.priceReviewProducts}
        customerProfitability={profitability.customerProfitability}
        loading={loading}
      />
    </div>
  );
}
