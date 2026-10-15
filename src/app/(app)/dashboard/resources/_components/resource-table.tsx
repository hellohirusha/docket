"use client";

import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal } from "lucide-react";
import { deleteResources } from "@/actions/resource.actions";
import { BulkDeleteToolbar } from "@/components/app/bulk-delete-toolbar";
import { StatusBadge } from "@/components/app/status-badge";
import { EditResourceDialog } from "./edit-resource-dialog";
import { updateResourceStatus } from "@/actions/resource.actions";
import { toast } from "sonner";
import type { ResourceStatus } from "@prisma/client";
import type { ResourceWithDetails, CategoryWithCount } from "@/types";

interface Props {
  resources: ResourceWithDetails[];
  categories: CategoryWithCount[];
  isAdmin: boolean;
}

export function ResourceTable({ resources, categories, isAdmin }: Props) {
  const [pending, setPending] = useState<string | null>(null);
  const [selecting, setSelecting] = useState(false);
  const [selected, setSelected] = useState<string[]>([]);
  const [deleting, setDeleting] = useState(false);

  async function handleStatus(id: string, status: ResourceStatus) {
    setPending(id);
    const res = await updateResourceStatus(id, status);
    setPending(null);
    if (!res.ok) toast.error(res.message);
    else toast.success("Status updated");
  }
  async function handleDelete() {
    setDeleting(true); const res = await deleteResources(selected); setDeleting(false);
    if (!res.ok) toast.error(res.message); else { toast.success(`${res.data.deleted} resource${res.data.deleted === 1 ? "" : "s"} deleted`); setSelected([]); setSelecting(false); }
  }

  return (
    <div className="space-y-4">
      {isAdmin && <div className="flex justify-end"><BulkDeleteToolbar selecting={selecting} selectedCount={selected.length} onStart={() => setSelecting(true)} onCancel={() => { setSelecting(false); setSelected([]); }} onConfirm={handleDelete} pending={deleting} /></div>}
      <div className="border rounded-lg overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            {selecting && <TableHead className="w-10" />}
            <TableHead>Name</TableHead>
            <TableHead>Category</TableHead>
            <TableHead>Capacity</TableHead>
            <TableHead>Location</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Active bookings</TableHead>
            {isAdmin && <TableHead className="w-10" />}
          </TableRow>
        </TableHeader>
        <TableBody>
          {resources.map((r) => (
            <TableRow
              key={r.id}
              className={
                pending === r.id ? "opacity-40 pointer-events-none" : ""
              }
            >
              {selecting && <TableCell><input type="checkbox" aria-label={`Select ${r.name}`} checked={selected.includes(r.id)} onChange={(e) => setSelected((current) => e.target.checked ? [...current, r.id] : current.filter((id) => id !== r.id))} className="h-4 w-4" /></TableCell>}
              <TableCell className="font-medium">{r.name}</TableCell>
              <TableCell className="text-muted-foreground text-sm">
                {r.category.name}
              </TableCell>
              <TableCell className="text-muted-foreground text-sm">
                {r.capacity ?? "—"}
              </TableCell>
              <TableCell className="text-muted-foreground text-sm">
                {r.location ?? "—"}
              </TableCell>
              <TableCell>
                <StatusBadge status={r.status} />
              </TableCell>
              <TableCell className="text-right text-muted-foreground text-sm">
                {r._count.reservations}
              </TableCell>
              {isAdmin && (
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-7 w-7">
                        <MoreHorizontal className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        asChild
                        onSelect={(e) => e.preventDefault()}
                      >
                        <div>
                          <EditResourceDialog
                            resource={r}
                            categories={categories}
                          />
                        </div>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      {r.status !== "ACTIVE" && (
                        <DropdownMenuItem
                          onClick={() => handleStatus(r.id, "ACTIVE")}
                        >
                          Set active
                        </DropdownMenuItem>
                      )}
                      {r.status !== "UNDER_MAINTENANCE" && (
                        <DropdownMenuItem
                          onClick={() =>
                            handleStatus(r.id, "UNDER_MAINTENANCE")
                          }
                        >
                          Set maintenance
                        </DropdownMenuItem>
                      )}
                      {r.status !== "INACTIVE" && (
                        <DropdownMenuItem
                          variant="destructive"
                          onClick={() => handleStatus(r.id, "INACTIVE")}
                        >
                          Deactivate
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              )}
            </TableRow>
          ))}
        </TableBody>
      </Table>
      </div>
    </div>
  );
}
