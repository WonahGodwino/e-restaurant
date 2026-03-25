export type MenuItem = {
  id: string;
  name: string;
  description: string;
  category: string;
  pricePence: number;
  stockQuantity: number;
  lowStockThreshold: number;
  allergens: string[];
  dietaryTags: string[];
  crossContaminationNotes: string | null;
  imageUrl: string | null;
  shopifyVariantId: string | null;
  isAvailable: boolean;
  isAgeRestricted: boolean;
};
