import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const sanitizeSchema = z.object({
  method: z.enum(["NIST_800_88_CLEAR", "NIST_800_88_PURGE", "PHYSICAL_DESTROY"]),
  toolName: z.string().optional(),
  toolVersion: z.string().optional(),
  certificateNumber: z.string().optional(),
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
    const data = sanitizeSchema.parse(body);

    // Get user account
    const userAccount = await prisma.userAccount.findUnique({
      where: { clerkId: userId },
    });

    if (!userAccount) {
      return NextResponse.json({ error: "User account not found" }, { status: 404 });
    }

    // Create sanitization action
    const sanitizationAction = await prisma.sanitizationAction.create({
      data: {
        assetId: id,
        method: data.method,
        toolName: data.toolName || null,
        toolVersion: data.toolVersion || null,
        certificateNumber: data.certificateNumber || null,
        verifier: userAccount.name,
        endedAt: new Date(),
      },
    });

    // Create sanitization result (passed)
    const sanitizationResult = await prisma.sanitizationResult.create({
      data: {
        assetId: id,
        actionId: sanitizationAction.id,
        passed: true,
        verifiedAt: new Date(),
        verifierId: userAccount.id,
        certificateNumber: data.certificateNumber || `CERT-${Date.now()}`,
        notes: data.notes || null,
      },
    });

    // Update asset status to SANITIZED
    const asset = await prisma.asset.findUnique({
      where: { id },
      select: { currentStatus: true },
    });

    if (asset && asset.currentStatus !== "SANITIZED") {
      await prisma.assetStatusHistory.create({
        data: {
          assetId: id,
          fromStatus: asset.currentStatus,
          toStatus: "SANITIZED",
          changedBy: userAccount.id,
          notes: "Hard drive sanitized",
        },
      });

      await prisma.asset.update({
        where: { id },
        data: { currentStatus: "SANITIZED" },
      });

      // Create CoC event
      await prisma.chainOfCustodyEvent.create({
        data: {
          assetId: id,
          eventType: "SANITIZED",
          performedBy: userAccount.id,
          notes: `Sanitized using ${data.method}`,
        },
      });
    }

    return NextResponse.json({
      success: true,
      sanitizationResult,
      certificateNumber: sanitizationResult.certificateNumber,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid input", details: error.issues },
        { status: 400 }
      );
    }
    console.error("Error sanitizing asset:", error);
    return NextResponse.json(
      { error: "Failed to sanitize asset" },
      { status: 500 }
    );
  }
}

