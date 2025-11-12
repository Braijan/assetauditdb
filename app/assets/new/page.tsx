import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { AssetForm } from "@/components/assets/asset-form";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default async function NewAssetPage() {
  const { userId } = await auth();
  
  if (!userId) {
    redirect("/sign-in");
  }

  const [clients, locations] = await Promise.all([
    prisma.orgParty.findMany({
      where: { type: "CUSTOMER", active: true },
      orderBy: { name: "asc" },
    }),
    prisma.location.findMany({
      include: { orgParty: true },
      orderBy: [{ orgParty: { name: "asc" } }, { name: "asc" }],
    }),
  ]);

  if (clients.length === 0) {
    return (
      <div className="flex-1 space-y-6 p-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Add New Asset</h1>
          <p className="text-muted-foreground">
            Register a new ITAD asset in the system
          </p>
        </div>

        <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-6">
          <h2 className="text-lg font-semibold text-yellow-800 mb-2">
            No Clients Found
          </h2>
          <p className="text-yellow-700 mb-4">
            You need to add at least one client organization before you can create assets.
          </p>
          <Button asChild>
            <Link href="/settings/organizations">
              Go to Settings to Add Client
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 space-y-6 p-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Add New Asset</h1>
        <p className="text-muted-foreground">
          Register a new ITAD asset in the system
        </p>
      </div>

      <AssetForm clients={clients} locations={locations} />
    </div>
  );
}

