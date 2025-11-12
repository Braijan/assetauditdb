import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Plus } from "lucide-react";
import { AssetsTable } from "@/components/assets/assets-table";

export default async function AssetsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; clientId?: string; page?: string }>;
}) {
  const { userId } = await auth();
  
  if (!userId) {
    redirect("/sign-in");
  }

  const params = await searchParams;
  const status = params.status;
  const clientId = params.clientId;
  const page = parseInt(params.page || "1");

  let assets: any[] = [];
  let clients: any[] = [];
  let total = 0;

  try {
    const [rawAssets, clients, total] = await Promise.all([
      prisma.asset.findMany({
        where: {
          ...(status && { currentStatus: status as any }),
          ...(clientId && { clientId }),
        },
        skip: (page - 1) * 50,
        take: 50,
        include: {
          client: true,
          currentLocation: true,
          identifiers: { take: 1 },
        },
        orderBy: { createdAt: "desc" },
      }),
      prisma.orgParty.findMany({
        where: { type: "CUSTOMER", active: true },
        orderBy: { name: "asc" },
      }),
      prisma.asset.count({
        where: {
          ...(status && { currentStatus: status as any }),
          ...(clientId && { clientId }),
        },
      }),
    ]);

    // Serialize Decimal fields to numbers for client component
    assets = rawAssets.map((asset) => ({
      ...asset,
      resaleValue: asset.resaleValue ? Number(asset.resaleValue) : null,
    }));
  } catch (error: any) {
    console.error("Database connection error:", error);
    return (
      <div className="flex-1 space-y-6 p-6">
        <div className="rounded-lg border border-red-200 bg-red-50 p-6">
          <h2 className="text-xl font-semibold text-red-800 mb-2">
            Database Connection Error
          </h2>
          <p className="text-red-700 mb-4">
            Unable to connect to the database. Please check your DATABASE_URL in .env and restart the dev server.
          </p>
          <p className="text-sm text-red-600">
            Error: {error.message || "Unknown database error"}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Assets</h1>
          <p className="text-muted-foreground">
            Manage and track all ITAD assets
          </p>
        </div>
        <Button asChild>
          <Link href="/assets/new">
            <Plus className="mr-2 h-4 w-4" />
            Add Asset
          </Link>
        </Button>
      </div>

      <AssetsTable
        assets={assets}
        clients={clients}
        currentStatus={status}
        currentClientId={clientId}
        page={page}
        total={total}
      />
    </div>
  );
}

