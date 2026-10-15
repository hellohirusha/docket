import { notFound } from "next/navigation";
import { format } from "date-fns";
import { ChevronLeft, Clock, MapPin, Users, CalendarDays } from "lucide-react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { StatusBadge } from "@/components/app/status-badge";
import { StatusHistoryTimeline } from "../_components/status-history-timeline";
import { ReservationActions } from "../_components/reservation-actions";
import type { ReservationWithHistory } from "@/types";
import { getReservationById } from "@/actions/reservation.actions";
import { getSession } from "@/lib/auth";
import { formatDuration } from "@/lib/utils";

export const metadata = { title: "Reservation" };

export default async function ReservationDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [reservation, session] = await Promise.all([
    getReservationById(id),
    getSession(),
  ]);

  if (!reservation) notFound();

  const isAdmin = session.user.role === "ADMIN";
  const duration = formatDuration(
    new Date(reservation.startTime),
    new Date(reservation.endTime),
  );

  return (
    <div className="max-w-2xl space-y-6">
      {/* Back */}
      <Link
        href="/dashboard/reservations"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ChevronLeft className="w-4 h-4" />
        Back to reservations
      </Link>

      {/* Title + badge */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold">{reservation.resource.name}</h1>
          <p className="text-sm text-muted-foreground">
            {reservation.resource.category.name}
          </p>
        </div>
        <StatusBadge status={reservation.status} />
      </div>

      {/* Booking details */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Booking details
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-0.5">
              <p className="text-xs text-muted-foreground">Start</p>
              <p className="text-sm font-medium">
                {format(new Date(reservation.startTime), "EEE, d MMM yyyy")}
              </p>
              <p className="text-sm text-muted-foreground tabular-nums">
                {format(new Date(reservation.startTime), "HH:mm")}
              </p>
            </div>
            <div className="space-y-0.5">
              <p className="text-xs text-muted-foreground">End</p>
              <p className="text-sm font-medium">
                {format(new Date(reservation.endTime), "EEE, d MMM yyyy")}
              </p>
              <p className="text-sm text-muted-foreground tabular-nums">
                {format(new Date(reservation.endTime), "HH:mm")}
              </p>
            </div>
          </div>

          <Separator />

          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm">
              <Clock className="w-4 h-4 text-muted-foreground shrink-0" />
              <span className="text-muted-foreground">Duration:</span>
              <span className="font-medium">{duration}</span>
            </div>
            {reservation.resource.location && (
              <div className="flex items-center gap-2 text-sm">
                <MapPin className="w-4 h-4 text-muted-foreground shrink-0" />
                <span>{reservation.resource.location}</span>
              </div>
            )}
            {reservation.resource.capacity && (
              <div className="flex items-center gap-2 text-sm">
                <Users className="w-4 h-4 text-muted-foreground shrink-0" />
                <span className="text-muted-foreground">Capacity:</span>
                <span className="font-medium">
                  {reservation.resource.capacity}
                </span>
              </div>
            )}
            <div className="flex items-center gap-2 text-sm">
              <CalendarDays className="w-4 h-4 text-muted-foreground shrink-0" />
              <span className="text-muted-foreground">Submitted:</span>
              <span>
                {format(
                  new Date(reservation.createdAt),
                  "d MMM yyyy 'at' HH:mm",
                )}
              </span>
            </div>
          </div>

          {isAdmin && (
            <>
              <Separator />
              <div className="space-y-0.5">
                <p className="text-xs text-muted-foreground">Booked by</p>
                <p className="text-sm font-medium">{reservation.user.name}</p>
                <p className="text-xs text-muted-foreground">
                  {reservation.user.email}
                </p>
              </div>
            </>
          )}

          {reservation.notes && (
            <>
              <Separator />
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Notes</p>
                <p className="text-sm leading-relaxed">{reservation.notes}</p>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Actions */}
      <ReservationActions
        reservation={reservation as ReservationWithHistory}
        isAdmin={isAdmin}
        currentUserId={session.user.id}
      />

      {/* Status history */}
      {reservation.history && reservation.history.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Status history
            </CardTitle>
          </CardHeader>
          <CardContent>
            <StatusHistoryTimeline history={reservation.history} />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
