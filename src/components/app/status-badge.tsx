import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { ResourceStatus, ReservationStatus } from "@prisma/client";

type Status = ResourceStatus | ReservationStatus;

interface Config {
  label: string;
  className: string;
}

const CONFIG: Record<Status, Config> = {
  ACTIVE: {
    label: "Active",
    className: "bg-emerald-500/10 text-emerald-700 border-emerald-500/20",
  },
  INACTIVE: {
    label: "Inactive",
    className: "bg-slate-100 text-slate-600 border-slate-200",
  },
  UNDER_MAINTENANCE: {
    label: "Maintenance",
    className: "bg-amber-500/10 text-amber-700 border-amber-500/20",
  },
  PENDING: {
    label: "Pending",
    className: "bg-sky-500/10 text-sky-700 border-sky-500/20",
  },
  CONFIRMED: {
    label: "Confirmed",
    className: "bg-emerald-500/10 text-emerald-700 border-emerald-500/20",
  },
  COMPLETED: {
    label: "Completed",
    className: "bg-slate-100 text-slate-500 border-slate-200",
  },
  CANCELLED: {
    label: "Cancelled",
    className: "bg-red-500/10 text-red-700 border-red-500/20",
  },
};

export function StatusBadge({
  status,
  className,
}: {
  status: Status;
  className?: string;
}) {
  const cfg = CONFIG[status];
  return (
    <Badge
      variant="outline"
      className={cn("font-medium text-xs", cfg.className, className)}
    >
      {cfg.label}
    </Badge>
  );
}
