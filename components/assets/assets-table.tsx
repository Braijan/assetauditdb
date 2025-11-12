"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import Link from "next/link";
import { format } from "date-fns";
import { Eye, ChevronLeft, ChevronRight } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";

const statusColors: Record<string, string> = {
  RECEIVED: "bg-blue-100 text-blue-800",
  IN_PROCESS: "bg-yellow-100 text-yellow-800",
  SANITIZED: "bg-green-100 text-green-800",
  READY_FOR_SALE: "bg-purple-100 text-purple-800",
  SCRAPPED: "bg-gray-100 text-gray-800",
  SHIPPED: "bg-indigo-100 text-indigo-800",
  DESTROYED: "bg-red-100 text-red-800",
};

interface Asset {
  id: string;
  manufacturer: string | null;
  model: string | null;
  currentStatus: string;
  receivedDate: Date | null;
  client: { name: string };
  currentLocation: { name: string } | null;
  identifiers: Array<{ idType: string; idValue: string }>;
}

interface Client {
  id: string;
  name: string;
}

interface AssetsTableProps {
  assets: Asset[];
  clients: Client[];
  currentStatus?: string;
  currentClientId?: string;
  page: number;
  total: number;
}

export function AssetsTable({
  assets,
  clients,
  currentStatus,
  currentClientId,
  page,
  total,
}: AssetsTableProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const handleFilterChange = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    params.set("page", "1");
    router.push(`/assets?${params.toString()}`);
  };

  const totalPages = Math.ceil(total / 50);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <Select
          value={currentStatus || "all"}
          onValueChange={(value) =>
            handleFilterChange("status", value === "all" ? "" : value)
          }
        >
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Filter by status" />
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

        <Select
          value={currentClientId || "all"}
          onValueChange={(value) =>
            handleFilterChange("clientId", value === "all" ? "" : value)
          }
        >
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Filter by client" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Clients</SelectItem>
            {clients.map((client) => (
              <SelectItem key={client.id} value={client.id}>
                {client.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ID</TableHead>
              <TableHead>Manufacturer / Model</TableHead>
              <TableHead>Client</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Location</TableHead>
              <TableHead>Received</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {assets.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-muted-foreground">
                  No assets found
                </TableCell>
              </TableRow>
            ) : (
              assets.map((asset) => (
                <TableRow key={asset.id}>
                  <TableCell className="font-mono text-sm">
                    {asset.identifiers[0]?.idValue || asset.id.slice(0, 8)}
                  </TableCell>
                  <TableCell>
                    <div>
                      <div className="font-medium">
                        {asset.manufacturer || "Unknown"} {asset.model || ""}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>{asset.client.name}</TableCell>
                  <TableCell>
                    <Badge
                      className={statusColors[asset.currentStatus] || "bg-gray-100 text-gray-800"}
                    >
                      {asset.currentStatus.replace("_", " ")}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {asset.currentLocation?.name || "No location"}
                  </TableCell>
                  <TableCell>
                    {asset.receivedDate
                      ? format(new Date(asset.receivedDate), "MMM d, yyyy")
                      : "—"}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button asChild variant="ghost" size="sm">
                      <Link href={`/assets/${asset.id}`}>
                        <Eye className="h-4 w-4" />
                      </Link>
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            Showing {(page - 1) * 50 + 1} to {Math.min(page * 50, total)} of {total} assets
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page === 1}
              onClick={() => {
                const params = new URLSearchParams(searchParams.toString());
                params.set("page", (page - 1).toString());
                router.push(`/assets?${params.toString()}`);
              }}
            >
              <ChevronLeft className="h-4 w-4" />
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= totalPages}
              onClick={() => {
                const params = new URLSearchParams(searchParams.toString());
                params.set("page", (page + 1).toString());
                router.push(`/assets?${params.toString()}`);
              }}
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

