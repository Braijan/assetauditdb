import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const updateAssetSchema = z.object({
  model: z.string().optional(),
  manufacturer: z.string().optional(),
  purchaseDate: z.string().optional(),
  currentStatus: z.enum(["RECEIVED", "IN_PROCESS", "SANITIZED", "READY_FOR_SALE", "SCRAPPED", "SHIPPED", "DESTROYED"]).optional(),
  dataBearing: z.boolean().optional(),
  hazmat: z.boolean().optional(),
  currentLocationId: z.string().optional().nullable(),
  assignedToId: z.string().optional().nullable(),
  resaleValue: z.number().optional(),
  processor: z.string().optional(),
  ramSizeGb: z.number().int().optional(),
  storageType: z.string().optional(),
  storageCapacityGb: z.number().int().optional(),
  screenSizeInches: z.number().optional(),
  operatingSystem: z.string().optional(),
  r2v3Compliance: z.enum(["COMPLIANT", "PENDING", "NONCOMPLIANT"]).optional(),
  complianceNotes: z.string().optional(),
});

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const asset = await prisma.asset.findUnique({
      where: { id },
      include: {
        client: true,
        currentLocation: true,
        identifiers: true,
        statusHistory: {
          include: { changer: true },
          orderBy: { changedTs: "desc" },
        },
        cocEvents: {
          include: {
            fromLocation: true,
            toLocation: true,
            performer: true,
          },
          orderBy: { eventTs: "desc" },
        },
        workOrders: {
          include: {
            tech: true,
            steps: true,
          },
          orderBy: { openedAt: "desc" },
        },
        sanitizationResults: {
          include: { verifier: true },
          orderBy: { createdAt: "desc" },
        },
        testResults: {
          include: { tester: true },
          orderBy: { testTs: "desc" },
        },
        components: {
          include: { component: true },
        },
        hardDrives: {
          include: { verifiedBy: true },
          orderBy: { createdAt: "asc" },
        },
        assignedTo: true,
      },
    });

    if (!asset) {
      return NextResponse.json({ error: "Asset not found" }, { status: 404 });
    }

    // Serialize Decimal fields to numbers
    const serializedAsset = {
      ...asset,
      resaleValue: asset.resaleValue ? Number(asset.resaleValue) : null,
      hardDrives: asset.hardDrives.map((hd: any) => ({
        ...hd,
        valueUsd: hd.valueUsd ? Number(hd.valueUsd) : null,
      })),
    };

    return NextResponse.json(serializedAsset);
  } catch (error) {
    console.error("Error fetching asset:", error);
    return NextResponse.json(
      { error: "Failed to fetch asset" },
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
    const body = await request.json();
    const data = updateAssetSchema.parse(body);

    // Get current asset to track status changes
    const currentAsset = await prisma.asset.findUnique({
      where: { id },
      select: { currentStatus: true, currentLocationId: true },
    });

    if (!currentAsset) {
      return NextResponse.json({ error: "Asset not found" }, { status: 404 });
    }

    // Update asset
    const updateData: any = {};
    if (data.model !== undefined) updateData.model = data.model;
    if (data.manufacturer !== undefined) updateData.manufacturer = data.manufacturer;
    if (data.purchaseDate !== undefined) updateData.purchaseDate = data.purchaseDate ? new Date(data.purchaseDate) : null;
    if (data.dataBearing !== undefined) updateData.dataBearing = data.dataBearing;
    if (data.hazmat !== undefined) updateData.hazmat = data.hazmat;
    if (data.currentLocationId !== undefined) updateData.currentLocationId = data.currentLocationId;
    if (data.assignedToId !== undefined) updateData.assignedToId = data.assignedToId;
    if (data.resaleValue !== undefined) updateData.resaleValue = data.resaleValue ? data.resaleValue.toString() : null;
    if (data.processor !== undefined) updateData.processor = data.processor;
    if (data.ramSizeGb !== undefined) updateData.ramSizeGb = data.ramSizeGb;
    if (data.storageType !== undefined) updateData.storageType = data.storageType;
    if (data.storageCapacityGb !== undefined) updateData.storageCapacityGb = data.storageCapacityGb;
    if (data.screenSizeInches !== undefined) updateData.screenSizeInches = data.screenSizeInches;
    if (data.operatingSystem !== undefined) updateData.operatingSystem = data.operatingSystem;
    if (data.r2v3Compliance !== undefined) updateData.r2v3Compliance = data.r2v3Compliance;
    if (data.complianceNotes !== undefined) updateData.complianceNotes = data.complianceNotes;

    // Handle status change
    if (data.currentStatus && data.currentStatus !== currentAsset.currentStatus) {
      await prisma.assetStatusHistory.create({
        data: {
          assetId: id,
          fromStatus: currentAsset.currentStatus,
          toStatus: data.currentStatus,
          changedBy: userId,
        },
      });
      updateData.currentStatus = data.currentStatus;
    }

    // Handle location change
    if (data.currentLocationId !== undefined && data.currentLocationId !== currentAsset.currentLocationId) {
      await prisma.chainOfCustodyEvent.create({
        data: {
          assetId: id,
          eventType: "MOVED",
          fromLocationId: currentAsset.currentLocationId || undefined,
          toLocationId: data.currentLocationId || undefined,
          performedBy: userId,
        },
      });
    }

    const asset = await prisma.asset.update({
      where: { id },
      data: updateData,
      include: {
        client: true,
        currentLocation: true,
        identifiers: true,
        hardDrives: true,
        assignedTo: true,
      },
    });

    // Serialize Decimal fields to numbers
    const serializedAsset = {
      ...asset,
      resaleValue: asset.resaleValue ? Number(asset.resaleValue) : null,
      hardDrives: asset.hardDrives.map((hd: any) => ({
        ...hd,
        valueUsd: hd.valueUsd ? Number(hd.valueUsd) : null,
      })),
    };

    return NextResponse.json(serializedAsset);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid input", details: error.issues },
        { status: 400 }
      );
    }
    console.error("Error updating asset:", error);
    return NextResponse.json(
      { error: "Failed to update asset" },
      { status: 500 }
    );
  }
}

