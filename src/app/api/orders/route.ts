import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  const orders = await prisma.order.findMany({
    include: { customer: true },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(orders);
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { customerName, items, totalPrice, status } = body;

    // Find or create customer
    let customer = await prisma.customer.findFirst({
      where: { name: customerName }
    });

    if (!customer) {
      customer = await prisma.customer.create({
        data: { name: customerName, tags: "New" }
      });
    }

    const order = await prisma.order.create({
      data: {
        customerId: customer.id,
        items: JSON.stringify(items),
        totalPrice,
        status: status || "Received",
      },
    });

    return NextResponse.json(order);
  } catch (error) {
    console.error("Order creation error:", error);
    return NextResponse.json({ error: "Failed to create order" }, { status: 500 });
  }
}
