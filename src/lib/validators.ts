import { z } from "zod";

export const createFoodItemSchema = z.object({
  name: z.string().trim().min(2).max(120),
  description: z.string().trim().min(5).max(400),
  category: z.string().trim().min(2).max(50),
  pricePence: z.number().int().min(50).max(100000),
  imageUrl: z.string().trim().url().optional().or(z.literal("")),
  shopifyVariantId: z.string().trim().optional().or(z.literal("")),
  isAvailable: z.boolean().optional().default(true),
});

export const updateFoodItemSchema = createFoodItemSchema.partial();

export const createOrderSchema = z.object({
  customerName: z.string().trim().min(2).max(120),
  customerEmail: z.string().trim().email(),
  customerPhone: z.string().trim().max(30).optional().or(z.literal("")),
  deliveryAddress: z.string().trim().min(10).max(400),
  notes: z.string().trim().max(500).optional().or(z.literal("")),
  items: z
    .array(
      z.object({
        foodItemId: z.string().min(1),
        quantity: z.number().int().min(1).max(20),
      }),
    )
    .min(1),
});

export type CreateFoodItemInput = z.infer<typeof createFoodItemSchema>;
export type UpdateFoodItemInput = z.infer<typeof updateFoodItemSchema>;
export type CreateOrderInput = z.infer<typeof createOrderSchema>;
