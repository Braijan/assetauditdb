import { auth, currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Package, FileText, Truck, AlertCircle, TrendingUp } from "lucide-react";

export default async function DashboardPage() {
  const { userId } = await auth();
  
  if (!userId) {
    redirect("/sign-in");
  }

  // Get or create user account
  const clerkUser = await currentUser();
  if (!clerkUser) {
    redirect("/sign-in");
  }

  let userAccount = await prisma.userAccount.findUnique({
    where: { clerkId: userId },
  });

  if (!userAccount) {
    // Create user account on first login
    userAccount = await prisma.userAccount.create({
      data: {
        clerkId: userId,
        name: clerkUser.fullName || clerkUser.firstName || "User",
        email: clerkUser.emailAddresses[0]?.emailAddress || "",
        role: "TECH", // Default role, can be updated by admin
      },
    });
  }

  // Get dashboard stats
  let totalAssets = 0;
  let assetsInProcess = 0;
  let assetsReadyForSale = 0;
  let pendingWorkOrders = 0;
  let recentAssets: any[] = [];

  try {
    [
      totalAssets,
      assetsInProcess,
      assetsReadyForSale,
      pendingWorkOrders,
      recentAssets,
    ] = await Promise.all([
      prisma.asset.count(),
      prisma.asset.count({ where: { currentStatus: "IN_PROCESS" } }),
      prisma.asset.count({ where: { currentStatus: "READY_FOR_SALE" } }),
      prisma.workOrder.count({ where: { closedAt: null } }),
      prisma.asset.findMany({
        take: 5,
        orderBy: { createdAt: "desc" },
        include: {
          client: true,
          currentLocation: true,
          identifiers: { take: 1 },
        },
      }),
    ]);

    // Serialize Decimal fields to numbers for client component
    recentAssets = recentAssets.map((asset: any) => ({
      ...asset,
      resaleValue: asset.resaleValue ? Number(asset.resaleValue) : null,
    }));
  } catch (error: any) {
    console.error("Database connection error:", error);
    // Return error page instead of crashing
    return (
      <div className="flex-1 space-y-6 p-6">
        <div className="rounded-lg border border-red-200 bg-red-50 p-6">
          <h2 className="text-xl font-semibold text-red-800 mb-2">
            Database Connection Error
          </h2>
          <p className="text-red-700 mb-4">
            Unable to connect to the database. Please check:
          </p>
          <ul className="list-disc list-inside text-red-700 space-y-1 mb-4">
            <li>Your DATABASE_URL in the .env file is correct</li>
            <li>The database server is running and accessible</li>
            <li>Your network connection is working</li>
            <li>You've restarted the dev server after changing .env</li>
          </ul>
          <p className="text-sm text-red-600">
            Error: {error.message || "Unknown database error"}
          </p>
        </div>
      </div>
    );
  }

  const stats = [
    {
      title: "Total Assets",
      value: totalAssets,
      icon: Package,
      href: "/assets",
    },
    {
      title: "In Process",
      value: assetsInProcess,
      icon: TrendingUp,
      href: "/assets?status=IN_PROCESS",
    },
    {
      title: "Ready for Sale",
      value: assetsReadyForSale,
      icon: FileText,
      href: "/assets?status=READY_FOR_SALE",
    },
    {
      title: "Pending Work Orders",
      value: pendingWorkOrders,
      icon: AlertCircle,
      href: "/work-orders",
    },
  ];

  return (
    <div className="flex-1 space-y-6 p-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome back, {userAccount.name}
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Link key={stat.title} href={stat.href}>
              <Card className="hover:bg-accent transition-colors cursor-pointer">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    {stat.title}
                  </CardTitle>
                  <Icon className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stat.value}</div>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Recent Assets</CardTitle>
            <CardDescription>Latest assets added to the system</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentAssets.length === 0 ? (
                <p className="text-sm text-muted-foreground">No assets yet</p>
              ) : (
                recentAssets.map((asset) => (
                  <div
                    key={asset.id}
                    className="flex items-center justify-between border-b pb-2 last:border-0"
                  >
                    <div>
                      <p className="text-sm font-medium">
                        {asset.manufacturer} {asset.model}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {asset.identifiers[0]?.idValue || "No ID"} • {asset.client.name}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium">{asset.currentStatus}</p>
                      <p className="text-xs text-muted-foreground">
                        {asset.currentLocation?.name || "No location"}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
            <Button asChild variant="outline" className="w-full mt-4">
              <Link href="/assets">View All Assets</Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Common tasks and workflows</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button asChild className="w-full" variant="default">
              <Link href="/assets/new">
                <Package className="mr-2 h-4 w-4" />
                Add New Asset
              </Link>
            </Button>
            <Button asChild className="w-full" variant="outline">
              <Link href="/intake/new">
                <Truck className="mr-2 h-4 w-4" />
                Create Intake Order
              </Link>
            </Button>
            <Button asChild className="w-full" variant="outline">
              <Link href="/work-orders/new">
                <FileText className="mr-2 h-4 w-4" />
                Create Work Order
              </Link>
            </Button>
            <Button asChild className="w-full" variant="outline">
              <Link href="/reports">
                <FileText className="mr-2 h-4 w-4" />
                Generate Reports
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

