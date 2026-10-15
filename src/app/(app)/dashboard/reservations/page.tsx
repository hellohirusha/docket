import { getCurrentTimestamp, getReservations } from "@/actions/reservation.actions";
import { getSession } from "@/lib/auth";
import { ReservationList } from "./_components/reservation-list";
import { PageHeader } from "@/components/app/page-header";
import { EmptyState } from "@/components/app/empty-state";
import { Button } from "@/components/ui/button";
import { CalendarCheck, Plus } from "lucide-react";
import Link from "next/link";
import type { ReservationStatus } from "@prisma/client";
import { cn } from "@/lib/utils";
import { SortSelect } from "@/components/app/sort-select";

export const metadata = { title: "Reservations" };

const TABS: { label: string; value: ReservationStatus | "ALL" }[] = [
  { label: "All", value: "ALL" },
  { label: "Pending", value: "PENDING" },
  { label: "Confirmed", value: "CONFIRMED" },
  { label: "Completed", value: "COMPLETED" },
  { label: "Cancelled", value: "CANCELLED" },
];

const SORT_OPTIONS = [
  { value: "upcoming", label: "Upcoming first" },
  { value: "ongoing", label: "Ongoing first" },
  { value: "newest", label: "Recently created" },
  { value: "oldest", label: "Oldest created" },
];

export default async function ReservationsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; sort?: string }>;
}) {
  const params = await searchParams;
  const session = await getSession();
  const isAdmin = session.user.role === "ADMIN";
  const status = params.status as ReservationStatus | undefined;
  const sort = params.sort ?? "upcoming";

  const reservations = await getReservations(status ? { status } : undefined);
  const now = await getCurrentTimestamp();
  reservations.sort((a, b) => {
    if (sort === "ongoing") {
      const aOngoing = a.startTime.getTime() <= now && now < a.endTime.getTime();
      const bOngoing = b.startTime.getTime() <= now && now < b.endTime.getTime();
      if (aOngoing !== bOngoing) return aOngoing ? -1 : 1;
    }
    if (sort === "newest") return b.createdAt.getTime() - a.createdAt.getTime();
    if (sort === "oldest") return a.createdAt.getTime() - b.createdAt.getTime();
    return a.startTime.getTime() - b.startTime.getTime();
  });

  return (
    <div className="space-y-5">
      <PageHeader
        title="Reservations"
        description={
          reservations.length === 0
            ? isAdmin
              ? "No reservations yet"
              : "You have no reservations yet"
            : `${reservations.length} reservation${reservations.length !== 1 ? "s" : ""}${!isAdmin ? " for your account" : ""}`
        }
        action={
          <div className="flex items-center gap-3">
            <SortSelect value={sort} options={SORT_OPTIONS} />
            <Button asChild size="sm">
              <Link href="/dashboard/reservations/new">
                <Plus className="w-4 h-4 mr-1.5" />
                New reservation
              </Link>
            </Button>
          </div>
        }
      />

      {/* Status tabs */}
      <div className="flex gap-0 border-b overflow-x-auto">
        {TABS.map((tab) => {
          const active =
            (!params.status && tab.value === "ALL") ||
            params.status === tab.value;
          return (
            <Link
              key={tab.value}
              href={
                tab.value === "ALL"
                  ? "/dashboard/reservations"
                  : `/dashboard/reservations?status=${tab.value}`
              }
              className={cn(
                "px-4 py-2.5 text-sm border-b-2 -mb-px whitespace-nowrap transition-colors",
                active
                  ? "border-primary font-medium text-foreground"
                  : "border-transparent text-muted-foreground hover:text-foreground hover:border-muted-foreground/40",
              )}
            >
              {tab.label}
            </Link>
          );
        })}
      </div>

      {reservations.length === 0 ? (
        <EmptyState
          icon={CalendarCheck}
          title="No reservations found"
          description={
            status
              ? `No ${status.toLowerCase()} reservations to show.`
              : "Create a reservation to book a resource."
          }
          action={
            <Button asChild size="sm">
              <Link href="/dashboard/reservations/new">
                <Plus className="w-4 h-4 mr-1.5" />
                New reservation
              </Link>
            </Button>
          }
        />
      ) : (
        <ReservationList reservations={reservations} isAdmin={isAdmin} />
      )}
    </div>
  );
}
