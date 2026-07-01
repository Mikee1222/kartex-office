import { ProductMasterEditPage } from "@/components/products/product-master-edit-page";

type ProductMasterPageProps = {
  params: Promise<{ masterId: string }>;
};

export default async function ProductMasterPage({ params }: ProductMasterPageProps) {
  const { masterId } = await params;
  return <ProductMasterEditPage masterId={masterId} />;
}
