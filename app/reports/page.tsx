import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { ReportsView } from "@/components/reports/reports-view";

export default async function ReportsPage() {
  const { userId } = await auth();
  
  if (!userId) {
    redirect("/sign-in");
  }

  return <ReportsView />;
}

