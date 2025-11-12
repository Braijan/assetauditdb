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
import { format } from "date-fns";

interface IntakeOrder {
  id: string;
  orderNumber: string;
  receivedDate: Date;
  packingListNum: string | null;
  totalWeightKg: number | null;
  client: { name: string };
  _count: { lines: number };
}

export default function IntakePage() {
  const [orders, setOrders] = useState<IntakeOrder[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const response = await fetch("/api/intake");
      if (response.ok) {
        const data = await response.json();
        setOrders(data);
      }
    } catch (error) {
      console.error("Error fetching intake orders:", error);
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

  return (
    <div className="flex-1 space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Intake Orders</h1>
          <p className="text-muted-foreground">
            Manage incoming asset shipments and intake orders
          </p>
        </div>
        <Button asChild>
          <Link href="/intake/new">
            <Plus className="mr-2 h-4 w-4" />
            Create Intake Order
          </Link>
        </Button>
      </div>

      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Order Number</TableHead>
              <TableHead>Client</TableHead>
              <TableHead>Received Date</TableHead>
              <TableHead>Packing List</TableHead>
              <TableHead>Items</TableHead>
              <TableHead>Weight (kg)</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {orders.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-muted-foreground">
                  No intake orders found
                </TableCell>
              </TableRow>
            ) : (
              orders.map((order) => (
                <TableRow key={order.id}>
                  <TableCell className="font-medium">{order.orderNumber}</TableCell>
                  <TableCell>{order.client.name}</TableCell>
                  <TableCell>
                    {format(new Date(order.receivedDate), "MMM d, yyyy")}
                  </TableCell>
                  <TableCell>{order.packingListNum || "—"}</TableCell>
                  <TableCell>{order._count.lines}</TableCell>
                  <TableCell>
                    {order.totalWeightKg ? `${order.totalWeightKg} kg` : "—"}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button asChild variant="ghost" size="sm">
                      <Link href={`/intake/${order.id}`}>
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
