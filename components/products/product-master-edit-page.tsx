"use client";

import { ProductMasterDetailPage } from "@/components/products/product-master-detail-page";

type ProductMasterEditPageProps = {
  masterId: string;
};

export function ProductMasterEditPage({ masterId }: ProductMasterEditPageProps) {
  return <ProductMasterDetailPage context="inventory" masterId={masterId} />;
}
