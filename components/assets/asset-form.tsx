"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, X } from "lucide-react";

const assetFormSchema = z.object({
  clientId: z.string().min(1, "Client is required"),
  model: z.string().optional(),
  manufacturer: z.string().optional(),
  purchaseDate: z.string().optional(),
  dataBearing: z.boolean(),
  hazmat: z.boolean(),
  currentLocationId: z.string().optional(),
  assignedToId: z.string().optional(),
  resaleValue: z.number().optional(),
  // Technical Specifications
  processor: z.string().optional(),
  ramSizeGb: z.number().int().optional(),
  storageType: z.string().optional(),
  storageCapacityGb: z.number().int().optional(),
  screenSizeInches: z.number().optional(),
  operatingSystem: z.string().optional(),
  // R2v3 Compliance
  r2v3Compliance: z.enum(["COMPLIANT", "PENDING", "NONCOMPLIANT"]).optional(),
  complianceNotes: z.string().optional(),
  identifiers: z.array(z.object({
    idType: z.enum(["SERIAL", "CLIENT_TAG", "INT_TAG", "IMEI", "MAC", "UUID"]),
    idValue: z.string().min(1, "ID value is required"),
  })).min(1, "At least one identifier is required"),
  hardDrives: z.array(z.object({
    serialNumber: z.string().min(1, "Serial number is required"),
    capacityGb: z.number().int().optional(),
    valueUsd: z.number().optional(),
  })).optional(),
});

type AssetFormValues = z.infer<typeof assetFormSchema>;

interface AssetFormProps {
  clients: Array<{ id: string; name: string }>;
  locations: Array<{ id: string; name: string; orgParty: { name: string } }>;
  asset?: any;
}

export function AssetForm({ clients, locations, asset }: AssetFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<AssetFormValues>({
    resolver: zodResolver(assetFormSchema),
    defaultValues: asset ? {
      clientId: asset.clientId,
      model: asset.model || "",
      manufacturer: asset.manufacturer || "",
      dataBearing: asset.dataBearing ?? false,
      hazmat: asset.hazmat ?? false,
      currentLocationId: asset.currentLocationId || "",
      assignedToId: asset.assignedToId || "unassigned",
      resaleValue: asset.resaleValue ? Number(asset.resaleValue) : undefined,
      processor: asset.processor || "",
      ramSizeGb: asset.ramSizeGb || undefined,
      storageType: asset.storageType || "",
      storageCapacityGb: asset.storageCapacityGb || undefined,
      screenSizeInches: asset.screenSizeInches || undefined,
      operatingSystem: asset.operatingSystem || "",
      r2v3Compliance: asset.r2v3Compliance || undefined,
      complianceNotes: asset.complianceNotes || "",
      purchaseDate: asset.purchaseDate ? new Date(asset.purchaseDate).toISOString().split("T")[0] : "",
      identifiers: asset.identifiers?.length > 0 ? asset.identifiers.map((id: any) => ({
        idType: id.idType,
        idValue: id.idValue,
      })) : [{ idType: "SERIAL", idValue: "" }],
      hardDrives: asset.hardDrives?.length > 0 ? asset.hardDrives.map((hd: any) => ({
        serialNumber: hd.serialNumber,
        capacityGb: hd.capacityGb || undefined,
        valueUsd: hd.valueUsd ? Number(hd.valueUsd) : undefined,
      })) : [],
    } : {
      clientId: "",
      model: "",
      manufacturer: "",
      purchaseDate: "",
      dataBearing: false,
      hazmat: false,
      currentLocationId: "",
      assignedToId: "unassigned",
      resaleValue: undefined,
      processor: "",
      ramSizeGb: undefined,
      storageType: "",
      storageCapacityGb: undefined,
      screenSizeInches: undefined,
      operatingSystem: "",
      r2v3Compliance: undefined,
      complianceNotes: "",
      identifiers: [{ idType: "SERIAL", idValue: "" }],
      hardDrives: [],
    },
  });

  const identifiers = form.watch("identifiers");
  const hardDrives = form.watch("hardDrives") || [];

  const onSubmit = async (data: AssetFormValues) => {
    setIsSubmitting(true);
    try {
      const url = asset ? `/api/assets/${asset.id}` : "/api/assets";
      const method = asset ? "PATCH" : "POST";

      // Convert "unassigned" back to undefined for API
      const submitData = {
        ...data,
        assignedToId: data.assignedToId === "unassigned" ? undefined : data.assignedToId,
      };

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(submitData),
      });

      if (!response.ok) {
        const error = await response.json();
        const errorMessage = error.error || "Failed to save asset";
        const errorDetails = error.details ? `\n\nDetails: ${JSON.stringify(error.details, null, 2)}` : "";
        throw new Error(errorMessage + errorDetails);
      }

      const result = await response.json();
      router.push(`/assets/${result.id}`);
      router.refresh();
    } catch (error) {
      console.error("Error saving asset:", error);
      alert(error instanceof Error ? error.message : "Failed to save asset");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
            <CardDescription>Essential asset details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="clientId"
              render={({ field }) => (
                <FormItem>
                  <div className="flex items-center justify-between">
                    <FormLabel>Client *</FormLabel>
                    {clients.length === 0 && (
                      <Button
                        type="button"
                        variant="link"
                        className="h-auto p-0 text-sm"
                        onClick={(e) => {
                          e.preventDefault();
                          window.open("/settings/organizations", "_blank");
                        }}
                      >
                        Add Client
                      </Button>
                    )}
                  </div>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder={clients.length === 0 ? "No clients - click 'Add Client' above" : "Select a client"} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {clients.length === 0 ? (
                        <div className="px-2 py-6 text-center text-sm text-muted-foreground">
                          <p className="mb-2">No clients found</p>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={(e) => {
                              e.preventDefault();
                              window.open("/settings/organizations", "_blank");
                            }}
                          >
                            Go to Settings to Add Client
                          </Button>
                        </div>
                      ) : (
                        clients.map((client) => (
                          <SelectItem key={client.id} value={client.id}>
                            {client.name}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                  {clients.length === 0 && (
                    <p className="text-sm text-muted-foreground">
                      You need to add at least one client organization before creating assets.{" "}
                      <Button
                        type="button"
                        variant="link"
                        className="h-auto p-0 text-sm underline"
                        onClick={(e) => {
                          e.preventDefault();
                          window.open("/settings/organizations", "_blank");
                        }}
                      >
                        Add one now
                      </Button>
                    </p>
                  )}
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="manufacturer"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Manufacturer</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="model"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Model</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="purchaseDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Purchase Date</FormLabel>
                  <FormControl>
                    <Input type="date" value={field.value || ""} onChange={field.onChange} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Technical Specifications</CardTitle>
            <CardDescription>Hardware and software details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="processor"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Processor</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Intel Core i5-10210U" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="ramSizeGb"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>RAM Size (GB)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="0"
                        value={field.value ?? ""}
                        onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="storageType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Storage Type</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select storage type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="SSD">SSD</SelectItem>
                        <SelectItem value="NVME">NVME</SelectItem>
                        <SelectItem value="HDD">HDD</SelectItem>
                        <SelectItem value="eMMC">eMMC</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="storageCapacityGb"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Storage Capacity (GB)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="0"
                        value={field.value ?? ""}
                        onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="screenSizeInches"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Screen Size (inches)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.1"
                        value={field.value ?? ""}
                        onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="operatingSystem"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Operating System</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Windows 10 Pro" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>R2v3 Compliance</CardTitle>
            <CardDescription>Compliance status and notes</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="r2v3Compliance"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>R2v3 Compliance Status</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select compliance status" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="COMPLIANT">Compliant</SelectItem>
                      <SelectItem value="PENDING">Pending</SelectItem>
                      <SelectItem value="NONCOMPLIANT">Noncompliant</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="complianceNotes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Compliance Notes</FormLabel>
                  <FormControl>
                    <Textarea placeholder="e.g., Minor scratches on lid" {...field} rows={3} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Identifiers *</CardTitle>
            <CardDescription>At least one identifier is required</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {identifiers.map((_, index) => (
              <div key={index} className="flex gap-2">
                <FormField
                  control={form.control}
                  name={`identifiers.${index}.idType`}
                  render={({ field }) => (
                    <FormItem className="flex-1">
                      <FormControl>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="SERIAL">Serial Number</SelectItem>
                            <SelectItem value="CLIENT_TAG">Client Tag</SelectItem>
                            <SelectItem value="INT_TAG">Internal Tag</SelectItem>
                            <SelectItem value="IMEI">IMEI</SelectItem>
                            <SelectItem value="MAC">MAC Address</SelectItem>
                            <SelectItem value="UUID">UUID</SelectItem>
                          </SelectContent>
                        </Select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name={`identifiers.${index}.idValue`}
                  render={({ field }) => (
                    <FormItem className="flex-[2]">
                      <FormControl>
                        <Input placeholder="Enter identifier value" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                {identifiers.length > 1 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      const current = form.getValues("identifiers");
                      form.setValue("identifiers", current.filter((_, i) => i !== index));
                    }}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            ))}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                form.setValue("identifiers", [
                  ...identifiers,
                  { idType: "SERIAL", idValue: "" },
                ]);
              }}
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Identifier
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Hard Drives</CardTitle>
            <CardDescription>Track individual hard drives in this asset</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {hardDrives.map((_, index) => (
              <div key={index} className="flex gap-2 border rounded-lg p-4">
                <div className="flex-1 grid grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name={`hardDrives.${index}.serialNumber`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Serial Number *</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., sn123456789" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name={`hardDrives.${index}.capacityGb`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Capacity (GB)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min="0"
                            value={field.value ?? ""}
                            onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name={`hardDrives.${index}.valueUsd`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Value (USD)</FormLabel>
                        <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        value={field.value ?? ""}
                        onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                      />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    const current = form.getValues("hardDrives") || [];
                    form.setValue("hardDrives", current.filter((_, i) => i !== index));
                  }}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                const current = form.getValues("hardDrives") || [];
                form.setValue("hardDrives", [
                  ...current,
                  { serialNumber: "", capacityGb: undefined, valueUsd: undefined },
                ]);
              }}
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Hard Drive
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Additional Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="currentLocationId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Current Location</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select location" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {locations.map((location) => (
                          <SelectItem key={location.id} value={location.id}>
                            {location.orgParty.name} - {location.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="assignedToId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Assigned To</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Unassigned" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="unassigned">Unassigned</SelectItem>
                        {/* Users would be populated here - for now empty */}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="resaleValue"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Asset Value (USD)</FormLabel>
                  <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        value={field.value ?? ""}
                        onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                      />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex gap-4">
              <FormField
                control={form.control}
                name="dataBearing"
                render={({ field }) => (
                  <FormItem className="flex items-center space-x-2 space-y-0">
                    <FormControl>
                      <input
                        type="checkbox"
                        checked={field.value}
                        onChange={field.onChange}
                        className="rounded"
                      />
                    </FormControl>
                    <FormLabel>Data Bearing</FormLabel>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="hazmat"
                render={({ field }) => (
                  <FormItem className="flex items-center space-x-2 space-y-0">
                    <FormControl>
                      <input
                        type="checkbox"
                        checked={field.value}
                        onChange={field.onChange}
                        className="rounded"
                      />
                    </FormControl>
                    <FormLabel>Hazmat</FormLabel>
                  </FormItem>
                )}
              />
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Saving..." : asset ? "Update Asset" : "Create Asset"}
          </Button>
        </div>
      </form>
    </Form>
  );
}

