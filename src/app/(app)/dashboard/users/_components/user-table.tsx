"use client";

import { useState } from "react";
import { format } from "date-fns";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { updateUserRole } from "@/actions/user.actions";
import { toast } from "sonner";
import type { UserWithStats } from "@/types";
import type { Role } from "@prisma/client";
import { deleteUsers } from "@/actions/user.actions";
import { BulkDeleteToolbar } from "@/components/app/bulk-delete-toolbar";

export function UserTable({
  users,
  currentUserId,
}: {
  users: UserWithStats[];
  currentUserId: string;
}) {
  const [pending, setPending] = useState<string | null>(null);
  const [selecting, setSelecting] = useState(false);
  const [selected, setSelected] = useState<string[]>([]);
  const [deleting, setDeleting] = useState(false);

  async function handleRole(userId: string, role: Role) {
    setPending(userId);
    const res = await updateUserRole(userId, role);
    setPending(null);
    if (!res.ok) toast.error(res.message);
    else toast.success("Role updated");
  }
  async function handleDelete() {
    setDeleting(true); const res = await deleteUsers(selected); setDeleting(false);
    if (!res.ok) toast.error(res.message); else { toast.success(`${res.data.deleted} user${res.data.deleted === 1 ? "" : "s"} deleted`); setSelected([]); setSelecting(false); }
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end"><BulkDeleteToolbar selecting={selecting} selectedCount={selected.length} onStart={() => setSelecting(true)} onCancel={() => { setSelecting(false); setSelected([]); }} onConfirm={handleDelete} pending={deleting} /></div>
      <div className="border rounded-lg overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            {selecting && <TableHead className="w-10" />}
            <TableHead>Name</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Role</TableHead>
            <TableHead className="text-right">Reservations</TableHead>
            <TableHead>Joined</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.map((u) => {
            const isSelf = u.id === currentUserId;
            return (
              <TableRow
                key={u.id}
                className={
                  pending === u.id ? "opacity-40 pointer-events-none" : ""
                }
              >
                {selecting && <TableCell>
                  {!isSelf && <input type="checkbox" aria-label={`Select ${u.name}`} checked={selected.includes(u.id)} onChange={(e) => setSelected((current) => e.target.checked ? [...current, u.id] : current.filter((id) => id !== u.id))} className="h-4 w-4" />}
                </TableCell>}
                <TableCell className="font-medium">
                  {u.name}
                  {isSelf && (
                    <span className="ml-1.5 text-xs text-muted-foreground font-normal">
                      (you)
                    </span>
                  )}
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {u.email}
                </TableCell>
                <TableCell>
                  {isSelf ? (
                    <Badge
                      variant={u.role === "ADMIN" ? "default" : "secondary"}
                    >
                      {u.role}
                    </Badge>
                  ) : (
                    <Select
                      defaultValue={u.role}
                      onValueChange={(v) => handleRole(u.id, v as Role)}
                      disabled={!!pending}
                    >
                      <SelectTrigger className="h-7 w-28 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ADMIN">ADMIN</SelectItem>
                        <SelectItem value="MEMBER">MEMBER</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                </TableCell>
                <TableCell className="text-right text-muted-foreground text-sm">
                  {u._count.reservations}
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {format(new Date(u.createdAt), "d MMM yyyy")}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
      </div>
    </div>
  );
}
