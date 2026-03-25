/* eslint-disable no-console */
const { PrismaClient } = require("@prisma/client");

async function main() {
  const db = new PrismaClient();
  const [foodItems, orders] = await Promise.all([
    db.foodItem.count(),
    db.order.count(),
  ]);

  console.log({ foodItems, orders });
  await db.$disconnect();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
