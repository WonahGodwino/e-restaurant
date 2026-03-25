export type MenuItem = {
  id: string;
  name: string;
  description: string;
  category: string;
  pricePence: number;
  imageUrl: string | null;
  shopifyVariantId: string | null;
  isAvailable: boolean;
};
