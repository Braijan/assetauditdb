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
import { Edit, Trash2, Plus } from "lucide-react";
import { format } from "date-fns";
import { useState } from "react";

const typeColors: Record<string, string> = {
  CUSTOMER: "bg-blue-100 text-blue-800",
  SUPPLIER: "bg-green-100 text-green-800",
  DOWNSTREAM: "bg-purple-100 text-purple-800",
  INTERNAL: "bg-gray-100 text-gray-800",
};

const riskTierColors: Record<string, string> = {
  LOW: "bg-green-100 text-green-800",
  MEDIUM: "bg-yellow-100 text-yellow-800",
  HIGH: "bg-orange-100 text-orange-800",
  CRITICAL: "bg-red-100 text-red-800",
};

interface Organization {
  id: string;
  type: string;
  name: string;
  r2Scope: string | null;
  riskTier: string | null;
  active: boolean;
  email: string | null;
  phone: string | null;
  city: string | null;
  state: string | null;
  createdAt: Date;
  _count: {
    assets: number;
    locations: number;
  };
}

interface OrganizationsTableProps {
  organizations: Organization[];
  onEdit: (org: Organization) => void;
  onDelete: (id: string) => void;
  filterType: string;
  onFilterTypeChange: (type: string) => void;
}

export function OrganizationsTable({
  organizations,
  onEdit,
  onDelete,
  filterType,
  onFilterTypeChange,
}: OrganizationsTableProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <Select value={filterType} onValueChange={onFilterTypeChange}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Filter by type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="CUSTOMER">Customers</SelectItem>
            <SelectItem value="SUPPLIER">Suppliers</SelectItem>
            <SelectItem value="DOWNSTREAM">Downstream</SelectItem>
            <SelectItem value="INTERNAL">Internal</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Risk Tier</TableHead>
              <TableHead>Contact</TableHead>
              <TableHead>Location</TableHead>
              <TableHead>Assets</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {organizations.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center text-muted-foreground">
                  No organizations found
                </TableCell>
              </TableRow>
            ) : (
              organizations.map((org) => (
                <TableRow key={org.id}>
                  <TableCell className="font-medium">{org.name}</TableCell>
                  <TableCell>
                    <Badge className={typeColors[org.type] || "bg-gray-100 text-gray-800"}>
                      {org.type}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {org.riskTier ? (
                      <Badge className={riskTierColors[org.riskTier] || "bg-gray-100 text-gray-800"}>
                        {org.riskTier}
                      </Badge>
                    ) : (
                      "—"
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      {org.email && <div>{org.email}</div>}
                      {org.phone && <div className="text-muted-foreground">{org.phone}</div>}
                      {!org.email && !org.phone && "—"}
                    </div>
                  </TableCell>
                  <TableCell>
                    {org.city || org.state ? (
                      <div className="text-sm">
                        {org.city}
                        {org.city && org.state && ", "}
                        {org.state}
                      </div>
                    ) : (
                      "—"
                    )}
                  </TableCell>
                  <TableCell>{org._count.assets}</TableCell>
                  <TableCell>
                    <Badge variant={org.active ? "default" : "secondary"}>
                      {org.active ? "Active" : "Inactive"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onEdit(org)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onDelete(org.id)}
                        disabled={org._count.assets > 0}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
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

