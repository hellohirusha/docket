import { format } from "date-fns";
import { StatusBadge } from "@/components/app/status-badge";
import type { ReservationStatus } from "@prisma/client";

interface HistoryEntry {
  id: string;
  prevStatus: ReservationStatus | null;
  newStatus: ReservationStatus;
  createdAt: Date | string;
  actor: { name: string | null };
}

export function StatusHistoryTimeline({
  history,
}: {
  history: HistoryEntry[];
}) {
  return (
    <div className="relative">
      {/* Connecting line */}
      {history.length > 1 && (
        <div className="absolute left-3.75 top-4 bottom-4 w-px bg-border" />
      )}

      <div className="space-y-5">
        {history.map((entry, i) => (
          <div key={entry.id} className="relative flex gap-4">
            {/* Node */}
            <div className="relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-background border-2 border-border">
              <div
                className={`h-2 w-2 rounded-full ${
                  i === history.length - 1
                    ? "bg-primary"
                    : "bg-muted-foreground/40"
                }`}
              />
            </div>

            {/* Content */}
            <div className="flex-1 space-y-1 pt-0.5 pb-1">
              <div className="flex items-center gap-2 flex-wrap">
                <StatusBadge status={entry.newStatus} />
                {entry.prevStatus && (
                  <span className="text-xs text-muted-foreground">
                    from{" "}
                    <span className="font-medium capitalize">
                      {entry.prevStatus.toLowerCase()}
                    </span>
                  </span>
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                {entry.actor.name ?? "System"} ·{" "}
                {format(new Date(entry.createdAt), "d MMM yyyy 'at' HH:mm")}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
