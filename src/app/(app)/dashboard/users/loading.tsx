import { Skeleton } from "@/components/ui/skeleton";

export default function UsersLoading() {
  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <Skeleton className="h-6 w-16" />
          <Skeleton className="h-4 w-36" />
        </div>
        <Skeleton className="h-8 w-24" />
      </div>
      <div className="border rounded-lg overflow-hidden">
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={i}
            className="flex items-center gap-4 px-4 py-3 border-b last:border-0"
          >
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-4 w-44" />
            <Skeleton className="h-6 w-20 rounded-md" />
            <Skeleton className="h-4 w-8 ml-auto" />
            <Skeleton className="h-4 w-24" />
          </div>
        ))}
      </div>
    </div>
  );
}
