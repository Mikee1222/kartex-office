export type ZReportMydataStatus = "pending" | "submitted" | "error";

export type CategoryBreakdownItem = {
  category: string;
  orderCount: number;
  revenue: number;
  vat: number;
  net: number;
};

export type CustomerTypeBreakdownItem = {
  type: string;
  typeLabel: string;
  orderCount: number;
  revenue: number;
  vat: number;
  net: number;
};

export type DailyZComputation = {
  reportDate: string;
  totalOrders: number;
  cancelledOrders: number;
  totalRevenue: number;
  totalVat: number;
  netAmount: number;
  categoryBreakdown: CategoryBreakdownItem[];
  customerTypeBreakdown: CustomerTypeBreakdownItem[];
};

export type ZReport = {
  id: string;
  reportDate: string;
  totalOrders: number;
  cancelledOrders: number;
  totalRevenue: number;
  totalVat: number;
  netAmount: number;
  categoryBreakdown: CategoryBreakdownItem[];
  customerTypeBreakdown: CustomerTypeBreakdownItem[];
  mydataStatus: ZReportMydataStatus;
  mydataMark: string | null;
  mydataSubmittedAt: string | null;
  mydataError: string | null;
  issuedAt: string | null;
  issuedBy: string | null;
  createdAt: string;
  updatedAt: string;
};

export type ZReportRow = {
  id: string;
  report_date: string;
  total_orders: number;
  cancelled_orders: number;
  total_revenue: number | string;
  total_vat: number | string;
  net_amount: number | string;
  category_breakdown: CategoryBreakdownItem[] | null;
  customer_type_breakdown: CustomerTypeBreakdownItem[] | null;
  mydata_status: ZReportMydataStatus;
  mydata_mark: string | null;
  mydata_submitted_at: string | null;
  mydata_error: string | null;
  issued_at: string | null;
  issued_by: string | null;
  created_at: string;
  updated_at: string;
};
