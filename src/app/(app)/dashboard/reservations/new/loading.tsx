import { Skeleton } from "@/components/ui/skeleton";

export default function NewReservationLoading() {
  return (
    <div className="max-w-xl space-y-5">
      <div className="space-y-1">
        <Skeleton className="h-6 w-40" />
        <Skeleton className="h-4 w-56" />
      </div>
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="space-y-1.5">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-10 w-full" />
        </div>
      ))}
      <Skeleton className="h-10 w-44" />
    </div>
  );
}
