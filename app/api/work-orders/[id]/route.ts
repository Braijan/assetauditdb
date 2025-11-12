import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const updateWorkOrderSchema = z.object({
  techId: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  closedAt: z.string().optional().nullable(), // ISO date string or null to close
});

export async function PATCH(
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
    const data = updateWorkOrderSchema.parse(body);

    const updateData: any = {};
    if (data.techId !== undefined) updateData.techId = data.techId;
    if (data.notes !== undefined) updateData.notes = data.notes;
    if (data.closedAt !== undefined) {
      updateData.closedAt = data.closedAt ? new Date(data.closedAt) : new Date();
    }

    const workOrder = await prisma.workOrder.update({
      where: { id },
      data: updateData,
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

    return NextResponse.json(workOrder);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid input", details: error.issues },
        { status: 400 }
      );
    }
    console.error("Error updating work order:", error);
    return NextResponse.json(
      { error: "Failed to update work order" },
      { status: 500 }
    );
  }
}

