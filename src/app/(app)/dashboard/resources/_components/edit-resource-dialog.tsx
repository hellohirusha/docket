"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { updateResource } from "@/actions/resource.actions";
import { toast } from "sonner";
import type { ResourceWithDetails, CategoryWithCount } from "@/types";

const schema = z.object({
  id: z.string().cuid(),
  name: z.string().min(1, "Name is required").max(100),
  description: z.string().max(300).optional(),
  categoryId: z.string().cuid(),
  capacity: z.coerce.number().int().positive().optional().or(z.literal("")),
  location: z.string().max(100).optional(),
  status: z.enum(["ACTIVE", "INACTIVE", "UNDER_MAINTENANCE"]),
});

type FormValues = z.infer<typeof schema>;

interface Props {
  resource: ResourceWithDetails;
  categories: CategoryWithCount[];
}

export function EditResourceDialog({ resource, categories }: Props) {
  const [open, setOpen] = useState(false);
  const [selectedCategoryId, setSelectedCategoryId] = useState(resource.categoryId);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<z.input<typeof schema>, undefined, z.output<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: {
      id: resource.id,
      name: resource.name,
      description: resource.description ?? "",
      categoryId: resource.categoryId,
      capacity: resource.capacity ?? "",
      location: resource.location ?? "",
      status: resource.status,
    },
  });

  async function onSubmit(values: FormValues) {
    const res = await updateResource({
      ...values,
      capacity: values.capacity === "" ? undefined : values.capacity,
    });
    if (!res.ok) {
      toast.error(res.message);
      return;
    }
    toast.success("Resource updated");
    setOpen(false);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" className="h-7 w-7">
          <Pencil className="w-3.5 h-3.5" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit resource</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pt-2">
          <input type="hidden" {...register("id")} />

          <div className="space-y-1.5">
            <Label htmlFor="e-name">Name *</Label>
            <Input id="e-name" {...register("name")} />
            {errors.name && (
              <p className="text-xs text-destructive">{errors.name.message}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label>Category *</Label>
            <Select
              defaultValue={resource.categoryId}
              onValueChange={(v) => {
                if (!v) return;
                setSelectedCategoryId(v);
                setValue("categoryId", v);
              }}
            >
              <SelectTrigger>
                <SelectValue>
                  {categories.find((c) => c.id === selectedCategoryId)?.name ??
                    "Select a category..."}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {categories.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="e-desc">Description</Label>
            <Textarea id="e-desc" rows={2} {...register("description")} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="e-cap">Capacity</Label>
              <Input
                id="e-cap"
                type="number"
                min="1"
                {...register("capacity")}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="e-loc">Location</Label>
              <Input id="e-loc" {...register("location")} />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Status</Label>
            <Select
              defaultValue={resource.status}
              onValueChange={(v) =>
                setValue(
                  "status",
                  v as "ACTIVE" | "INACTIVE" | "UNDER_MAINTENANCE",
                )
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ACTIVE">Active</SelectItem>
                <SelectItem value="INACTIVE">Inactive</SelectItem>
                <SelectItem value="UNDER_MAINTENANCE">
                  Under Maintenance
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex justify-end gap-2 pt-1">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" size="sm" disabled={isSubmitting}>
              {isSubmitting ? "Saving..." : "Save changes"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
