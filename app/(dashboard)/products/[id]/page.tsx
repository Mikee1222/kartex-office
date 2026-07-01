import { ProductDetailView } from "@/components/products/product-detail-view";

type ProductDetailPageProps = {
  params: Promise<{ id: string }>;
};

export default async function ProductDetailPage({
  params,
}: ProductDetailPageProps) {
  const { id } = await params;
  return <ProductDetailView productId={id} />;
}
