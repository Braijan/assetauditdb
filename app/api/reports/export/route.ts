import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import * as XLSX from "xlsx";

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const reportType = searchParams.get("type") || "assets";
    const status = searchParams.get("status");
    const clientId = searchParams.get("clientId");

    let data: any[] = [];
    let filename = "report.xlsx";

    if (reportType === "assets") {
      const assets = await prisma.asset.findMany({
        where: {
          ...(status && { currentStatus: status as any }),
          ...(clientId && { clientId }),
        },
        include: {
          client: true,
          currentLocation: true,
          identifiers: true,
          assignedTo: true,
          hardDrives: true,
          sanitizationResults: {
            where: { passed: true },
            orderBy: { createdAt: "desc" },
            take: 1,
          },
        },
        orderBy: { createdAt: "desc" },
      });

      data = assets.map((asset) => {
        const totalHdCapacity = asset.hardDrives?.reduce((sum: number, hd: any) => sum + (hd.capacityGb || 0), 0) || 0;
        const totalHdValue = asset.hardDrives?.reduce((sum: number, hd: any) => sum + (hd.valueUsd ? Number(hd.valueUsd) : 0), 0) || 0;
        const allHdCompliant = asset.hardDrives?.every((hd: any) => hd.destructionStatus === "COMPLIANT") || false;
        const hdSerialNumbers = asset.hardDrives?.map((hd: any) => hd.serialNumber).join(", ") || "";
        const purchaseDate = asset.purchaseDate ? new Date(asset.purchaseDate) : null;
        const assetAge = purchaseDate ? Math.floor((new Date().getTime() - purchaseDate.getTime()) / (1000 * 60 * 60 * 24 * 365)) : null;

        return {
          "Asset Tag": asset.identifiers.find((id: any) => id.idType === "CLIENT_TAG")?.idValue || asset.identifiers[0]?.idValue || "",
          "Serial Number": asset.identifiers.find((id: any) => id.idType === "SERIAL")?.idValue || "",
          "Make": asset.manufacturer || "",
          "Model": asset.model || "",
          "Processor": asset.processor || "",
          "RAM Size (GB)": asset.ramSizeGb || "",
          "Storage Type": asset.storageType || "",
          "Storage Capacity (GB)": asset.storageCapacityGb || "",
          "Screen Size (inches)": asset.screenSizeInches || "",
          "Operating System": asset.operatingSystem || "",
          "R2v3 Compliance": asset.r2v3Compliance || "",
          "Asset Value (USD)": asset.resaleValue ? Number(asset.resaleValue).toFixed(2) : "",
          "Purchase Date": purchaseDate ? purchaseDate.toLocaleDateString() : "",
          "Location": asset.currentLocation?.name || "",
          "Assigned To": asset.assignedTo?.name || "Unassigned",
          "Compliance Notes": asset.complianceNotes || "",
          "Hard Drives": hdSerialNumbers,
          "Asset Age (years)": assetAge !== null ? assetAge.toString() : "",
          "Number of Hard Drives": asset.hardDrives?.length || 0,
          "Total Hard Drive Capacity (GB)": totalHdCapacity,
          "Total Hard Drive Value (USD)": totalHdValue.toFixed(2),
          "All Hard Drive Destruction Statuses": allHdCompliant ? "Compliant" : asset.hardDrives?.some((hd: any) => hd.destructionStatus) ? "Mixed" : "Not Destroyed",
          "Destruction Certificates": asset.hardDrives?.map((hd: any) => hd.destructionCertificate).filter(Boolean).join(", ") || "",
          "Hard Drive Wiped": asset.sanitizationResults.length > 0 ? "Yes" : "No",
          "Wipe Certificate": asset.sanitizationResults[0]?.certificateNumber || "",
          "Wiped Date": asset.sanitizationResults[0]?.verifiedAt
            ? new Date(asset.sanitizationResults[0].verifiedAt).toLocaleDateString()
            : "",
          "Asset Compliance Summary": asset.complianceSummary || "",
          "Suggested Next Compliance Action": asset.suggestedNextAction || "",
        };
      });

      filename = `assets-export-${new Date().toISOString().split("T")[0]}.xlsx`;
    } else if (reportType === "chain-of-custody") {
      const events = await prisma.chainOfCustodyEvent.findMany({
        include: {
          asset: {
            include: {
              identifiers: { take: 1 },
              client: true,
            },
          },
          fromLocation: true,
          toLocation: true,
          performer: true,
        },
        orderBy: { eventTs: "desc" },
        take: 1000,
      });

      data = events.map((event) => ({
        "Event Type": event.eventType,
        "Event Date": new Date(event.eventTs).toLocaleString(),
        "Asset ID": event.asset.identifiers[0]?.idValue || event.asset.id.slice(0, 8),
        "Manufacturer": event.asset.manufacturer || "",
        "Model": event.asset.model || "",
        "Client": event.asset.client.name,
        "From Location": event.fromLocation?.name || "",
        "To Location": event.toLocation?.name || "",
        "Performed By": event.performer?.name || "",
        "Notes": event.notes || "",
      }));

      filename = `chain-of-custody-export-${new Date().toISOString().split("T")[0]}.xlsx`;
    } else if (reportType === "work-orders") {
      const workOrders = await prisma.workOrder.findMany({
        include: {
          asset: {
            include: {
              identifiers: { take: 1 },
              client: true,
            },
          },
          tech: true,
          steps: true,
        },
        orderBy: { openedAt: "desc" },
        take: 1000,
      });

      data = workOrders.map((wo) => ({
        "Work Order ID": wo.id.slice(0, 8),
        "Type": wo.woType,
        "Asset ID": wo.asset.identifiers[0]?.idValue || wo.asset.id.slice(0, 8),
        "Client": wo.asset.client.name,
        "Tech": wo.tech?.name || "",
        "Opened": new Date(wo.openedAt).toLocaleDateString(),
        "Closed": wo.closedAt ? new Date(wo.closedAt).toLocaleDateString() : "",
        "Steps": wo.steps.length,
        "Status": wo.closedAt ? "Closed" : "Open",
      }));

      filename = `work-orders-export-${new Date().toISOString().split("T")[0]}.xlsx`;
    }

    // Create workbook and worksheet
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Data");

    // Generate buffer
    const buffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });

    // Return as download
    return new NextResponse(buffer, {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error("Error generating report:", error);
    return NextResponse.json(
      { error: "Failed to generate report" },
      { status: 500 }
    );
  }
}

