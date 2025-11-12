"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Plus, Eye } from "lucide-react";
import Link from "next/link";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { format } from "date-fns";

interface WorkOrder {
  id: string;
  woType: string;
  openedAt: Date;
  closedAt: Date | null;
  asset: {
    identifiers: Array<{ idValue: string }>;
    manufacturer: string | null;
    model: string | null;
    client: { name: string };
  };
  tech: { name: string } | null;
  _count: { steps: number };
}

export default function WorkOrdersPage() {
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");

  useEffect(() => {
    fetchWorkOrders();
  }, [statusFilter]);

  const fetchWorkOrders = async () => {
    try {
      const params = new URLSearchParams();
      if (statusFilter !== "all") {
        params.set("status", statusFilter);
      }
      const response = await fetch(`/api/work-orders?${params.toString()}`);
      if (response.ok) {
        const data = await response.json();
        setWorkOrders(data);
      }
    } catch (error) {
      console.error("Error fetching work orders:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex-1 space-y-6 p-6">
        <p>Loading...</p>
      </div>
    );
  }

  const typeColors: Record<string, string> = {
    TEST: "bg-blue-100 text-blue-800",
    REPAIR: "bg-yellow-100 text-yellow-800",
    SANITIZE: "bg-green-100 text-green-800",
    TEARDOWN: "bg-purple-100 text-purple-800",
  };

  return (
    <div className="flex-1 space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Work Orders</h1>
          <p className="text-muted-foreground">
            Manage work orders for testing, repair, sanitization, and teardown
          </p>
        </div>
        <Button asChild>
          <Link href="/work-orders/new">
            <Plus className="mr-2 h-4 w-4" />
            Create Work Order
          </Link>
        </Button>
      </div>

      <div className="flex items-center gap-4">
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[200px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="open">Open</SelectItem>
            <SelectItem value="closed">Closed</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Type</TableHead>
              <TableHead>Asset</TableHead>
              <TableHead>Client</TableHead>
              <TableHead>Tech</TableHead>
              <TableHead>Opened</TableHead>
              <TableHead>Steps</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {workOrders.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center text-muted-foreground">
                  No work orders found
                </TableCell>
              </TableRow>
            ) : (
              workOrders.map((wo) => (
                <TableRow key={wo.id}>
                  <TableCell>
                    <Badge className={typeColors[wo.woType] || "bg-gray-100 text-gray-800"}>
                      {wo.woType}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div>
                      <div className="font-medium">
                        {wo.asset.manufacturer || "Unknown"} {wo.asset.model || ""}
                      </div>
                      <div className="text-sm text-muted-foreground font-mono">
                        {wo.asset.identifiers[0]?.idValue || wo.id.slice(0, 8)}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>{wo.asset.client.name}</TableCell>
                  <TableCell>{wo.tech?.name || "—"}</TableCell>
                  <TableCell>
                    {format(new Date(wo.openedAt), "MMM d, yyyy")}
                  </TableCell>
                  <TableCell>{wo._count.steps}</TableCell>
                  <TableCell>
                    <Badge variant={wo.closedAt ? "secondary" : "default"}>
                      {wo.closedAt ? "Closed" : "Open"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button asChild variant="ghost" size="sm">
                      <Link href={`/work-orders/${wo.id}`}>
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
    </div>
  );
}
