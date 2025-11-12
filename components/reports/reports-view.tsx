"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FileSpreadsheet, Download } from "lucide-react";

export function ReportsView() {
  const [reportType, setReportType] = useState("assets");
  const [status, setStatus] = useState("all");
  const [isGenerating, setIsGenerating] = useState(false);

  const handleExport = async () => {
    setIsGenerating(true);
    try {
      const params = new URLSearchParams({
        type: reportType,
        ...(status && status !== "all" && { status }),
      });

      const response = await fetch(`/api/reports/export?${params.toString()}`);
      
      if (!response.ok) {
        throw new Error("Failed to generate report");
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = response.headers.get("Content-Disposition")?.split("filename=")[1]?.replace(/"/g, "") || "report.xlsx";
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error("Error exporting report:", error);
      alert("Failed to generate report");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="flex-1 space-y-6 p-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Reports</h1>
        <p className="text-muted-foreground">
          Generate Excel reports for assets, chain of custody, and work orders
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Export Reports</CardTitle>
          <CardDescription>
            Select a report type and generate an Excel file
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Report Type</label>
            <Select value={reportType} onValueChange={setReportType}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="assets">Assets</SelectItem>
                <SelectItem value="chain-of-custody">Chain of Custody</SelectItem>
                <SelectItem value="work-orders">Work Orders</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {reportType === "assets" && (
            <div className="space-y-2">
              <label className="text-sm font-medium">Filter by Status (Optional)</label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="All statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="RECEIVED">Received</SelectItem>
                  <SelectItem value="IN_PROCESS">In Process</SelectItem>
                  <SelectItem value="SANITIZED">Sanitized</SelectItem>
                  <SelectItem value="READY_FOR_SALE">Ready for Sale</SelectItem>
                  <SelectItem value="SCRAPPED">Scrapped</SelectItem>
                  <SelectItem value="SHIPPED">Shipped</SelectItem>
                  <SelectItem value="DESTROYED">Destroyed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          <Button
            onClick={handleExport}
            disabled={isGenerating}
            className="w-full"
          >
            {isGenerating ? (
              "Generating..."
            ) : (
              <>
                <Download className="mr-2 h-4 w-4" />
                Generate Excel Report
              </>
            )}
          </Button>

          <div className="rounded-lg border bg-muted/50 p-4">
            <div className="flex items-start gap-3">
              <FileSpreadsheet className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div className="space-y-1">
                <p className="text-sm font-medium">Report Information</p>
                <p className="text-sm text-muted-foreground">
                  Reports are generated in Excel format (.xlsx) and include all relevant data
                  for the selected report type. You can filter and sort the data in Excel
                  after downloading.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

