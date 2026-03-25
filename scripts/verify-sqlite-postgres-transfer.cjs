/* eslint-disable no-console */
const { PrismaClient: SqlitePrismaClient } = require("@prisma/client");
const { PrismaClient: PostgresPrismaClient } = require("../generated/postgres-client");
const path = require("path");

const SQLITE_URL = `file:${path.resolve(__dirname, "..", "prisma", "dev.db").replace(/\\/g, "/")}`;
const POSTGRES_URL = process.env.POSTGRES_RESTORE_URL || "postgresql://postgres:lamis@localhost:5432/restaurant?schema=public";

async function main() {
  const sqlite = new SqlitePrismaClient({ datasources: { db: { url: SQLITE_URL } } });
  const postgres = new PostgresPrismaClient({ datasources: { db: { url: POSTGRES_URL } } });

  const [
    sqliteFoodItems,
    sqliteOrders,
    sqliteOrderItems,
    sqliteUsers,
    sqlitePreferences,
    sqliteNotifications,
    pgFoodItems,
    pgOrders,
    pgOrderItems,
    pgUsers,
    pgPreferences,
    pgNotifications,
  ] = await Promise.all([
    sqlite.foodItem.count(),
    sqlite.order.count(),
    sqlite.orderItem.count(),
    sqlite.user.count(),
    sqlite.notificationPreference.count(),
    sqlite.notification.count(),
    postgres.foodItem.count(),
    postgres.order.count(),
    postgres.orderItem.count(),
    postgres.user.count(),
    postgres.notificationPreference.count(),
    postgres.notification.count(),
  ]);

  const sqliteCounts = {
    foodItems: sqliteFoodItems,
    orders: sqliteOrders,
    orderItems: sqliteOrderItems,
    users: sqliteUsers,
    notificationPreferences: sqlitePreferences,
    notifications: sqliteNotifications,
  };

  const postgresCounts = {
    foodItems: pgFoodItems,
    orders: pgOrders,
    orderItems: pgOrderItems,
    users: pgUsers,
    notificationPreferences: pgPreferences,
    notifications: pgNotifications,
  };

  console.log({ sqlite: sqliteCounts, postgres: postgresCounts });

  await sqlite.$disconnect();
  await postgres.$disconnect();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
