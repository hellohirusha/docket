"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/app/confirm-dialog";
import { updateReservationStatus } from "@/actions/reservation.actions";
import { toast } from "sonner";
import type { ReservationWithHistory } from "@/types";
import type { ReservationStatus } from "@prisma/client";

interface Props {
  reservation: ReservationWithHistory;
  isAdmin: boolean;
  currentUserId: string;
}

export function ReservationActions({
  reservation,
  isAdmin,
  currentUserId,
}: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handle(status: ReservationStatus) {
    setLoading(true);
    const res = await updateReservationStatus(reservation.id, status);
    setLoading(false);
    if (!res.ok) {
      toast.error(res.message);
      return;
    }
    toast.success(`Reservation ${status.toLowerCase()}`);
    router.refresh();
  }

  const isOwner = reservation.userId === currentUserId;
  const canConfirm = isAdmin && reservation.status === "PENDING";
  const canComplete = isAdmin && reservation.status === "CONFIRMED";
  const canCancel =
    (isAdmin || isOwner) &&
    ["PENDING", "CONFIRMED"].includes(reservation.status);

  if (!canConfirm && !canComplete && !canCancel) return null;

  return (
    <div className="flex flex-wrap items-center gap-2">
      {canConfirm && (
        <Button
          size="sm"
          onClick={() => handle("CONFIRMED")}
          disabled={loading}
        >
          Confirm reservation
        </Button>
      )}
      {canComplete && (
        <Button
          size="sm"
          variant="outline"
          onClick={() => handle("COMPLETED")}
          disabled={loading}
        >
          Mark as completed
        </Button>
      )}
      {canCancel && (
        <ConfirmDialog
          trigger={
            <Button size="sm" variant="destructive" disabled={loading}>
              Cancel reservation
            </Button>
          }
          title="Cancel this reservation?"
          description="This will free the time slot for others. This action cannot be undone."
          onConfirm={() => handle("CANCELLED")}
          confirmLabel="Yes, cancel it"
        />
      )}
    </div>
  );
}
