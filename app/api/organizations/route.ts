import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const organizationSchema = z.object({
  type: z.enum(["CUSTOMER", "SUPPLIER", "DOWNSTREAM", "INTERNAL"]),
  name: z.string().min(1, "Name is required"),
  r2Scope: z.string().optional(),
  riskTier: z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]).optional(),
  active: z.boolean().default(true),
  email: z.string().email().optional().or(z.literal("")),
  phone: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  zipCode: z.string().optional(),
  country: z.string().optional(),
});

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const type = searchParams.get("type");
    const active = searchParams.get("active");

    const where: any = {};
    if (type) {
      where.type = type;
    }
    if (active !== null) {
      where.active = active === "true";
    }

    const organizations = await prisma.orgParty.findMany({
      where,
      orderBy: { name: "asc" },
      include: {
        _count: {
          select: {
            assets: true,
            locations: true,
          },
        },
      },
    });

    return NextResponse.json(organizations);
  } catch (error) {
    console.error("Error fetching organizations:", error);
    return NextResponse.json(
      { error: "Failed to fetch organizations" },
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
    const data = organizationSchema.parse(body);

    const organization = await prisma.orgParty.create({
      data: {
        type: data.type,
        name: data.name,
        r2Scope: data.r2Scope || null,
        riskTier: data.riskTier || null,
        active: data.active,
        email: data.email || null,
        phone: data.phone || null,
        address: data.address || null,
        city: data.city || null,
        state: data.state || null,
        zipCode: data.zipCode || null,
        country: data.country || null,
        createdBy: userId,
      },
    });

    return NextResponse.json(organization, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid input", details: error.issues },
        { status: 400 }
      );
    }
    console.error("Error creating organization:", error);
    return NextResponse.json(
      { error: "Failed to create organization" },
      { status: 500 }
    );
  }
}

