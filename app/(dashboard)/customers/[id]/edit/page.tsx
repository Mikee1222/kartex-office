import { notFound } from "next/navigation";

import { CustomerEditForm } from "@/components/customers/customer-edit-form";
import { createClient } from "@/lib/supabase/server";
import { mapCustomerRowToEditInitial, type CustomerRow } from "@/types/database";

type CustomerEditPageProps = {
  params: Promise<{ id: string }>;
};

export default async function CustomerEditPage({ params }: CustomerEditPageProps) {
  const { id } = await params;
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("customers")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !data) {
    notFound();
  }

  const initial = mapCustomerRowToEditInitial(data as CustomerRow);

  return <CustomerEditForm customerId={id} initial={initial} />;
}
