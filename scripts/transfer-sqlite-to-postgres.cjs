/* eslint-disable no-console */
require("dotenv/config");

const path = require("path");
const { PrismaClient: SqlitePrismaClient } = require("@prisma/client");
const { PrismaClient: PostgresPrismaClient } = require("../generated/postgres-client");

const SQLITE_URL = `file:${path.resolve(__dirname, "..", "prisma", "dev.db").replace(/\\/g, "/")}`;
const POSTGRES_URL = process.env.POSTGRES_RESTORE_URL || "postgresql://postgres:lamis@localhost:5432/restaurant?schema=public";

function toDate(value) {
  return value ? new Date(value) : null;
}

async function main() {
  const sqlite = new SqlitePrismaClient({ datasources: { db: { url: SQLITE_URL } } });
  const postgres = new PostgresPrismaClient({ datasources: { db: { url: POSTGRES_URL } } });

  console.log("Reading SQLite data...");
  const [foodItems, orders, orderItems, users, notificationPreferences, notifications] = await Promise.all([
    sqlite.foodItem.findMany({ orderBy: { createdAt: "asc" } }),
    sqlite.order.findMany({ orderBy: { createdAt: "asc" } }),
    sqlite.orderItem.findMany({ orderBy: { createdAt: "asc" } }),
    sqlite.user.findMany({ orderBy: { createdAt: "asc" } }),
    sqlite.notificationPreference.findMany({ orderBy: { createdAt: "asc" } }),
    sqlite.notification.findMany({ orderBy: { createdAt: "asc" } }),
  ]);

  console.log("Resetting Postgres target tables...");
  await postgres.$transaction([
    postgres.notification.deleteMany(),
    postgres.notificationPreference.deleteMany(),
    postgres.orderItem.deleteMany(),
    postgres.order.deleteMany(),
    postgres.user.deleteMany(),
    postgres.foodItem.deleteMany(),
  ]);

  console.log("Writing data to Postgres...");

  if (foodItems.length > 0) {
    await postgres.foodItem.createMany({
      data: foodItems.map((item) => ({
        id: item.id,
        name: item.name,
        description: item.description,
        category: item.category,
        pricePence: item.pricePence,
        stockQuantity: item.stockQuantity,
        lowStockThreshold: item.lowStockThreshold,
        allergens: item.allergens,
        dietaryTags: item.dietaryTags,
        crossContaminationNotes: item.crossContaminationNotes,
        imageUrl: item.imageUrl,
        shopifyVariantId: item.shopifyVariantId,
        isAvailable: item.isAvailable,
        createdAt: toDate(item.createdAt),
        updatedAt: toDate(item.updatedAt),
      })),
      skipDuplicates: true,
    });
  }

  if (orders.length > 0) {
    await postgres.order.createMany({
      data: orders.map((item) => ({
        id: item.id,
        customerName: item.customerName,
        customerEmail: item.customerEmail,
        customerPhone: item.customerPhone,
        deliveryAddress: item.deliveryAddress,
        notes: item.notes,
        totalPence: item.totalPence,
        currency: item.currency,
        status: item.status,
        shopifyCartId: item.shopifyCartId,
        shopifyCheckoutUrl: item.shopifyCheckoutUrl,
        createdAt: toDate(item.createdAt),
        updatedAt: toDate(item.updatedAt),
      })),
      skipDuplicates: true,
    });
  }

  if (users.length > 0) {
    await postgres.user.createMany({
      data: users.map((item) => ({
        id: item.id,
        email: item.email,
        name: item.name,
        role: item.role,
        isActive: item.isActive,
        createdAt: toDate(item.createdAt),
        updatedAt: toDate(item.updatedAt),
      })),
      skipDuplicates: true,
    });
  }

  if (orderItems.length > 0) {
    await postgres.orderItem.createMany({
      data: orderItems.map((item) => ({
        id: item.id,
        orderId: item.orderId,
        foodItemId: item.foodItemId,
        itemName: item.itemName,
        unitPricePence: item.unitPricePence,
        quantity: item.quantity,
        lineTotalPence: item.lineTotalPence,
        createdAt: toDate(item.createdAt),
      })),
      skipDuplicates: true,
    });
  }

  if (notificationPreferences.length > 0) {
    await postgres.notificationPreference.createMany({
      data: notificationPreferences.map((item) => ({
        id: item.id,
        userId: item.userId,
        notificationType: item.notificationType,
        emailEnabled: item.emailEnabled,
        dashboardEnabled: item.dashboardEnabled,
        isEnabled: item.isEnabled,
        createdAt: toDate(item.createdAt),
        updatedAt: toDate(item.updatedAt),
      })),
      skipDuplicates: true,
    });
  }

  if (notifications.length > 0) {
    await postgres.notification.createMany({
      data: notifications.map((item) => ({
        id: item.id,
        userId: item.userId,
        type: item.type,
        title: item.title,
        message: item.message,
        foodItemId: item.foodItemId,
        orderId: item.orderId,
        isRead: item.isRead,
        emailSent: item.emailSent,
        emailSentAt: toDate(item.emailSentAt),
        createdAt: toDate(item.createdAt),
        readAt: toDate(item.readAt),
      })),
      skipDuplicates: true,
    });
  }

  const [foodCount, orderCount, orderItemCount, userCount, prefCount, notificationCount] = await Promise.all([
    postgres.foodItem.count(),
    postgres.order.count(),
    postgres.orderItem.count(),
    postgres.user.count(),
    postgres.notificationPreference.count(),
    postgres.notification.count(),
  ]);

  console.log("Postgres import complete.");
  console.log({
    foodItems: foodCount,
    orders: orderCount,
    orderItems: orderItemCount,
    users: userCount,
    notificationPreferences: prefCount,
    notifications: notificationCount,
  });

  await sqlite.$disconnect();
  await postgres.$disconnect();
}

main().catch(async (error) => {
  console.error("Transfer failed:", error);
  process.exitCode = 1;
});
