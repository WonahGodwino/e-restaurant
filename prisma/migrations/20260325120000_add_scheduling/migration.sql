-- AlterTable: add scheduling fields to Order
ALTER TABLE "Order" ADD COLUMN "orderType" TEXT NOT NULL DEFAULT 'ASAP';
ALTER TABLE "Order" ADD COLUMN "scheduledFor" DATETIME;

-- CreateTable
CREATE TABLE "ServiceWindow" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "dayOfWeek" INTEGER NOT NULL,
    "openTime" TEXT NOT NULL,
    "closeTime" TEXT NOT NULL,
    "slotDurationMinutes" INTEGER NOT NULL DEFAULT 30,
    "cutoffMinutes" INTEGER NOT NULL DEFAULT 60,
    "isPickup" BOOLEAN NOT NULL DEFAULT true,
    "isDelivery" BOOLEAN NOT NULL DEFAULT true,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
