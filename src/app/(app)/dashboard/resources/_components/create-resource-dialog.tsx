"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Plus } from "lucide-react";
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
import { createResource } from "@/actions/resource.actions";
import { toast } from "sonner";
import type { CategoryWithCount } from "@/types";

const schema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  description: z.string().max(300).optional(),
  categoryId: z.string().min(1, "Category is required"),
  capacity: z.coerce.number().int().positive().optional().or(z.literal("")),
  location: z.string().max(100).optional(),
  status: z.enum(["ACTIVE", "INACTIVE", "UNDER_MAINTENANCE"]).default("ACTIVE"),
});

type FormValues = z.infer<typeof schema>;

export function CreateResourceDialog({
  categories,
}: {
  categories: CategoryWithCount[];
}) {
  const [open, setOpen] = useState(false);
  const [selectedCategoryId, setSelectedCategoryId] = useState("");

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<z.input<typeof schema>, undefined, z.output<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: { status: "ACTIVE" },
  });

  async function onSubmit(values: FormValues) {
    const res = await createResource({
      ...values,
      capacity: values.capacity === "" ? undefined : values.capacity,
    });
    if (!res.ok) {
      toast.error(res.message);
      return;
    }
    toast.success("Resource created");
    reset();
    setSelectedCategoryId("");
    setOpen(false);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">
          <Plus className="w-4 h-4 mr-1.5" />
          Add resource
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create resource</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pt-2">
          <div className="space-y-1.5">
            <Label htmlFor="r-name">Name *</Label>
            <Input
              id="r-name"
              placeholder="e.g. Conference Room A"
              {...register("name")}
            />
            {errors.name && (
              <p className="text-xs text-destructive">{errors.name.message}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label>Category *</Label>
            <Select
              onValueChange={(v) => {
                const id = String(v);
                setSelectedCategoryId(id);
                setValue("categoryId", id);
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
            {errors.categoryId && (
              <p className="text-xs text-destructive">
                {errors.categoryId.message}
              </p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="r-desc">Description</Label>
            <Textarea
              id="r-desc"
              placeholder="Optional description..."
              rows={2}
              {...register("description")}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="r-cap">Capacity</Label>
              <Input
                id="r-cap"
                type="number"
                min="1"
                placeholder="e.g. 10"
                {...register("capacity")}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="r-loc">Location</Label>
              <Input
                id="r-loc"
                placeholder="e.g. Floor 3"
                {...register("location")}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Initial status</Label>
            <Select
              defaultValue="ACTIVE"
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
              onClick={() => {
                reset();
                setOpen(false);
              }}
            >
              Cancel
            </Button>
            <Button type="submit" size="sm" disabled={isSubmitting}>
              {isSubmitting ? "Creating..." : "Create resource"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
