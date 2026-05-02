import { PrismaClient } from "../src/generated/client/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";

const adapter = new PrismaBetterSqlite3({ 
  url: process.env.DATABASE_URL || "file:./dev.db" 
});

const prisma = new PrismaClient({ adapter });

async function main() {
  // Clear existing data
  await prisma.order.deleteMany();
  await prisma.customer.deleteMany();

  const customer1 = await prisma.customer.create({
    data: {
      name: "Tanisha",
      phone: "9876543210",
      address: "123 Laundry Lane",
      tags: "Frequent,VIP",
    },
  });

  const customer2 = await prisma.customer.create({
    data: {
      name: "Rahul",
      phone: "9988776655",
      address: "456 Clean St",
      tags: "New",
    },
  });

  await prisma.order.create({
    data: {
      customerId: customer1.id,
      items: JSON.stringify([{ type: "shirt", qty: 3 }, { type: "pant", qty: 2 }]),
      totalPrice: 45.0,
      status: "Ready",
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2 hours ago
    },
  });

  await prisma.order.create({
    data: {
      customerId: customer2.id,
      items: JSON.stringify([{ type: "suit", qty: 1 }]),
      totalPrice: 25.0,
      status: "Washing",
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 5), // 5 hours ago
    },
  });

  console.log("Database seeded!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
