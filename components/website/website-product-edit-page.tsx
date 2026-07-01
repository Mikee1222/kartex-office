"use client";

import { ProductMasterDetailPage } from "@/components/products/product-master-detail-page";

type WebsiteProductEditPageProps = {
  masterId: string;
};

export function WebsiteProductEditPage({ masterId }: WebsiteProductEditPageProps) {
  return <ProductMasterDetailPage context="website" masterId={masterId} />;
}
