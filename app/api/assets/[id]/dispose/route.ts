import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const disposeSchema = z.object({
  customerId: z.string(),
  salePrice: z.number().optional(),
  notes: z.string().optional(),
});

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const data = disposeSchema.parse(body);

    // Get user account
    const userAccount = await prisma.userAccount.findUnique({
      where: { clerkId: userId },
    });

    if (!userAccount) {
      return NextResponse.json({ error: "User account not found" }, { status: 404 });
    }

    // Get asset
    const asset = await prisma.asset.findUnique({
      where: { id },
    });

    if (!asset) {
      return NextResponse.json({ error: "Asset not found" }, { status: 404 });
    }

    // Create sales order if it doesn't exist
    const salesOrder = await prisma.salesOrder.create({
      data: {
        orderNumber: `SO-${Date.now()}`,
        customerId: data.customerId,
        status: "COMPLETED",
        notes: data.notes || null,
      },
    });

    // Create sales line
    await prisma.salesLine.create({
      data: {
        salesOrderId: salesOrder.id,
        assetId: id,
        unitPrice: data.salePrice ? data.salePrice.toString() : null,
        totalPrice: data.salePrice ? data.salePrice.toString() : null,
      },
    });

    // Update asset status to SHIPPED
    await prisma.assetStatusHistory.create({
      data: {
        assetId: id,
        fromStatus: asset.currentStatus,
        toStatus: "SHIPPED",
        changedBy: userAccount.id,
        notes: `Disposed/Sold to customer`,
      },
    });

    await prisma.asset.update({
      where: { id },
      data: { currentStatus: "SHIPPED" },
    });

    // Create CoC event
    await prisma.chainOfCustodyEvent.create({
      data: {
        assetId: id,
        eventType: "SHIPPED",
        performedBy: userAccount.id,
        notes: `Asset disposed/sold`,
      },
    });

    return NextResponse.json({
      success: true,
      salesOrder: salesOrder.orderNumber,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid input", details: error.issues },
        { status: 400 }
      );
    }
    console.error("Error disposing asset:", error);
    return NextResponse.json(
      { error: "Failed to dispose asset" },
      { status: 500 }
    );
  }
}

