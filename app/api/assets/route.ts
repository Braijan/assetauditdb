import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const assetSchema = z.object({
  clientId: z.string(),
  model: z.string().optional(),
  manufacturer: z.string().optional(),
  purchaseDate: z.string().optional(),
  dataBearing: z.boolean().optional(),
  hazmat: z.boolean().optional(),
  currentLocationId: z.string().optional(),
  assignedToId: z.string().optional(),
  resaleValue: z.number().optional(),
  processor: z.string().optional(),
  ramSizeGb: z.number().int().optional(),
  storageType: z.string().optional(),
  storageCapacityGb: z.number().int().optional(),
  screenSizeInches: z.number().optional(),
  operatingSystem: z.string().optional(),
  r2v3Compliance: z.enum(["COMPLIANT", "PENDING", "NONCOMPLIANT"]).optional(),
  complianceNotes: z.string().optional(),
  identifiers: z.array(z.object({
    idType: z.enum(["SERIAL", "CLIENT_TAG", "INT_TAG", "IMEI", "MAC", "UUID"]),
    idValue: z.string(),
  })).optional(),
  hardDrives: z.array(z.object({
    serialNumber: z.string(),
    capacityGb: z.number().int().optional(),
    valueUsd: z.number().optional(),
  })).optional(),
});

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get("status");
    const clientId = searchParams.get("clientId");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "50");
    const skip = (page - 1) * limit;

    const where: any = {};
    if (status) {
      where.currentStatus = status;
    }
    if (clientId) {
      where.clientId = clientId;
    }

    const [assets, total] = await Promise.all([
      prisma.asset.findMany({
        where,
        skip,
        take: limit,
        include: {
          client: true,
          currentLocation: true,
          identifiers: true,
        },
        orderBy: { createdAt: "desc" },
      }),
      prisma.asset.count({ where }),
    ]);

    // Serialize Decimal fields to numbers
    const serializedAssets = assets.map((asset) => ({
      ...asset,
      resaleValue: asset.resaleValue ? Number(asset.resaleValue) : null,
    }));

    return NextResponse.json({
      assets: serializedAssets,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching assets:", error);
    return NextResponse.json(
      { error: "Failed to fetch assets" },
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
    const data = assetSchema.parse(body);

    // Get or create user account
    let userAccount;
    try {
      userAccount = await prisma.userAccount.findUnique({
        where: { clerkId: userId },
      });
    } catch (dbError: any) {
      console.error("Database connection error:", dbError);
      if (dbError.message?.includes("Can't reach database server")) {
        return NextResponse.json(
          { 
            error: "Database connection failed. Please check your DATABASE_URL and ensure the database server is running.",
            details: "The application cannot connect to the database server. This may be a network issue or the database may be temporarily unavailable."
          },
          { status: 503 }
        );
      }
      throw dbError;
    }

    if (!userAccount) {
      // This shouldn't happen if user creation is handled on login, but handle it gracefully
      return NextResponse.json(
        { error: "User account not found. Please refresh and try again." },
        { status: 404 }
      );
    }

    // Create asset
    const asset = await prisma.asset.create({
      data: {
        clientId: data.clientId,
        model: data.model,
        manufacturer: data.manufacturer,
        purchaseDate: data.purchaseDate ? new Date(data.purchaseDate) : null,
        dataBearing: data.dataBearing ?? false,
        hazmat: data.hazmat ?? false,
        currentLocationId: data.currentLocationId && data.currentLocationId !== "" ? data.currentLocationId : null,
        assignedToId: data.assignedToId && data.assignedToId !== "unassigned" ? data.assignedToId : null,
        resaleValue: data.resaleValue ? data.resaleValue.toString() : null,
        processor: data.processor || null,
        ramSizeGb: data.ramSizeGb || null,
        storageType: data.storageType || null,
        storageCapacityGb: data.storageCapacityGb || null,
        screenSizeInches: data.screenSizeInches || null,
        operatingSystem: data.operatingSystem || null,
        r2v3Compliance: data.r2v3Compliance || null,
        complianceNotes: data.complianceNotes || null,
        identifiers: data.identifiers ? {
          create: data.identifiers,
        } : undefined,
        hardDrives: data.hardDrives && data.hardDrives.length > 0 ? {
          create: data.hardDrives.map((hd) => ({
            serialNumber: hd.serialNumber,
            capacityGb: hd.capacityGb || null,
            valueUsd: hd.valueUsd ? hd.valueUsd.toString() : null,
          })),
        } : undefined,
      },
      include: {
        client: true,
        currentLocation: true,
        identifiers: true,
        hardDrives: true,
      },
    });

    // Create initial status history
    await prisma.assetStatusHistory.create({
      data: {
        assetId: asset.id,
        fromStatus: null,
        toStatus: "RECEIVED",
        changedBy: userAccount.id,
      },
    });

    // Create initial CoC event
    await prisma.chainOfCustodyEvent.create({
      data: {
        assetId: asset.id,
        eventType: "RECEIVED",
        toLocationId: data.currentLocationId && data.currentLocationId !== "" ? data.currentLocationId : undefined,
        performedBy: userAccount.id,
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

    return NextResponse.json(serializedAsset, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid input", details: error.issues },
        { status: 400 }
      );
    }
    console.error("Error creating asset:", error);
    const errorMessage = error instanceof Error ? error.message : "Failed to create asset";
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}

