"use client";

import { useState } from "react";
import { format } from "date-fns";
import Link from "next/link";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/app/status-badge";
import { ConfirmDialog } from "@/components/app/confirm-dialog";
import { updateReservationStatus } from "@/actions/reservation.actions";
import { formatDuration } from "@/lib/utils";
import { toast } from "sonner";
import type { ReservationWithDetails } from "@/types";
import type { ReservationStatus } from "@prisma/client";

export function ReservationList({
  reservations,
  isAdmin,
}: {
  reservations: ReservationWithDetails[];
  isAdmin: boolean;
}) {
  const [pending, setPending] = useState<string | null>(null);

  async function handle(id: string, status: ReservationStatus) {
    setPending(id);
    const res = await updateReservationStatus(id, status);
    setPending(null);
    if (!res.ok) toast.error(res.message);
    else toast.success(`Reservation ${status.toLowerCase()}`);
  }

  return (
    <div className="border rounded-lg overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Resource</TableHead>
            {isAdmin && <TableHead>Booked by</TableHead>}
            <TableHead>Start</TableHead>
            <TableHead>Duration</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="w-40" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {reservations.map((r) => (
            <TableRow
              key={r.id}
              className={
                pending === r.id ? "opacity-40 pointer-events-none" : ""
              }
            >
              <TableCell>
                <Link
                  href={`/dashboard/reservations/${r.id}`}
                  className="font-medium hover:underline underline-offset-2"
                >
                  {r.resource.name}
                </Link>
                <p className="text-xs text-muted-foreground">
                  {r.resource.category.name}
                </p>
              </TableCell>
              {isAdmin && (
                <TableCell className="text-sm text-muted-foreground">
                  {r.user.name}
                </TableCell>
              )}
              <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                {format(new Date(r.startTime), "d MMM, HH:mm")}
              </TableCell>
              <TableCell className="text-sm text-muted-foreground">
                {formatDuration(new Date(r.startTime), new Date(r.endTime))}
              </TableCell>
              <TableCell>
                <StatusBadge status={r.status} />
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-1.5 justify-end">
                  {isAdmin && r.status === "PENDING" && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 text-xs"
                      onClick={() => handle(r.id, "CONFIRMED")}
                    >
                      Confirm
                    </Button>
                  )}
                  {isAdmin && r.status === "CONFIRMED" && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 text-xs"
                      onClick={() => handle(r.id, "COMPLETED")}
                    >
                      Complete
                    </Button>
                  )}
                  {["PENDING", "CONFIRMED"].includes(r.status) && (
                    <ConfirmDialog
                      trigger={
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 text-xs text-destructive hover:text-destructive"
                        >
                          Cancel
                        </Button>
                      }
                      title="Cancel this reservation?"
                      description="The time slot will become available again."
                      onConfirm={() => handle(r.id, "CANCELLED")}
                      confirmLabel="Yes, cancel"
                    />
                  )}
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
