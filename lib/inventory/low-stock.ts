export type LowStockProduct = {
  id: string;
  name: string;
  stock: number;
  min_stock: number;
};

export function isLowStock(product: Pick<LowStockProduct, "stock" | "min_stock">) {
  return product.stock < product.min_stock;
}

export function filterLowStockProducts<T extends LowStockProduct>(products: T[]): T[] {
  return products.filter(isLowStock);
}
