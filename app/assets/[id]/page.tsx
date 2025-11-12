import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { AssetDetailView } from "@/components/assets/asset-detail-view";

export default async function AssetDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { userId } = await auth();
  
  if (!userId) {
    redirect("/sign-in");
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
    notFound();
  }

  // Serialize Decimal fields to numbers for client component
  const serializedAsset = {
    ...asset,
    resaleValue: asset.resaleValue ? Number(asset.resaleValue) : null,
    hardDrives: asset.hardDrives?.map((hd: any) => ({
      ...hd,
      valueUsd: hd.valueUsd ? Number(hd.valueUsd) : null,
    })) || [],
  };

  return <AssetDetailView asset={serializedAsset} />;
}

