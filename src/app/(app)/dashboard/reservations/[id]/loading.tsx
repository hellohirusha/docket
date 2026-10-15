import { Skeleton } from "@/components/ui/skeleton";

export default function ReservationDetailLoading() {
  return (
    <div className="max-w-2xl space-y-6">
      <Skeleton className="h-4 w-40" />
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <Skeleton className="h-6 w-52" />
          <Skeleton className="h-4 w-32" />
        </div>
        <Skeleton className="h-5 w-20 rounded-full" />
      </div>
      <Skeleton className="h-52 rounded-lg" />
      <Skeleton className="h-9 w-44" />
      <Skeleton className="h-40 rounded-lg" />
    </div>
  );
}
