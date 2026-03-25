export type MenuItem = {
  id: string;
  name: string;
  description: string;
  category: string;
  pricePence: number;
  stockQuantity: number;
  lowStockThreshold: number;
  imageUrl: string | null;
  shopifyVariantId: string | null;
  isAvailable: boolean;
};
