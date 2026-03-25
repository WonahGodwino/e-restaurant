import { z } from "zod";

const imagePathOrUrlSchema = z
  .string()
  .trim()
  .refine((value) => {
    if (!value) return true;
    if (value.startsWith("/uploads/")) return true;
    return /^https?:\/\//.test(value);
  }, "Image must be a valid URL or uploaded image path.");

const listValueSchema = z
  .string()
  .trim()
  .min(1)
  .max(60)
  .transform((value) => value.toLowerCase());

const listSchema = z
  .array(listValueSchema)
  .max(30)
  .transform((values) => Array.from(new Set(values)));

export const createFoodItemSchema = z.object({
  name: z.string().trim().min(2).max(120),
  description: z.string().trim().min(5).max(400),
  category: z.string().trim().min(2).max(50),
  pricePence: z.number().int().min(50).max(100000),
  stockQuantity: z.number().int().min(0).max(100000),
  allergens: listSchema.optional().default([]),
  dietaryTags: listSchema.optional().default([]),
  crossContaminationNotes: z.string().trim().max(400).optional().or(z.literal("")),
  imageUrl: imagePathOrUrlSchema.optional().or(z.literal("")),
  shopifyVariantId: z.string().trim().optional().or(z.literal("")),
  isAvailable: z.boolean().optional().default(true),
});

export const updateFoodItemSchema = createFoodItemSchema.partial();

export const topUpStockSchema = z.object({
  quantityToAdd: z.number().int().min(1).max(100000),
});

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

export const contactFormSchema = z.object({
  name: z.string().trim().min(2).max(120),
  email: z.string().trim().email(),
  phone: z.string().trim().max(30).optional().or(z.literal("")),
  subject: z.string().trim().min(3).max(120),
  message: z.string().trim().min(10).max(2000),
});

export type CreateFoodItemInput = z.infer<typeof createFoodItemSchema>;
export type UpdateFoodItemInput = z.infer<typeof updateFoodItemSchema>;
export type TopUpStockInput = z.infer<typeof topUpStockSchema>;
export type CreateOrderInput = z.infer<typeof createOrderSchema>;
export type ContactFormInput = z.infer<typeof contactFormSchema>;
