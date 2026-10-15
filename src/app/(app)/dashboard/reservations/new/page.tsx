import { getResources } from "@/actions/resource.actions";
import { ReservationForm } from "../_components/reservation-form";
import { PageHeader } from "@/components/app/page-header";
import { EmptyState } from "@/components/app/empty-state";
import { Button } from "@/components/ui/button";
import { ChevronLeft, Boxes } from "lucide-react";
import Link from "next/link";

export const metadata = { title: "New Reservation" };

export default async function NewReservationPage() {
  const resources = await getResources();
  const activeResources = resources.filter((r) => r.status === "ACTIVE");

  return (
    <div className="max-w-xl space-y-5">
      <Link
        href="/dashboard/reservations"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ChevronLeft className="w-4 h-4" />
        Back to reservations
      </Link>

      <PageHeader
        title="New reservation"
        description="Choose a resource and select a time window."
      />

      {activeResources.length === 0 ? (
        <EmptyState
          icon={Boxes}
          title="No active resources available"
          description="There are no resources available for booking right now. Please contact an admin."
          action={
            <Button asChild variant="outline" size="sm">
              <Link href="/dashboard/resources">View resources</Link>
            </Button>
          }
        />
      ) : (
        <ReservationForm resources={activeResources} />
      )}
    </div>
  );
}
