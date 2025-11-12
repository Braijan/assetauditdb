import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const workOrderSchema = z.object({
  assetId: z.string().min(1, "Asset is required"),
  woType: z.enum(["TEST", "REPAIR", "SANITIZE", "TEARDOWN"]),
  techId: z.string().optional(),
  notes: z.string().optional(),
  steps: z.array(z.object({
    sequence: z.number().int().min(1),
    procedureCode: z.string().optional(),
    notes: z.string().optional(),
  })).optional(),
});

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get("status"); // "open" or "closed"

    const where: any = {};
    if (status === "open") {
      where.closedAt = null;
    } else if (status === "closed") {
      where.closedAt = { not: null };
    }

    const workOrders = await prisma.workOrder.findMany({
      where,
      include: {
        asset: {
          include: {
            identifiers: { take: 1 },
            client: true,
          },
        },
        tech: true,
        steps: {
          orderBy: { sequence: "asc" },
        },
        _count: {
          select: {
            steps: true,
          },
        },
      },
      orderBy: { openedAt: "desc" },
    });

    return NextResponse.json(workOrders);
  } catch (error) {
    console.error("Error fetching work orders:", error);
    return NextResponse.json(
      { error: "Failed to fetch work orders" },
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
    const data = workOrderSchema.parse(body);

    // Get user account for tech assignment
    const userAccount = await prisma.userAccount.findUnique({
      where: { clerkId: userId },
    });

    const techId = data.techId || userAccount?.id || null;

    // Create work order
    const workOrder = await prisma.workOrder.create({
      data: {
        assetId: data.assetId,
        woType: data.woType,
        techId: techId,
        notes: data.notes || null,
        steps: data.steps
          ? {
              create: data.steps.map((step) => ({
                sequence: step.sequence,
                procedureCode: step.procedureCode || null,
                notes: step.notes || null,
              })),
            }
          : undefined,
      },
      include: {
        asset: {
          include: {
            identifiers: { take: 1 },
            client: true,
          },
        },
        tech: true,
        steps: {
          orderBy: { sequence: "asc" },
        },
      },
    });

    // Update asset status to IN_PROCESS if not already
    const asset = await prisma.asset.findUnique({
      where: { id: data.assetId },
      select: { currentStatus: true },
    });

    if (asset && asset.currentStatus === "RECEIVED") {
      await prisma.assetStatusHistory.create({
        data: {
          assetId: data.assetId,
          fromStatus: "RECEIVED",
          toStatus: "IN_PROCESS",
          changedBy: userAccount?.id || null,
          notes: `Work order opened: ${data.woType}`,
        },
      });

      await prisma.asset.update({
        where: { id: data.assetId },
        data: { currentStatus: "IN_PROCESS" },
      });
    }

    return NextResponse.json(workOrder, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid input", details: error.issues },
        { status: 400 }
      );
    }
    console.error("Error creating work order:", error);
    return NextResponse.json(
      { error: "Failed to create work order" },
      { status: 500 }
    );
  }
}

