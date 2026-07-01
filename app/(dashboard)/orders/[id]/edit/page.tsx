import { notFound } from "next/navigation";

import { OrderEditForm } from "@/components/orders/order-edit-form";
import {
  mapSupabaseOrderToEditForm,
  ORDER_DETAIL_SELECT,
} from "@/components/orders/map-order-detail";
import { createClient } from "@/lib/supabase/server";

type OrderEditPageProps = {
  params: Promise<{ id: string }>;
};

export default async function OrderEditPage({ params }: OrderEditPageProps) {
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

  const initial = mapSupabaseOrderToEditForm(order);

  return <OrderEditForm orderId={id} initial={initial} />;
}
