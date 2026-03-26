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
  fulfillmentType: z.enum(["DELIVERY", "PICKUP"]).optional().default("DELIVERY"),
  deliveryPostcode: z.string().trim().max(16).optional().or(z.literal("")),
  deliveryAddress: z.string().trim().max(400).optional().or(z.literal("")),
  notes: z.string().trim().max(500).optional().or(z.literal("")),
  items: z
    .array(
      z.object({
        foodItemId: z.string().min(1),
        quantity: z.number().int().min(1).max(20),
        selectedModifiers: z
          .array(
            z.object({
              modifierId: z.string().min(1),
              modifierName: z.string().min(1).max(120),
              groupName: z.string().min(1).max(120),
              priceDeltaPence: z.number().int(),
            }),
          )
          .optional()
          .default([]),
      }),
    )
    .min(1),
}).superRefine((input, ctx) => {
  if (input.fulfillmentType === "DELIVERY") {
    if (!input.deliveryPostcode || input.deliveryPostcode.trim().length < 2) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["deliveryPostcode"],
        message: "Delivery postcode is required for delivery orders.",
      });
    }

    if (!input.deliveryAddress || input.deliveryAddress.trim().length < 10) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["deliveryAddress"],
        message: "Delivery address must be at least 10 characters for delivery orders.",
      });
    }
  }
});

export const contactFormSchema = z.object({
  name: z.string().trim().min(2).max(120),
  email: z.string().trim().email(),
  phone: z.string().trim().max(30).optional().or(z.literal("")),
  subject: z.string().trim().min(3).max(120),
  message: z.string().trim().min(10).max(2000),
});

export const createReservationSchema = z.object({
  customerName: z.string().trim().min(2).max(120),
  customerEmail: z.string().trim().email(),
  customerPhone: z.string().trim().max(30).optional().or(z.literal("")),
  partySize: z.number().int().min(1).max(500),
  date: z.string().trim().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format"),
  time: z.string().trim().regex(/^\d{2}:\d{2}$/, "Time must be in HH:MM format"),
  specialRequests: z.string().trim().max(1000).optional().or(z.literal("")),
});

export const updateReservationStatusSchema = z
  .object({
    status: z.enum(["PENDING", "CONFIRMED", "CANCELLED"]),
    decisionReason: z.string().trim().max(500).optional().or(z.literal("")),
  })
  .superRefine((input, ctx) => {
    if (input.status === "CANCELLED" && (!input.decisionReason || input.decisionReason.trim().length < 5)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["decisionReason"],
        message: "Please provide a brief rejection reason (at least 5 characters).",
      });
    }
  });

export const createCateringRequestSchema = z.object({
  customerName: z.string().trim().min(2).max(120),
  customerEmail: z.string().trim().email(),
  customerPhone: z.string().trim().max(30).optional().or(z.literal("")),
  eventType: z.string().trim().min(2).max(120),
  eventDate: z.string().trim().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format"),
  guestCount: z.number().int().min(1).max(10000),
  budget: z.string().trim().max(120).optional().or(z.literal("")),
  notes: z.string().trim().max(2000).optional().or(z.literal("")),
});

export const updateCateringStatusSchema = z.object({
  status: z.enum(["PENDING", "IN_REVIEW", "CONFIRMED", "CANCELLED"]),
});

export type CreateFoodItemInput = z.infer<typeof createFoodItemSchema>;
export type UpdateFoodItemInput = z.infer<typeof updateFoodItemSchema>;
export type TopUpStockInput = z.infer<typeof topUpStockSchema>;
export type CreateOrderInput = z.infer<typeof createOrderSchema>;
export type ContactFormInput = z.infer<typeof contactFormSchema>;
export type CreateReservationInput = z.infer<typeof createReservationSchema>;
export type CreateCateringRequestInput = z.infer<typeof createCateringRequestSchema>;
