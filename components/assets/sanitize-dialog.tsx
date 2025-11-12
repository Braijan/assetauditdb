"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
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

const sanitizeSchema = z.object({
  method: z.enum(["NIST_800_88_CLEAR", "NIST_800_88_PURGE", "PHYSICAL_DESTROY"]),
  toolName: z.string().optional(),
  toolVersion: z.string().optional(),
  certificateNumber: z.string().optional(),
  notes: z.string().optional(),
});

type SanitizeFormValues = z.infer<typeof sanitizeSchema>;

interface SanitizeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  assetId: string;
  onSuccess: () => void;
}

export function SanitizeDialog({
  open,
  onOpenChange,
  assetId,
  onSuccess,
}: SanitizeDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [certificateNumber, setCertificateNumber] = useState<string | null>(null);

  const form = useForm<SanitizeFormValues>({
    resolver: zodResolver(sanitizeSchema),
    defaultValues: {
      method: "NIST_800_88_PURGE",
      toolName: "",
      toolVersion: "",
      certificateNumber: "",
      notes: "",
    },
  });

  const onSubmit = async (data: SanitizeFormValues) => {
    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/assets/${assetId}/sanitize`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to sanitize asset");
      }

      const result = await response.json();
      setCertificateNumber(result.certificateNumber);
      onSuccess();
      
      // Close after 3 seconds to show certificate
      setTimeout(() => {
        onOpenChange(false);
        setCertificateNumber(null);
        form.reset();
      }, 3000);
    } catch (error) {
      console.error("Error sanitizing asset:", error);
      alert(error instanceof Error ? error.message : "Failed to sanitize asset");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (certificateNumber) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Sanitization Complete</DialogTitle>
            <DialogDescription>
              Hard drive has been sanitized to DOD standards
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <div className="rounded-lg border p-4 bg-green-50">
              <p className="text-sm font-medium text-green-800 mb-2">
                Certificate Number:
              </p>
              <p className="text-lg font-mono font-bold">{certificateNumber}</p>
              <p className="text-xs text-green-600 mt-2">
                This certificate confirms the hard drive was sanitized according to DOD standards.
              </p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Record Hard Drive Sanitization</DialogTitle>
          <DialogDescription>
            Record that this asset's hard drive has been wiped to DOD standards
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="method"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Sanitization Method *</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="NIST_800_88_PURGE">
                        NIST 800-88 Purge (DOD Standard)
                      </SelectItem>
                      <SelectItem value="NIST_800_88_CLEAR">
                        NIST 800-88 Clear
                      </SelectItem>
                      <SelectItem value="PHYSICAL_DESTROY">
                        Physical Destruction
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="toolName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tool Name</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Blancco" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="toolVersion"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tool Version</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., 6.0" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="certificateNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Certificate Number (Optional)</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Auto-generated if left blank"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes</FormLabel>
                  <FormControl>
                    <Textarea {...field} rows={3} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Recording..." : "Record Sanitization"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

