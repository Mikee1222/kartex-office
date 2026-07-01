export type ProductColor = {
  id: string;
  name: string;
  hexCode: string;
  isActive: boolean;
};

export type ProductColorVariant = {
  id: string;
  productId: string;
  colorId: string;
  stock: number;
  isActive: boolean;
  isPrimary: boolean;
  color?: ProductColor;
};

export type ProductColorSelection = {
  colorId: string;
  stock: number;
  isPrimary?: boolean;
};

export type ProductDimensions = {
  widthCm: number | null;
  heightCm: number | null;
  weightKg: number | null;
  unit: string;
};

export type ProductDetailData = {
  id: string;
  name: string;
  sku: string;
  barcode: string;
  category: string;
  purchasePrice: number;
  salePrice: number;
  stock: number;
  minStock: number;
  supplier: string;
  description: string;
  notes: string;
  isActive: boolean;
  dimensions: ProductDimensions;
  variants: ProductColorVariant[];
};
