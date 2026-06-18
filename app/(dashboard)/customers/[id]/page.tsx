import { notFound } from "next/navigation";

import {
  CustomerDetailView,
  type CustomerOrderRow,
} from "@/components/customers/customer-detail-view";
import { createClient } from "@/lib/supabase/server";
import type { CustomerRow } from "@/types/database";

type CustomerDetailPageProps = {
  params: Promise<{ id: string }>;
};

function toNumber(value: number | string | null | undefined): number {
  if (value === null || value === undefined) return 0;
  const n = typeof value === "number" ? value : Number.parseFloat(String(value));
  return Number.isFinite(n) ? n : 0;
}

export default async function CustomerDetailPage({ params }: CustomerDetailPageProps) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: customer, error } = await supabase
    .from("customers")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !customer) {
    notFound();
  }

  const { data: orders } = await supabase
    .from("orders")
    .select("id, order_number, status, total, delivery_date, created_at")
    .eq("customer_id", id)
    .order("created_at", { ascending: false });

  const orderRows = (orders ?? []) as CustomerOrderRow[];
  const totalPurchasesEur = orderRows.reduce(
    (sum, order) => sum + toNumber(order.total),
    0,
  );
  const lastOrderDate = orderRows[0]?.created_at ?? null;

  return (
    <CustomerDetailView
      customerId={id}
      data={{
        customer: customer as CustomerRow,
        orders: orderRows,
        stats: {
          totalOrders: orderRows.length,
          totalPurchasesEur,
          lastOrderDate,
        },
      }}
    />
  );
}
