import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const intakeOrderSchema = z.object({
  clientId: z.string().min(1, "Client is required"),
  orderNumber: z.string().min(1, "Order number is required"),
  receivedDate: z.string().min(1, "Received date is required"),
  packingListNum: z.string().optional(),
  totalWeightKg: z.number().optional(),
  notes: z.string().optional(),
  lines: z.array(z.object({
    description: z.string().optional(),
    quantity: z.number().int().min(1).default(1),
    weightKg: z.number().optional(),
  })).min(1, "At least one line item is required"),
});

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const intakeOrders = await prisma.intakeOrder.findMany({
      include: {
        client: true,
        lines: {
          include: {
            asset: {
              include: {
                identifiers: { take: 1 },
              },
            },
          },
        },
        _count: {
          select: {
            lines: true,
          },
        },
      },
      orderBy: { receivedDate: "desc" },
    });

    return NextResponse.json(intakeOrders);
  } catch (error) {
    console.error("Error fetching intake orders:", error);
    return NextResponse.json(
      { error: "Failed to fetch intake orders" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const data = intakeOrderSchema.parse(body);

    // Check if order number already exists
    const existing = await prisma.intakeOrder.findUnique({
      where: { orderNumber: data.orderNumber },
    });

    if (existing) {
      return NextResponse.json(
        { error: "Order number already exists" },
        { status: 400 }
      );
    }

    // Create intake order with lines
    const intakeOrder = await prisma.intakeOrder.create({
      data: {
        clientId: data.clientId,
        orderNumber: data.orderNumber,
        receivedDate: new Date(data.receivedDate),
        packingListNum: data.packingListNum || null,
        totalWeightKg: data.totalWeightKg || null,
        notes: data.notes || null,
        createdBy: userId,
        lines: {
          create: data.lines.map((line) => ({
            description: line.description || null,
            quantity: line.quantity,
            weightKg: line.weightKg || null,
          })),
        },
      },
      include: {
        client: true,
        lines: true,
      },
    });

    return NextResponse.json(intakeOrder, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid input", details: error.issues },
        { status: 400 }
      );
    }
    console.error("Error creating intake order:", error);
    return NextResponse.json(
      { error: "Failed to create intake order" },
      { status: 500 }
    );
  }
}

