import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const stepSchema = z.object({
  sequence: z.number().int().min(1),
  procedureCode: z.string().optional(),
  startedAt: z.string().optional(),
  endedAt: z.string().optional(),
  passed: z.boolean().optional(),
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
    const data = stepSchema.parse(body);

    const step = await prisma.workOrderStep.create({
      data: {
        workOrderId: id,
        sequence: data.sequence,
        procedureCode: data.procedureCode || null,
        startedAt: data.startedAt ? new Date(data.startedAt) : null,
        endedAt: data.endedAt ? new Date(data.endedAt) : null,
        passed: data.passed ?? null,
        notes: data.notes || null,
      },
    });

    return NextResponse.json(step, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid input", details: error.issues },
        { status: 400 }
      );
    }
    console.error("Error creating work order step:", error);
    return NextResponse.json(
      { error: "Failed to create work order step" },
      { status: 500 }
    );
  }
}

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
    const searchParams = request.nextUrl.searchParams;
    const stepId = searchParams.get("stepId");

    if (!stepId) {
      return NextResponse.json(
        { error: "stepId is required" },
        { status: 400 }
      );
    }

    const body = await request.json();
    const data = stepSchema.partial().parse(body);

    const updateData: any = {};
    if (data.procedureCode !== undefined) updateData.procedureCode = data.procedureCode;
    if (data.startedAt !== undefined) updateData.startedAt = data.startedAt ? new Date(data.startedAt) : null;
    if (data.endedAt !== undefined) updateData.endedAt = data.endedAt ? new Date(data.endedAt) : null;
    if (data.passed !== undefined) updateData.passed = data.passed;
    if (data.notes !== undefined) updateData.notes = data.notes;

    const step = await prisma.workOrderStep.update({
      where: { id: stepId },
      data: updateData,
    });

    return NextResponse.json(step);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid input", details: error.issues },
        { status: 400 }
      );
    }
    console.error("Error updating work order step:", error);
    return NextResponse.json(
      { error: "Failed to update work order step" },
      { status: 500 }
    );
  }
}

