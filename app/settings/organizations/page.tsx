"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { OrganizationsTable } from "@/components/organizations/organizations-table";
import { OrganizationForm } from "@/components/organizations/organization-form";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export default function OrganizationsPage() {
  const [organizations, setOrganizations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState("all");
  const [formOpen, setFormOpen] = useState(false);
  const [editingOrg, setEditingOrg] = useState<any>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchOrganizations = async () => {
    try {
      const params = new URLSearchParams();
      if (filterType !== "all") {
        params.set("type", filterType);
      }
      params.set("active", "true");

      const response = await fetch(`/api/organizations?${params.toString()}`);
      if (response.ok) {
        const data = await response.json();
        setOrganizations(data);
      }
    } catch (error) {
      console.error("Error fetching organizations:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrganizations();
  }, [filterType]);

  const handleAdd = () => {
    setEditingOrg(null);
    setFormOpen(true);
  };

  const handleEdit = (org: any) => {
    setEditingOrg(org);
    setFormOpen(true);
  };

  const handleDelete = async () => {
    if (!deletingId) return;

    try {
      const response = await fetch(`/api/organizations/${deletingId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to delete organization");
      }

      await fetchOrganizations();
      setDeletingId(null);
    } catch (error) {
      console.error("Error deleting organization:", error);
      alert(error instanceof Error ? error.message : "Failed to delete organization");
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
          <h1 className="text-3xl font-bold tracking-tight">Organizations</h1>
          <p className="text-muted-foreground">
            Manage clients, suppliers, downstream vendors, and internal organizations
          </p>
        </div>
        <Button onClick={handleAdd}>
          <Plus className="mr-2 h-4 w-4" />
          Add Organization
        </Button>
      </div>

      <OrganizationsTable
        organizations={organizations}
        onEdit={handleEdit}
        onDelete={setDeletingId}
        filterType={filterType}
        onFilterTypeChange={setFilterType}
      />

      <OrganizationForm
        open={formOpen}
        onOpenChange={setFormOpen}
        organization={editingOrg}
        onSuccess={fetchOrganizations}
      />

      <AlertDialog open={deletingId !== null} onOpenChange={(open) => !open && setDeletingId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Organization?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. Organizations with existing assets cannot be deleted.
              Consider deactivating them instead.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

