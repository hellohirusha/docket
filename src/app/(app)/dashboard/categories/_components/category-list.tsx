"use client";

import { Boxes } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { deleteCategories } from "@/actions/category.actions";
import { BulkDeleteToolbar } from "@/components/app/bulk-delete-toolbar";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { CategoryWithCount } from "@/types";

export function CategoryList({
  categories,
}: {
  categories: CategoryWithCount[];
}) {
  const [selecting, setSelecting] = useState(false);
  const [selected, setSelected] = useState<string[]>([]);
  const [pending, setPending] = useState(false);
  async function handleDelete() {
    setPending(true);
    const result = await deleteCategories(selected);
    setPending(false);
    if (!result.ok) toast.error(result.message);
    else { toast.success(`${result.data.deleted} categor${result.data.deleted === 1 ? "y" : "ies"} deleted`); setSelected([]); setSelecting(false); }
  }
  return (
    <div className="space-y-4">
      <div className="flex justify-end"><BulkDeleteToolbar selecting={selecting} selectedCount={selected.length} onStart={() => setSelecting(true)} onCancel={() => { setSelecting(false); setSelected([]); }} onConfirm={handleDelete} pending={pending} /></div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {categories.map((cat) => (
        <Card key={cat.id} className="group hover:shadow-sm transition-shadow relative">
          <CardHeader className="pb-3">
            {selecting && <input type="checkbox" aria-label={`Select ${cat.name}`} checked={selected.includes(cat.id)} onChange={(e) => setSelected((current) => e.target.checked ? [...current, cat.id] : current.filter((id) => id !== cat.id))} className="absolute right-4 top-4 h-4 w-4" />}
            <div className="flex items-start justify-between gap-2">
              <div className="p-2 rounded-md bg-primary/5 group-hover:bg-primary/10 transition-colors">
                <Boxes className="w-4 h-4 text-primary" />
              </div>
              <Badge variant="secondary" className={`text-xs font-normal ${selecting ? "mr-7" : ""}`}>
                {cat._count.resources}{" "}
                {cat._count.resources === 1 ? "resource" : "resources"}
              </Badge>
            </div>
            <CardTitle className="text-base mt-2">{cat.name}</CardTitle>
            {cat.description && (
              <CardDescription className="text-xs leading-relaxed">
                {cat.description}
              </CardDescription>
            )}
          </CardHeader>
        </Card>
      ))}
      </div>
    </div>
  );
}
