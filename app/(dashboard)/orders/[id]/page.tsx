import { notFound } from "next/navigation";

import { OrderDetailView } from "@/components/orders/order-detail-view";
import {
  mapSupabaseOrderToDetail,
  ORDER_DETAIL_SELECT,
} from "@/components/orders/map-order-detail";
import { createClient } from "@/lib/supabase/server";

type OrderDetailPageProps = {
  params: Promise<{ id: string }>;
};

export default async function OrderDetailPage({ params }: OrderDetailPageProps) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: order, error } = await supabase
    .from("orders")
    .select(ORDER_DETAIL_SELECT)
    .eq("id", id)
    .single();

  if (error || !order) {
    notFound();
  }

  const detail = mapSupabaseOrderToDetail(order);

  return <OrderDetailView orderId={id} initialOrder={detail} />;
}
