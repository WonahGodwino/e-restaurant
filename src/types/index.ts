export type Modifier = {
  id: string;
  name: string;
  linkedFoodItemId?: string | null;
  priceDeltaPence: number;
  isDefault: boolean;
  displayOrder: number;
};

export type ModifierGroup = {
  id: string;
  name: string;
  isRequired: boolean;
  allowMultiple: boolean;
  displayOrder: number;
  modifiers: Modifier[];
};

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
  modifierGroups: ModifierGroup[];
};
