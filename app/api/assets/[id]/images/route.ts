import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import { existsSync } from "fs";

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

    // Get all images linked to this asset
    const documentLinks = await prisma.documentLink.findMany({
      where: {
        linkType: "asset",
        linkId: id,
        document: {
          type: "photo",
        },
      },
      include: {
        document: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json({
      images: documentLinks.map((link) => ({
        id: link.document.id,
        name: link.document.name,
        url: `/uploads/${link.document.storagePath}`,
        uploadedAt: link.document.uploadedAt,
      })),
    });
  } catch (error) {
    console.error("Error fetching images:", error);
    return NextResponse.json(
      { error: "Failed to fetch images" },
      { status: 500 }
    );
  }
}

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

    // Get user account
    const userAccount = await prisma.userAccount.findUnique({
      where: { clerkId: userId },
    });

    if (!userAccount) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Verify asset exists
    const asset = await prisma.asset.findUnique({
      where: { id },
    });

    if (!asset) {
      return NextResponse.json({ error: "Asset not found" }, { status: 404 });
    }

    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json(
        { error: "No file provided" },
        { status: 400 }
      );
    }

    // Validate file type
    if (!file.type.startsWith("image/")) {
      return NextResponse.json(
        { error: "File must be an image" },
        { status: 400 }
      );
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json(
        { error: "File size must be less than 10MB" },
        { status: 400 }
      );
    }

    // Create uploads directory if it doesn't exist
    const uploadsDir = join(process.cwd(), "public", "uploads");
    if (!existsSync(uploadsDir)) {
      await mkdir(uploadsDir, { recursive: true });
    }

    // Generate unique filename
    const timestamp = Date.now();
    const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_");
    const filename = `${id}_${timestamp}_${sanitizedName}`;
    const filepath = join(uploadsDir, filename);

    // Save file
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await writeFile(filepath, buffer);

    // Create document record
    const document = await prisma.document.create({
      data: {
        name: file.name,
        type: "photo",
        storagePath: filename,
        mimeType: file.type,
        uploadedBy: userAccount.id,
      },
    });

    // Link document to asset
    await prisma.documentLink.create({
      data: {
        documentId: document.id,
        linkType: "asset",
        linkId: id,
      },
    });

    return NextResponse.json({
      id: document.id,
      name: document.name,
      url: `/uploads/${filename}`,
      uploadedAt: document.uploadedAt,
    });
  } catch (error) {
    console.error("Error uploading image:", error);
    return NextResponse.json(
      { error: "Failed to upload image" },
      { status: 500 }
    );
  }
}

