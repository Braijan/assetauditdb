"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import Link from "next/link";
import { format } from "date-fns";
import { ArrowLeft, Edit, Package, MapPin, User, Calendar, HardDrive } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SanitizeDialog } from "./sanitize-dialog";
import { AssetImages } from "./asset-images";
import { useRouter } from "next/navigation";

const statusColors: Record<string, string> = {
  RECEIVED: "bg-blue-100 text-blue-800",
  IN_PROCESS: "bg-yellow-100 text-yellow-800",
  SANITIZED: "bg-green-100 text-green-800",
  READY_FOR_SALE: "bg-purple-100 text-purple-800",
  SCRAPPED: "bg-gray-100 text-gray-800",
  SHIPPED: "bg-indigo-100 text-indigo-800",
  DESTROYED: "bg-red-100 text-red-800",
};

interface AssetDetailViewProps {
  asset: any;
}

export function AssetDetailView({ asset }: AssetDetailViewProps) {
  const router = useRouter();
  const [sanitizeOpen, setSanitizeOpen] = useState(false);
  const isSanitized = asset.sanitizationResults?.some((r: any) => r.passed) || false;
  const latestSanitization = asset.sanitizationResults?.[0];

  return (
    <div className="flex-1 space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button asChild variant="ghost" size="sm">
            <Link href="/assets">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Assets
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              {asset.manufacturer || "Unknown"} {asset.model || ""}
            </h1>
            <p className="text-muted-foreground">
              Asset ID: {asset.identifiers[0]?.idValue || asset.id.slice(0, 8)}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          {asset.dataBearing && !isSanitized && (
            <Button
              variant="default"
              onClick={() => setSanitizeOpen(true)}
            >
              <HardDrive className="mr-2 h-4 w-4" />
              Record Wipe
            </Button>
          )}
          {isSanitized && (
            <Badge className="bg-green-100 text-green-800">
              <HardDrive className="mr-1 h-3 w-3" />
              Wiped {latestSanitization?.certificateNumber && `(${latestSanitization.certificateNumber})`}
            </Badge>
          )}
          <Button asChild>
            <Link href={`/assets/${asset.id}/edit`}>
              <Edit className="mr-2 h-4 w-4" />
              Edit
            </Link>
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Asset Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Status</p>
                <Badge
                  className={statusColors[asset.currentStatus] || "bg-gray-100 text-gray-800"}
                >
                  {asset.currentStatus.replace("_", " ")}
                </Badge>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Data Bearing</p>
                <p className="font-medium">{asset.dataBearing ? "Yes" : "No"}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Hazmat</p>
                <p className="font-medium">{asset.hazmat ? "Yes" : "No"}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Asset Value (USD)</p>
                <p className="font-medium">
                  {asset.resaleValue ? `$${Number(asset.resaleValue).toFixed(2)}` : "—"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Relationships</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                <User className="h-4 w-4" />
                Client
              </div>
              <p className="font-medium">{asset.client.name}</p>
            </div>
            <div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                <MapPin className="h-4 w-4" />
                Current Location
              </div>
              <p className="font-medium">{asset.currentLocation?.name || "No location"}</p>
            </div>
            <div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                <Calendar className="h-4 w-4" />
                Purchase Date
              </div>
              <p className="font-medium">
                {asset.purchaseDate
                  ? format(new Date(asset.purchaseDate), "MMM d, yyyy")
                  : "—"}
              </p>
            </div>
            {asset.identifiers.length > 0 && (
              <div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                  <Package className="h-4 w-4" />
                  Identifiers
                </div>
                <div className="space-y-1">
                  {asset.identifiers.map((id: any) => (
                    <div key={id.id} className="text-sm">
                      <span className="text-muted-foreground">{id.idType}:</span>{" "}
                      <span className="font-mono">{id.idValue}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="images" className="space-y-4">
        <TabsList>
          <TabsTrigger value="images">Images</TabsTrigger>
          <TabsTrigger value="history">Status History</TabsTrigger>
          <TabsTrigger value="custody">Chain of Custody</TabsTrigger>
          <TabsTrigger value="work">Work Orders</TabsTrigger>
          <TabsTrigger value="sanitization">Sanitization</TabsTrigger>
          <TabsTrigger value="testing">Testing</TabsTrigger>
        </TabsList>

        <TabsContent value="images" className="space-y-4">
          <AssetImages assetId={asset.id} />
        </TabsContent>

        <TabsContent value="history" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Status History</CardTitle>
              <CardDescription>Complete audit trail of status changes</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {asset.statusHistory.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No status history</p>
                ) : (
                  asset.statusHistory.map((history: any, index: number) => (
                    <div key={history.id} className="flex items-start gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">
                            {history.fromStatus || "New"} → {history.toStatus}
                          </Badge>
                          <span className="text-sm text-muted-foreground">
                            {format(new Date(history.changedTs), "MMM d, yyyy HH:mm")}
                          </span>
                        </div>
                        {history.changer && (
                          <p className="text-sm text-muted-foreground mt-1">
                            Changed by {history.changer.name}
                          </p>
                        )}
                        {history.notes && (
                          <p className="text-sm mt-1">{history.notes}</p>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="custody" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Chain of Custody</CardTitle>
              <CardDescription>Complete audit trail of asset movements</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {asset.cocEvents.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No chain of custody events</p>
                ) : (
                  asset.cocEvents.map((event: any) => (
                    <div key={event.id} className="flex items-start gap-4 border-l-2 pl-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <Badge>{event.eventType}</Badge>
                          <span className="text-sm text-muted-foreground">
                            {format(new Date(event.eventTs), "MMM d, yyyy HH:mm")}
                          </span>
                        </div>
                        <div className="mt-1 text-sm">
                          {event.fromLocation && (
                            <span className="text-muted-foreground">
                              From: {event.fromLocation.name} →{" "}
                            </span>
                          )}
                          {event.toLocation && (
                            <span>{event.toLocation.name}</span>
                          )}
                        </div>
                        {event.performer && (
                          <p className="text-sm text-muted-foreground mt-1">
                            Performed by {event.performer.name}
                          </p>
                        )}
                        {event.notes && (
                          <p className="text-sm mt-1">{event.notes}</p>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="work" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Work Orders</CardTitle>
            </CardHeader>
            <CardContent>
              {asset.workOrders.length === 0 ? (
                <p className="text-sm text-muted-foreground">No work orders</p>
              ) : (
                <div className="space-y-4">
                  {asset.workOrders.map((wo: any) => (
                    <div key={wo.id} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <Badge>{wo.woType}</Badge>
                        <span className="text-sm text-muted-foreground">
                          {format(new Date(wo.openedAt), "MMM d, yyyy")}
                        </span>
                      </div>
                      {wo.tech && (
                        <p className="text-sm text-muted-foreground">
                          Tech: {wo.tech.name}
                        </p>
                      )}
                      {wo.notes && (
                        <p className="text-sm mt-2">{wo.notes}</p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="sanitization" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Sanitization Results</CardTitle>
            </CardHeader>
            <CardContent>
              {asset.sanitizationResults.length === 0 ? (
                <p className="text-sm text-muted-foreground">No sanitization results</p>
              ) : (
                <div className="space-y-4">
                  {asset.sanitizationResults.map((result: any) => (
                    <div key={result.id} className="border rounded-lg p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant={result.passed ? "default" : "destructive"}>
                          {result.passed ? "Passed" : "Failed"}
                        </Badge>
                        {result.verifiedAt && (
                          <span className="text-sm text-muted-foreground">
                            {format(new Date(result.verifiedAt), "MMM d, yyyy")}
                          </span>
                        )}
                      </div>
                      {result.verifier && (
                        <p className="text-sm text-muted-foreground">
                          Verified by {result.verifier.name}
                        </p>
                      )}
                      {result.certificateNumber && (
                        <p className="text-sm mt-1">
                          Certificate: {result.certificateNumber}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="testing" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Test Results</CardTitle>
            </CardHeader>
            <CardContent>
              {asset.testResults.length === 0 ? (
                <p className="text-sm text-muted-foreground">No test results</p>
              ) : (
                <div className="space-y-4">
                  {asset.testResults.map((test: any) => (
                    <div key={test.id} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium">{test.procedureCode}</span>
                        <Badge variant={test.passFlag ? "default" : "destructive"}>
                          {test.passFlag ? "Passed" : "Failed"}
                        </Badge>
                      </div>
                      {test.metric && (
                        <p className="text-sm">
                          {test.metric}: {test.value}
                        </p>
                      )}
                      {test.tester && (
                        <p className="text-sm text-muted-foreground mt-1">
                          Tested by {test.tester.name}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <SanitizeDialog
        open={sanitizeOpen}
        onOpenChange={setSanitizeOpen}
        assetId={asset.id}
        onSuccess={() => {
          router.refresh();
        }}
      />
    </div>
  );
}

